import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function GET() {
  try {
    const data = await prisma.return.findMany({
      orderBy: { id: "desc" },
      include: { product: true, customer: true },
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Returns GET Error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      productId,
      customerId,
      quantity,
      amount,
      reason,
      date,
      invoiceNumber,
      isBroken,
    } = body;

    // ---- DATE ----
    let isoDate = new Date();
    if (date && date.trim() !== "") {
      isoDate = new Date(date + "T00:00:00");
    }

    // ---- NUMBERS ----
    const qty = safeNumber(quantity);
    const amt = safeNumber(amount);

    // ---- CREATE RETURN ----
    const returnRecord = await prisma.return.create({
      data: {
        productId: Number(productId),
        customerId: customerId ? Number(customerId) : null,
        quantity: qty,
        amount: amt,
        reason: reason || "",
        date: isoDate,
        invoiceNumber: invoiceNumber || null,
        isBroken: !!isBroken,
      },
    });

    // ---- SALE ADJUSTMENT (If invoiceNumber provided) ----
    if (invoiceNumber) {
        const sale = await prisma.sale.findFirst({
            where: {
                billNumber: invoiceNumber,
                productId: Number(productId)
            }
        });

        if (sale) {
            const oldNetAmount = sale.netAmount;
            const newQty = Math.max(0, sale.quantity - qty);
            const newTotalAmount = newQty * sale.rate;
            const newNetAmount = Math.max(0, newTotalAmount - sale.discount);
            
            // The amount by which the total required payment is reduced
            const reduction = Math.max(0, oldNetAmount - newNetAmount);
            
            // First, reduce the credit amount (what they owe)
            const creditReduction = Math.min(sale.creditAmount, reduction);
            const newCreditAmount = sale.creditAmount - creditReduction;
            
            // If the reduction is MORE than the credit, the rest is a refund (reduces paid amount)
            const paidReduction = Math.max(0, reduction - creditReduction);
            const newPaidAmount = Math.max(0, sale.paidAmount - paidReduction);

            await prisma.sale.update({
                where: { id: sale.id },
                data: {
                    quantity: newQty,
                    totalAmount: newTotalAmount,
                    netAmount: newNetAmount,
                    creditAmount: newCreditAmount,
                    paidAmount: newPaidAmount
                }
            });
        }
    }

    // ---- STOCK ADJUSTMENT ----
    // Only increment stock if NOT broken
    if (!isBroken) {
      await prisma.product.update({
        where: { id: Number(productId) },
        data: { quantity: { increment: qty } },
      });
    }

    return NextResponse.json(returnRecord);
  } catch (err) {
    console.error("Returns POST Error:", err);
    return NextResponse.json({ error: "Failed to save return" }, { status: 500 });
  }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const record = await prisma.return.findUnique({
            where: { id: Number(id) }
        });

        if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Reverse sale adjustment if it had an invoiceNumber
        if (record.invoiceNumber) {
            const sale = await prisma.sale.findFirst({
                where: {
                    billNumber: record.invoiceNumber,
                    productId: record.productId
                }
            });

            if (sale) {
                const restoredQty = sale.quantity + record.quantity;
                const restoredTotalAmount = restoredQty * sale.rate;
                const restoredNetAmount = Math.max(0, restoredTotalAmount - sale.discount);
                
                // We restore the credit amount based on the current paid amount
                // This correctly handles cases where credit was reduced.
                // If paid amount was reduced (refunded), it remains reduced but credit increases.
                const restoredCreditAmount = Math.max(0, restoredNetAmount - sale.paidAmount);

                await prisma.sale.update({
                    where: { id: sale.id },
                    data: {
                        quantity: restoredQty,
                        totalAmount: restoredTotalAmount,
                        netAmount: restoredNetAmount,
                        creditAmount: restoredCreditAmount
                    }
                });
            }
        }

        // Reverse stock adjustment if it was NOT broken
        if (!record.isBroken) {
            await prisma.product.update({
                where: { id: record.productId },
                data: { quantity: { decrement: record.quantity } }
            });
        }

        await prisma.return.delete({
            where: { id: Number(id) }
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Returns DELETE Error:", err);
        return NextResponse.json({ error: "Failed to delete return" }, { status: 500 });
    }
}
