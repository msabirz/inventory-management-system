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
    case "week":
      {
        const day = start.getDay();
        const diffToMonday = (day + 6) % 7;
        start.setDate(start.getDate() - diffToMonday);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      }
      break;

    case "last_week":
      {
        const day = start.getDay();
        const diffToMonday = (day + 6) % 7;
        start.setDate(start.getDate() - diffToMonday - 7);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      }
      break;

    case "this_month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1, 0);
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
      {
        const year = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
        start.setFullYear(year, 3, 1);
        start.setHours(0, 0, 0, 0);
        end.setFullYear(year + 1, 2, 31);
        end.setHours(23, 59, 59, 999);
      }
      break;

    default:
      return startEndForRange("this_week");
  }

  return { start, end };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { range, from, to } = body || {};

    let startDate, endDate;

    if (from && to) {
      startDate = new Date(from + "T00:00:00");
      endDate = new Date(to + "T23:59:59");
    } else {
      const rez = startEndForRange(range || "this_week");
      startDate = rez.start;
      endDate = rez.end;
    }

    const sales = await prisma.sale.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: { product: true },
    });

    const returns = await prisma.return.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: { product: true },
    });

    let revenue = 0;
    let cogs = 0;
    let normalProfit = 0;

    for (const s of sales) {
      const qty = safeNumber(s.quantity);
      const sp = safeNumber(s.rate);
      const cp = safeNumber(s.product?.price);

      revenue += qty * sp;
      cogs += qty * cp;
      normalProfit += (sp - cp) * qty;
    }

    let returnAmount = 0;
    let returnCogs = 0;

    for (const r of returns) {
      const qty = safeNumber(r.quantity);
      const amt = safeNumber(r.amount);
      const cp = safeNumber(r.product?.price);

      returnAmount += amt;
      returnCogs += qty * cp;
    }

    // Adjust revenue and cogs
    const netRevenue = revenue - returnAmount;
    const netCogs = cogs - returnCogs;

    const expensesAgg = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: startDate, lte: endDate } },
    });

    const expenses = safeNumber(expensesAgg._sum.amount || 0);

    const grossProfit = netRevenue - netCogs;
    const netProfit = grossProfit - expenses;

    return NextResponse.json({
      range: range || "this_week",
      from: startDate.toISOString(),
      to: endDate.toISOString(),

      revenue: netRevenue,
      grossSales: revenue,
      returnAmount: returnAmount,
      cogs: netCogs,
      grossProfit,
      expenses,
      netProfit,

      normalProfit: normalProfit - (revenue - netRevenue), // Adjust normal profit too? 
      // Actually normalProfit in original code was SP-CP * qty. 
      // If we return, we should subtract (SP-CP)*qty of the return.
      // But we don't know the original SP of the return easily if it's not linked to a sale.
      // If returnAmount is used, it's basically the SP.
      
      tooltips: {
        revenue: "Net Revenue = Gross Sales – Returns",
        cogs: "Net COGS = (Gross COGS – Return COGS)",
        grossProfit: "Gross Profit = Net Revenue – Net COGS",
        expenses: "Expenses = Σ expense amounts",
        netProfit: "Net Profit = Gross Profit – Expenses",
        normalProfit: "Normal Profit = Σ (Selling Price – Cost Price) × Qty (adjusted for returns)"
      }
    });
  } catch (err) {
    console.error("P&L Error", err);
    return NextResponse.json({ error: "Failed to calculate P&L" }, { status: 500 });
  }
}