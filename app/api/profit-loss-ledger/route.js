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

function startEndForRange(range) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch ((range || "").toLowerCase()) {
    case "today":
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      break;

    case "this_week":
    case "week":
      const day = start.getDay();
      const diff = (day + 6) % 7;
      start.setDate(start.getDate() - diff);
      start.setHours(0,0,0,0);
      end.setDate(start.getDate() + 6);
      end.setHours(23,59,59,999);
      break;

    case "last_week":
      const d = start.getDay();
      const diff2 = (d + 6) % 7;
      start.setDate(start.getDate() - diff2 - 7);
      start.setHours(0,0,0,0);
      end.setDate(start.getDate() + 6);
      end.setHours(23,59,59,999);
      break;

    case "this_month":
      start.setDate(1);
      start.setHours(0,0,0,0);
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23,59,59,999);
      break;

    case "last_month":
      start.setMonth(start.getMonth() - 1, 1);
      start.setHours(0,0,0,0);
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23,59,59,999);
      break;

    case "financial_year":
      const year = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
      start.setFullYear(year, 3, 1);
      start.setHours(0,0,0,0);

      end.setFullYear(year + 1, 2, 31);
      end.setHours(23,59,59,999);
      break;
  }

  return { start, end };
}

export async function POST(req) {
  try {
    const body = await req.json();
    let { range, from, to } = body || {};

    let startDate, endDate;

    if (from && to) {
      startDate = new Date(from + "T00:00:00");
      endDate   = new Date(to   + "T23:59:59");
    } else {
      ({ start: startDate, end: endDate } = startEndForRange(range || "this_week"));
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
      map[k].cogs  += q * safeNumber(s.product?.price);
    }

    // Expense rows
    const expenses = await prisma.expense.findMany({
      where: { date: { gte: startDate, lte: endDate } },
    });

    for (const e of expenses) {
      const k = keyOf(e.date);
      if (!map[k]) map[k] = { sales: 0, cogs: 0, expenses: 0 };
      map[k].expenses += safeNumber(e.amount);
    }

    const rows = Object.keys(map)
      .sort((a, b) => b.localeCompare(a))
      .map((date) => {
        const { sales, cogs, expenses } = map[date];
        return {
          date,
          sales: safeNumber(sales),
          cogs: safeNumber(cogs),
          expenses: safeNumber(expenses),
          profit: safeNumber(sales - cogs - expenses),
        };
      });

    return NextResponse.json({ rows });

  } catch (err) {
    console.error("ledger error", err);
    return NextResponse.json({ rows: [] });
  }
}
