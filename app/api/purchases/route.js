import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const purchases = await prisma.purchase.findMany({
      include: { product: true, supplier: true },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error("GET /purchases error:", error);
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();

    // ✅ Date Validation Fix
    if (!data.date || data.date.trim() === "") {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    const isoDate = new Date(data.date + "T00:00:00");
    if (isNaN(isoDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    const created = await prisma.purchase.create({
      data: {
        ...data,
        date: isoDate, // ✔ fixed
        productId: Number(data.productId),
        supplierId: data.supplierId ? Number(data.supplierId) : null,
        quantity: Number(data.quantity),
        pricePerUnit: Number(data.pricePerUnit),
        totalAmount: Number(data.quantity) * Number(data.pricePerUnit),
      },
    });

    // Auto increase product stock
    await prisma.product.update({
      where: { id: Number(data.productId) },
      data: {
        quantity: { increment: Number(data.quantity) },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /purchases error:", error);
    return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 });
  }
}
