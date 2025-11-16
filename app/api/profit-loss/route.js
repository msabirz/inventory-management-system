// app/api/profit-loss/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function startEndForRange(range) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch ((range || "").toLowerCase()) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case "this_week":
    case "thisweek":
    case "week":
      // week starting Monday
      {
        const day = start.getDay(); // 0 (Sun) - 6
        const diffToMonday = (day + 6) % 7; // how many days since Monday
        start.setDate(start.getDate() - diffToMonday);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      }
      break;

    case "last_week":
    case "lastweek":
      {
        const day = start.getDay();
        const diffToMonday = (day + 6) % 7;
        // go to monday this week, then subtract 7 days
        start.setDate(start.getDate() - diffToMonday - 7);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      }
      break;

    case "this_month":
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1, 0); // last day of month
      end.setHours(23, 59, 59, 999);
      break;

    case "last_month":
      start.setMonth(start.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case "financial_year":
    case "fy":
      // assume FY Apr 1 -> Mar 31 (India). If you use different, change here.
      {
        const year = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
        start.setFullYear(year, 3, 1); // April 1
        start.setHours(0,0,0,0);
        end.setFullYear(year + 1, 2, 31); // Mar 31 next year
        end.setHours(23,59,59,999);
      }
      break;

    default:
      // default -> this week
      return startEndForRange("this_week");
  }

  return { start, end };
}

export async function POST(req) {
  try {
    const body = await req.json();
    // Accept either { range: 'this_week' } or { from, to } (YYYY-MM-DD)
    const { range, from, to } = body || {};

    let startDate, endDate;
    if (from && to) {
      startDate = new Date(from + "T00:00:00");
      endDate = new Date(to + "T23:59:59");
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json({ error: "Invalid from/to dates" }, { status: 400 });
      }
    } else {
      const rez = startEndForRange(range || "this_week");
      startDate = rez.start;
      endDate = rez.end;
    }

    // Fetch sales in range, include product for purchasePrice
    const sales = await prisma.sale.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      include: { product: true },
    });

    let totalSales = 0;
    let totalCOGS = 0;

    for (const s of sales) {
      const q = safeNumber(s.quantity);
      const r = safeNumber(s.rate); // rate is selling price
      totalSales += q * r;

      // product may be null if relation broken, protect
      const purchasePrice = safeNumber(s.product?.purchasePrice);
      totalCOGS += q * purchasePrice;
    }

    // Expenses in range
    const expensesAgg = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: startDate, lte: endDate } },
    });
    const totalExpenses = safeNumber(expensesAgg._sum.amount || 0);

    const grossProfit = totalSales - totalCOGS;
    const netProfit = grossProfit - totalExpenses;

    return NextResponse.json({
      range: range || "this_week",
      from: startDate.toISOString(),
      to: endDate.toISOString(),
      totalSales: safeNumber(totalSales),
      totalCOGS: safeNumber(totalCOGS),
      grossProfit: safeNumber(grossProfit),
      totalExpenses: safeNumber(totalExpenses),
      netProfit: safeNumber(netProfit),
    });
  } catch (err) {
    console.error("P&L POST ERROR:", err);
    return NextResponse.json({ error: "Failed to calculate P&L" }, { status: 500 });
  }
}
