import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function GET() {
  try {
    const data = await prisma.sale.findMany({
      orderBy: { id: "desc" },
      include: { product: true, customer: true },
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Sales GET Error:", err);
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
      rate,
      pricePerUnit,
      discount,
      paidAmount,
      creditAmount,
      netAmount,
      remarks,
      date,
    } = body;

    // ---- DATE ----
    if (!date || date.trim() === "") {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }
    const isoDate = new Date(date + "T00:00:00");

    // ---- NUMBERS ----
    const qty = safeNumber(quantity);
    const r = safeNumber(rate || pricePerUnit);
    const ppu = safeNumber(pricePerUnit || rate);

    const total = qty * r;
    const disc = safeNumber(discount);
    const net = safeNumber(netAmount || total - disc);
    const paid = safeNumber(paidAmount);
    const credit = safeNumber(creditAmount || net - paid);

    // ---- CREATE SALE ----
    const sale = await prisma.sale.create({
      data: {
        productId: Number(productId),
        customerId: customerId ? Number(customerId) : null,

        quantity: qty,
        rate: r,
        pricePerUnit: ppu,

        totalAmount: total,
        discount: disc,
        netAmount: net,
        paidAmount: paid,
        creditAmount: credit,

        remarks: remarks || "",
        date: isoDate,
      },
    });

    // ---- STOCK DECREASE (UNCHANGED) ----
    await prisma.product.update({
      where: { id: Number(productId) },
      data: { quantity: { decrement: qty } },
    });

    return NextResponse.json(sale);
  } catch (err) {
    console.error("Sales POST Error:", err);
    return NextResponse.json({ error: "Failed to save sale" }, { status: 500 });
  }
}
