import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET all adjustments
export async function GET() {
  try {
    const list = await prisma.stockAdjustment.findMany({
      orderBy: { id: "desc" },
      include: { product: true },
    });

    return NextResponse.json(list);
  } catch (err) {
    console.error("Stock adjustments GET error:", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

// CREATE adjustment
export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, quantity, type, note } = body;

    // 1. Create log
    const entry = await prisma.stockAdjustment.create({
      data: { productId, quantity, type, note },
    });

    // 2. Update product stock
    await prisma.product.update({
      where: { id: productId },
      data: {
        quantity: {
          decrement: quantity,
        },
      },
    });

    return NextResponse.json(entry);
  } catch (err) {
    console.error("Stock adjustments POST error:", err);
    return NextResponse.json({ error: "Failed to adjust stock" }, { status: 500 });
  }
}
