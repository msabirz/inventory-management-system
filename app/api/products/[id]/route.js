import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const id = Number(params.id);

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("GET /products/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const id = Number(params.id);
    const data = await request.json();

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku,
        price: Number(data.price),
        quantity: Number(data.quantity),
        description: data.description,
        categoryId: Number(data.categoryId),
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /products/[id] error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = Number(params.id);

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /products/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
