import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalProducts,
      lowStockCount,
      todaysSales,
      todaysPurchases,
      recentInvoices
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({
        where: {
          quantity: {
            lte: prisma.product.fields.lowStockThreshold,
          },
        },
      }),

      // Today's sales total
      prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: {
          date: { gte: todayStart, lte: todayEnd },
        },
      }),

      // Today's purchases total
      prisma.purchase.aggregate({
        _sum: { totalAmount: true },
        where: {
          date: { gte: todayStart, lte: todayEnd },
        },
      }),

      // Recent 5 invoices
      prisma.invoice.findMany({
        take: 5,
        orderBy: { id: "desc" },
        include: {
          customer: true,
        },
      }),
    ]);

    return NextResponse.json({
      totalProducts,
      lowStockCount,
      todaysSales: todaysSales._sum.totalAmount || 0,
      todaysPurchases: todaysPurchases._sum.totalAmount || 0,
      recentInvoices,
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard summary" },
      { status: 500 }
    );
  }
}
