// app/api/profit-loss-ledger/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function POST(req) {
  try {
    const { from, to, source } = await req.json();
    if (!from || !to) return NextResponse.json({ rows: [] });

    const startDate = new Date(from + "T00:00:00");
    const endDate = new Date(to + "T23:59:59");

    // We'll build a simple date-keyed map
    const map = {};

    // helper to ensure date key
    const keyOf = d => new Date(d).toISOString().slice(0,10);

    // SALES or INVOICE items
    if (source === "sales") {
      const sales = await prisma.sale.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        include: { product: true },
      });
      for (const s of sales) {
        const k = keyOf(s.date);
        map[k] = map[k] || { sales: 0, cogs: 0, expenses: 0 };
        map[k].sales += safeNumber(s.quantity) * safeNumber(s.rate);
        map[k].cogs += safeNumber(s.quantity) * safeNumber(s.product?.purchasePrice);
      }
    } else {
      // invoices (robust)
      const items = await prisma.invoiceItem.findMany({ include: { invoice: true, product: true } });
      for (const it of items) {
        const inv = it.invoice;
        const invDateRaw = inv.date ?? inv.createdAt ?? inv.created_at ?? inv.created ?? null;
        if (!invDateRaw) continue;
        const invDate = new Date(invDateRaw);
        if (invDate < startDate || invDate > endDate) continue;
        const k = keyOf(invDate);
        map[k] = map[k] || { sales: 0, cogs: 0, expenses: 0 };
        map[k].sales += safeNumber(it.quantity) * safeNumber(it.rate);
        map[k].cogs += safeNumber(it.quantity) * safeNumber(it.product?.purchasePrice);
      }
    }

    // EXPENSES
    const expenses = await prisma.expense.findMany({
      where: { date: { gte: startDate, lte: endDate } },
    });
    for (const e of expenses) {
      const k = keyOf(e.date);
      map[k] = map[k] || { sales: 0, cogs: 0, expenses: 0 };
      map[k].expenses += safeNumber(e.amount);
    }

    // build rows sorted by date desc
    const rows = Object.keys(map)
      .sort((a,b)=> b.localeCompare(a))
      .map(date => {
        const { sales, cogs, expenses } = map[date];
        return { date, sales, cogs, expenses, profit: sales - cogs - expenses };
      });

    return NextResponse.json({ rows });
  } catch (err) {
    console.error("ledger error", err);
    return NextResponse.json({ rows: [] });
  }
}
