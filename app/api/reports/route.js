import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { type, startDate, endDate, customerId, productId, supplierId } = await request.json();

    // Build filter
    const filter = {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (customerId) filter.customerId = Number(customerId);
    if (productId) filter.productId = Number(productId);
    if (supplierId) filter.supplierId = Number(supplierId);

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
      console.log("sales",sales)
      const purchases = await prisma.purchase.findMany({
        where: filter,
        include: { product: true },
      });
      const expenses = await prisma.expense.findMany({
        where: {date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },},
      });
      let totalSales = sales.reduce((acc, s) => acc + s.totalAmount, 0);
      let totalPurchase = sales.reduce((acc, p) => acc + p.product.price * p.quantity, 0);
      let totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
      data = {
        totalSales,
        totalPurchase,
        totalExpenses,
        profit: (totalSales - totalPurchase) - totalExpenses,
      };
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Report API error:", error);
    return NextResponse.json({ error: "Report failed" }, { status: 500 });
  }
}
