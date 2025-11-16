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
      include: { product: true, customer: true },
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
      productId,
      customerId,
      quantity,
      rate,
      pricePerUnit,
      remarks,
      date,
    } = body;

    // ---- DATE ----
    if (!date || date.trim() === "") {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }
    const isoDate = new Date(date + "T00:00:00");

    // ---- NUMBER CONVERSION ----
    const newQty = safeNumber(quantity);
    const newRate = safeNumber(rate);
    const newPPU = safeNumber(pricePerUnit || rate);
    const newProductId = Number(productId);

    const total = newQty * newRate;

    // ---- GET OLD SALE ----
    const oldSale = await prisma.sale.findUnique({ where: { id } });
    if (!oldSale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const oldQty = oldSale.quantity;
    const oldProductId = oldSale.productId;

    // ---- UPDATE SALE ENTRY ----
    const updated = await prisma.sale.update({
      where: { id },
      data: {
        productId: newProductId,
        customerId: customerId ? Number(customerId) : null,
        quantity: newQty,
        rate: newRate,
        pricePerUnit: newPPU,
        totalAmount: total,
        remarks: remarks || "",
        date: isoDate,
      },
    });

    // ---- STOCK ADJUSTMENT ----
    if (newProductId !== oldProductId) {
      // return qty to old product
      await prisma.product.update({
        where: { id: oldProductId },
        data: { quantity: { increment: oldQty } },
      });

      // subtract qty from new product
      await prisma.product.update({
        where: { id: newProductId },
        data: { quantity: { decrement: newQty } },
      });
    } else {
      // same product → adjust difference
      const diff = newQty - oldQty;

      if (diff !== 0) {
        await prisma.product.update({
          where: { id: newProductId },
          data: { quantity: { decrement: diff } },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Sale UPDATE Error:", err);
    return NextResponse.json(
      { error: "Failed to update sale" },
      { status: 500 }
    );
  }
}

export async function DELETE(_, { params }) {
  try {
    const id = Number(params.id);

    const sale = await prisma.sale.findUnique({ where: { id } });
    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // restore stock
    await prisma.product.update({
      where: { id: sale.productId },
      data: { quantity: { increment: sale.quantity } },
    });

    await prisma.sale.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Sale DELETE Error:", err);
    return NextResponse.json(
      { error: "Failed to delete sale" },
      { status: 500 }
    );
  }
}
