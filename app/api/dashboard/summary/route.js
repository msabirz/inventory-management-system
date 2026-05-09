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
      recentInvoices,
      allTimeSales,
      allTimePurchases,
      pendingCredits
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({
        where: {
          quantity: {
            lte: 5, // Default threshold
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

      // All time sales
      prisma.sale.aggregate({
        _sum: { totalAmount: true }
      }),

      // All time purchases
      prisma.purchase.aggregate({
        _sum: { totalAmount: true }
      }),

      // Pending credits (Outstanding)
      prisma.sale.aggregate({
        _sum: { creditAmount: true }
      })
    ]);

    return NextResponse.json({
      totalProducts,
      lowStockCount,
      todaysSales: todaysSales._sum.totalAmount || 0,
      todaysPurchases: todaysPurchases._sum.totalAmount || 0,
      allTimeSales: allTimeSales._sum.totalAmount || 0,
      allTimePurchases: allTimePurchases._sum.totalAmount || 0,
      pendingCredits: pendingCredits._sum.creditAmount || 0,
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
