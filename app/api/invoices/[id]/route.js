// app/api/invoices/[id]/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET SINGLE INVOICE BY ID
export async function GET(request, { params }) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(params.id) },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Invoice GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

// UPDATE INVOICE (NO STOCK CHANGE)
export async function PUT(request, { params }) {
  try {
    const id = Number(params.id);
    const body = await request.json();

    const {
      invoiceNumber,
      customerId,
      date,
      items = [],
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
    } = body;

    // Basic validation
    if (!invoiceNumber) {
      return NextResponse.json(
        { error: "Invoice number is required" },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "At least one invoice item is required" },
        { status: 400 }
      );
    }

    // Optional date parsing: if provided, use it, else keep existing date
    let parsedDate = undefined;
    if (date) {
      const d = new Date(date + "T00:00:00");
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        );
      }
      parsedDate = d;
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update header
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          invoiceNumber,
          customerId: customerId ? Number(customerId) : null,
          subtotal: Number(subtotal) || 0,
          discount: Number(discount) || 0,

          cgstPercent: Number(cgstPercent) || 0,
          cgstAmount: Number(cgstAmount) || 0,
          sgstPercent: Number(sgstPercent) || 0,
          sgstAmount: Number(sgstAmount) || 0,
          igstPercent: Number(igstPercent) || 0,
          igstAmount: Number(igstAmount) || 0,

          total: Number(total) || 0,
          remarks: remarks || "",
          ...(parsedDate ? { date: parsedDate } : {}),
        },
      });

      // Replace items (NO STOCK LOGIC here)
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      for (const item of items) {
        await tx.invoiceItem.create({
          data: {
            invoiceId: id,
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            pricePerUnit: Number(item.pricePerUnit),
            total: Number(item.total),
          },
        });
      }

      return updatedInvoice;
    });

    // Return fresh invoice with relations
    const finalInvoice = await prisma.invoice.findUnique({
      where: { id: updated.id },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
    });

    return NextResponse.json(finalInvoice);
  } catch (error) {
    console.error("Invoice PUT Error:", error);

    // handle unique invoiceNumber conflict nicely
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Invoice number already exists (must be unique)" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

// DELETE INVOICE (NO STOCK CHANGE)
export async function DELETE(request, { params }) {
  try {
    const id = Number(params.id);

    await prisma.$transaction(async (tx) => {
      // Delete items first
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // Delete invoice
      await tx.invoice.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Invoice DELETE Error:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
