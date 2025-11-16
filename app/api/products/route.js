import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { id: "desc" }
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();

    const created = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        price: Number(data.price),
        quantity: Number(data.quantity),
        description: data.description,
        categoryId: Number(data.categoryId),
      }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /products error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
