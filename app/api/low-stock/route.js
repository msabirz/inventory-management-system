import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET LOW STOCK PRODUCTS
export async function GET() {
  try {
    const items = await prisma.product.findMany({
      where: {
        quantity: {
          lte: prisma.product.fields.lowStockThreshold, // Prisma 5+
        },
      },
      orderBy: { quantity: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Low stock API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch low stock products" },
      { status: 500 }
    );
  }
}
