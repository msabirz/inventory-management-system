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
     console.log("data--",data)
    //if productId is 0 then create the product first
    if (Number(data.productId) === 0) {
      const newProduct = await prisma.product.create({
        data: {
          name: data.productName,
          quantity: Number(data.quantity),
          price: Number(data.pricePerUnit),
          sellingPrice: data.sellingPrice
            ? Number(data.sellingPrice)
            : 0,
          categoryId:Number(data.categoryId),
        },
      });
      data.productId = newProduct.id;
    }else{
      // Auto increase product stock only productId is not 0
          await prisma.product.update({
            where: { id: Number(data.productId) },
            data: {
              quantity: { increment: Number(data.quantity) },
            },
        });
    }
    console.log("data",data)
    const created = await prisma.purchase.create({
      data: {
        date: isoDate, // ✔ fixed
        productId: Number(data.productId),
        supplierId: data.supplierId ? Number(data.supplierId) : null,
        quantity: Number(data.quantity),
        pricePerUnit: Number(data.pricePerUnit),
        totalAmount: Number(data.quantity) * Number(data.pricePerUnit),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /purchases error:", error);
    return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 });
  }
}
