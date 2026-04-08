import { NextResponse } from "next/server";
import  prisma  from "@/lib/prisma";

/**
 * POST /api/customer-ledger
 * Body: { from?, to?, customerId? }
 */
export async function POST(req) {
  try {
    const { from, to, customerId } = await req.json();

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    /* -------------------------------------------------
       STEP A — OPENING BALANCE
       Sum of creditAmount BEFORE from date
    ------------------------------------------------- */

    let openingBalance = 0;

    if (fromDate) {
      const opening = await prisma.sale.aggregate({
        _sum: { creditAmount: true },
        where: {
          creditAmount: { gt: 0 },
          date: { lt: fromDate },
          ...(customerId && { customerId }),
        },
      });

      openingBalance = opening._sum.creditAmount || 0;
    }

    /* -------------------------------------------------
       STEP B — CREDIT SALES IN RANGE
    ------------------------------------------------- */

    const dateFilter = {
      ...(fromDate && { gte: fromDate }),
      ...(toDate && { lte: toDate }),
    };
const dateRange =
  fromDate || toDate
    ? {
        date: {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        },
      }
    : {};
    const sales = await prisma.sale.findMany({
      where: {
        creditAmount: { gt: 0 },
        ...(customerId && { customerId }),
        ...dateRange,
      },
      include: {
        customer: { select: { name: true } },
         product: {
        select: {
          name: true,
        },
      },
      },
     
      orderBy: { date: "asc" },
    });

    /* -------------------------------------------------
       STEP C — NORMALISE TO LEDGER ROWS
    ------------------------------------------------- */

    let balance = openingBalance;

    const rows = sales.map((s) => {
  balance += s.creditAmount;

  return {
    id: s.id,
    date: s.date.toISOString().slice(0, 10),
    customerName: s.customer?.name || "Walk-in",
    ref: "NA",

    // amounts
    billAmount: Number(s.netAmount),
    paidAmount: Number(s.paidAmount),
    debit: Number(s.creditAmount),
    credit: 0,
    balance,

    // item details (for expand)
    item: {
      productName: s.product?.name || "",
      quantity: s.quantity,
      rate: s.rate,
      lineTotal: s.netAmount,
    },
  };
});

    return NextResponse.json({
      openingBalance,
      rows,
    });
  } catch (err) {
    console.error("customer-ledger error", err);
    return NextResponse.json(
      { error: "Failed to generate customer ledger" },
      { status: 500 }
    );
  }
}