// app/api/invoices/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// ------------------------ GET ALL ------------------------
export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Invoices GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

// ------------------------ CREATE INVOICE ------------------------
export async function POST(request) {
  try {
    const data = await request.json();

    const {
      invoiceNumber,
      customerId,
      items,
      subtotal,
      discount,

      cgstPercent,
      cgstAmount,
      sgstPercent,
      sgstAmount,
      igstPercent,
      igstAmount,

      total,
      remarks,
      date,
    } = data;

    // 1. Create invoice header
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: customerId ? Number(customerId) : null,
        date: date ? new Date(date) : new Date(),

        subtotal: num(subtotal),
        discount: num(discount),

        cgstPercent: num(cgstPercent),
        cgstAmount: num(cgstAmount),
        sgstPercent: num(sgstPercent),
        sgstAmount: num(sgstAmount),
        igstPercent: num(igstPercent),
        igstAmount: num(igstAmount),

        total: num(total),
        remarks: remarks || "",
      },
    });

    // 2. Add items + decrement stock
    for (const item of items) {
      await prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          productId: Number(item.productId),
          quantity: num(item.quantity),
          pricePerUnit: num(item.pricePerUnit),
          total: num(item.total),
        },
      });
    }

    return NextResponse.json(invoice, { status: 201 });

  } catch (error) {
    console.error("Invoice POST Error:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
