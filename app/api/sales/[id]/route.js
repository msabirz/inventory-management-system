import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function GET(_, { params }) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: Number(params.id) },
      include: { 
        items: {
          include: { product: true }
        }, 
        customer: true 
      },
    });
    return NextResponse.json(sale || {});
  } catch (err) {
    console.error("Sale GET Error:", err);
    return NextResponse.json({}, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const id = Number(params.id);
    const body = await req.json();

    const {
      items, // array of { productId, quantity, rate, totalAmount }
      customerId,
      discount,
      paidAmount,
      creditAmount,
      netAmount,
      remarks,
      date,
      billNumber,
      customerPhone,
      paymentMode,
      paymentRef,
    } = body;

    // ---- DATE ----
    if (!date || date.trim() === "") {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }
    const isoDate = new Date(date + "T00:00:00");

    // ---- NUMBERS ----
    const itemsTotal = (items || []).reduce((sum, item) => sum + safeNumber(item.totalAmount), 0);
    const disc = safeNumber(discount);
    const net = safeNumber(netAmount || itemsTotal - disc);
    const paid = safeNumber(paidAmount);
    const credit = safeNumber(creditAmount || net - paid);

    const updatedSale = await prisma.$transaction(async (tx) => {
      // 1. Get old sale to restore stock
      const oldSale = await tx.sale.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!oldSale) throw new Error("Sale not found");

      // 2. Restore stock
      for (const item of oldSale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
      }

      // 3. Delete old items
      await tx.saleItem.deleteMany({
        where: { saleId: id },
      });

      // 4. Update Sale and Create new Items
      const sale = await tx.sale.update({
        where: { id },
        data: {
          customerId: customerId ? Number(customerId) : null,
          totalAmount: itemsTotal,
          discount: disc,
          netAmount: net,
          paidAmount: paid,
          creditAmount: credit,
          remarks: remarks || "",
          date: isoDate,
          billNumber: billNumber || null,
          paymentMode: paymentMode || null,
          paymentRef: paymentRef || null,
          items: {
            create: (items || []).map((item) => ({
              productId: Number(item.productId),
              quantity: safeNumber(item.quantity),
              rate: safeNumber(item.rate),
              pricePerUnit: safeNumber(item.rate),
              totalAmount: safeNumber(item.totalAmount),
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          customer: true
        }
      });

      // 5. Update Customer Phone
      const custId = customerId ? Number(customerId) : sale.customerId;
      if (custId && customerPhone) {
        await tx.customer.update({
          where: { id: Number(custId) },
          data: { phone: customerPhone },
        });
      }

      // 6. Decrease Stock for new items
      for (const item of (items || [])) {
        await tx.product.update({
          where: { id: Number(item.productId) },
          data: { quantity: { decrement: safeNumber(item.quantity) } },
        });
      }

      return sale;
    });

    return NextResponse.json(updatedSale);
  } catch (err) {
    console.error("Sale UPDATE Error:", err);
    return NextResponse.json({ error: "Failed to update sale" }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  try {
    const id = Number(params.id);

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Restore stock
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
      }

      // 2. Delete sale (items will be deleted via Cascade)
      await tx.sale.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Sale DELETE Error:", err);
    return NextResponse.json({ error: "Failed to delete sale" }, { status: 500 });
  }
}
