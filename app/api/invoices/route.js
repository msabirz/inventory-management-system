import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET ALL INVOICES
export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Invoices GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

// CREATE INVOICE
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
    } = data;

    // Create invoice header
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId,
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
      },
    });

    // Add line items + reduce stock
    for (let item of items) {
      await prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          productId: item.productId,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          total: item.total,
        },
      });

      // Reduce stock
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          quantity: { decrement: item.quantity },
        },
      });
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Invoice POST Error:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
