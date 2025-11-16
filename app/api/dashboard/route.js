import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Total products
    const totalProducts = await prisma.product.count();

    // Total stock value
    const products = await prisma.product.findMany();
    const totalStockValue = products.reduce(
      (acc, p) => acc + p.quantity * p.price,
      0
    );

    // Purchases today
    const purchasesToday = await prisma.purchase.findMany({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const totalPurchasesTodayAmount = purchasesToday.reduce(
      (acc, p) => acc + p.totalAmount,
      0
    );

    // Sales today
    const salesToday = await prisma.sale.findMany({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const totalSalesTodayAmount = salesToday.reduce(
      (acc, s) => acc + s.totalAmount,
      0
    );

    // Low stock items
    const lowStock = await prisma.product.findMany({
      where: {
        quantity: { lt: 5 }, // threshold
      },
      orderBy: { quantity: "asc" },
    });

    // Recent purchases
    const recentPurchases = await prisma.purchase.findMany({
      include: { product: true, supplier: true },
      orderBy: { id: "desc" },
      take: 5,
    });

    // Recent sales
    const recentSales = await prisma.sale.findMany({
      include: { product: true, customer: true },
      orderBy: { id: "desc" },
      take: 5,
    });

    return NextResponse.json({
      totalProducts,
      totalStockValue,
      purchasesToday: purchasesToday.length,
      totalPurchasesTodayAmount,
      salesToday: salesToday.length,
      totalSalesTodayAmount,
      lowStock,
      recentPurchases,
      recentSales,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
