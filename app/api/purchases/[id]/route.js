import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
  try {
    const id = Number(params.id);

    // Load purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    // Load product to adjust stock
    const product = await prisma.product.findUnique({
      where: { id: purchase.productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Prevent negative stock
    const newQty = product.quantity - purchase.quantity;
    if (newQty < 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete purchase: stock would become negative.",
        },
        { status: 400 }
      );
    }

    // Adjust stock
    await prisma.product.update({
      where: { id: purchase.productId },
      data: { quantity: newQty },
    });

    // Delete purchase
    await prisma.purchase.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /purchases/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete purchase" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const id = Number(params.id);
    const data = await request.json();

    // Validate new date
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

    // Load old purchase
    const oldPurchase = await prisma.purchase.findUnique({ where: { id } });
    if (!oldPurchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    // Convert new values
    const newQty = Number(data.quantity);
    const oldQty = Number(oldPurchase.quantity);
    const newProductId = Number(data.productId);
    const oldProductId = Number(oldPurchase.productId);

    // Update purchase record
    const updated = await prisma.purchase.update({
      where: { id },
      data: {
        ...data,
        date: isoDate,
        productId: newProductId,
        supplierId: data.supplierId ? Number(data.supplierId) : null,
        quantity: newQty,
        pricePerUnit: Number(data.pricePerUnit),
        totalAmount: newQty * Number(data.pricePerUnit),
      },
    });

    // -----------------------------
    // STOCK UPDATE LOGIC (FIXED)
    // -----------------------------

    // Case 1: Product changed
    if (newProductId !== oldProductId) {

      // remove qty from old product
      await prisma.product.update({
        where: { id: oldProductId },
        data: {
          quantity: { decrement: oldQty },
        },
      });

      // add qty to new product
      await prisma.product.update({
        where: { id: newProductId },
        data: {
          quantity: { increment: newQty },
        },
      });

    } else {
      // Case 2: product same → adjust diff
      const diff = newQty - oldQty;

      if (diff !== 0) {
        await prisma.product.update({
          where: { id: newProductId },
          data: {
            quantity: { increment: diff },
          },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /purchases/[id] error:", error);
    return NextResponse.json({ error: "Failed to update purchase" }, { status: 500 });
  }
}
