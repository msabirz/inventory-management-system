// app/api/profit-loss/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseInvoiceDate(inv) {
  // try common date fields (adjust if your schema uses another name)
  return inv.date ?? inv.createdAt ?? inv.created_at ?? inv.created ?? null;
}

export async function POST(req) {
  try {
    const { from, to, source } = await req.json();

    // validate inputs
    if (!from || !to) {
      return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
    }

    const startDate = new Date(from + "T00:00:00");
    const endDate = new Date(to + "T23:59:59");

    let totalSales = 0;
    let totalCOGS = 0;

    // SALES SOURCE
    if (source === "sales") {
      const sales = await prisma.sale.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
        },
        include: { product: true },
      });

      for (const s of sales) {
        const q = safeNumber(s.quantity);
        const rate = safeNumber(s.rate);
        totalSales += q * rate;
        totalCOGS += q * safeNumber(s.product?.purchasePrice);
      }
    }

    // INVOICE SOURCE (robust: do not assume invoice.date exists)
    if (source === "invoices") {
      // fetch invoice items with parent invoice and product
      // we fetch items and include invoice + product to get everything we need
      // Note: we avoid referencing invoice.date in Prisma query to keep it schema-safe.
      const items = await prisma.invoiceItem.findMany({
        include: {
          invoice: true, // will include whatever fields exist
          product: true,
        },
      });

      for (const item of items) {
        const inv = item.invoice;
        const invDateRaw = parseInvoiceDate(inv);
        if (!invDateRaw) continue; // invoice has no known date field -> skip

        const invDate = new Date(invDateRaw);
        if (isNaN(invDate.getTime())) continue;

        if (invDate >= startDate && invDate <= endDate) {
          const q = safeNumber(item.quantity);
          const rate = safeNumber(item.rate);
          totalSales += q * rate;
          totalCOGS += q * safeNumber(item.product?.purchasePrice);
        }
      }
    }

    // EXPENSES (always use date range)
    const expensesAgg = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        date: { gte: startDate, lte: endDate },
      },
    });

    const totalExpenses = safeNumber(expensesAgg._sum.amount || 0);

    // FINAL
    const grossProfit = totalSales - totalCOGS;
    const netProfit = grossProfit - totalExpenses;

    return NextResponse.json({
      source: source || "sales",
      totalSales: safeNumber(totalSales),
      totalCOGS: safeNumber(totalCOGS),
      grossProfit: safeNumber(grossProfit),
      totalExpenses: safeNumber(totalExpenses),
      netProfit: safeNumber(netProfit),
    });
  } catch (err) {
    console.error("P&L ERROR:", err);
    return NextResponse.json({ error: "Failed to calculate P&L" }, { status: 500 });
  }
}
