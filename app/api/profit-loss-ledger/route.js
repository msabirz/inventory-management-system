// app/api/profit-loss-ledger/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function keyOf(d) {
  return new Date(d).toISOString().slice(0, 10);
}

export async function POST(req) {
  try {
    const body = await req.json();
    let { range, from, to } = body || {};

    let startDate, endDate;
    if (from && to) {
      startDate = new Date(from + "T00:00:00");
      endDate = new Date(to + "T23:59:59");
    } else {
      // default to this week (same logic as main API)
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - diffToMonday);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    }

    const map = {};

    // Sales rows
    const sales = await prisma.sale.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: { product: true },
    });

    for (const s of sales) {
      const k = keyOf(s.date);
      if (!map[k]) map[k] = { sales: 0, cogs: 0, expenses: 0 };
      const q = safeNumber(s.quantity);
      const r = safeNumber(s.rate);
      map[k].sales += q * r;
      map[k].cogs += q * safeNumber(s.product?.purchasePrice);
    }

    // Expenses rows
    const expenses = await prisma.expense.findMany({
      where: { date: { gte: startDate, lte: endDate } },
    });
    for (const e of expenses) {
      const k = keyOf(e.date);
      if (!map[k]) map[k] = { sales: 0, cogs: 0, expenses: 0 };
      map[k].expenses += safeNumber(e.amount);
    }

    // build rows sorted desc
    const rows = Object.keys(map)
      .sort((a, b) => b.localeCompare(a))
      .map((date) => {
        const { sales, cogs, expenses } = map[date];
        return { date, sales: safeNumber(sales), cogs: safeNumber(cogs), expenses: safeNumber(expenses), profit: safeNumber(sales - cogs - expenses) };
      });

    return NextResponse.json({ rows });
  } catch (err) {
    console.error("ledger error", err);
    return NextResponse.json({ rows: [] });
  }
}
