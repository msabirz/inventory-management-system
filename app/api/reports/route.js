import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { type, startDate, endDate, customerId, productId } = await request.json();

    // Build filter
    const filter = {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (customerId) filter.customerId = Number(customerId);
    if (productId) filter.productId = Number(productId);

    let data = [];

    if (type === "sales") {
      data = await prisma.sale.findMany({
        where: filter,
        include: { product: true, customer: true },
        orderBy: { date: "desc" },
      });
    } else if (type === "purchases") {
      data = await prisma.purchase.findMany({
        where: filter,
        include: { product: true, supplier: true },
        orderBy: { date: "desc" },
      });
    } else if (type === "profit") {
      const sales = await prisma.sale.findMany({
        where: filter,
        include: { product: true },
      });

      const purchases = await prisma.purchase.findMany({
        where: filter,
        include: { product: true },
      });

      let totalSales = sales.reduce((acc, s) => acc + s.totalAmount, 0);
      let totalPurchase = purchases.reduce((acc, p) => acc + p.totalAmount, 0);

      data = {
        totalSales,
        totalPurchase,
        profit: totalSales - totalPurchase,
      };
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Report API error:", error);
    return NextResponse.json({ error: "Report failed" }, { status: 500 });
  }
}
