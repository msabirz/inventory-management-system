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

    let openingBalance = 0;

    if (fromDate) {
      const salesOpening = await prisma.sale.aggregate({
        _sum: { creditAmount: true },
        where: {
          creditAmount: { gt: 0 },
          date: { lt: fromDate },
          ...(customerId && { customerId }),
        },
      });

      const paymentsOpening = await prisma.customerPayment.aggregate({
        _sum: { amount: true },
        where: {
          date: { lt: fromDate },
          ...(customerId && { customerId }),
        },
      });

      openingBalance = (salesOpening._sum.creditAmount || 0) - (paymentsOpening._sum.amount || 0);
    }

    /* -------------------------------------------------
       STEP B — TRANSACTIONS IN RANGE
    ------------------------------------------------- */
    const dateRange = fromDate || toDate
      ? {
          date: {
            ...(fromDate && { gte: fromDate }),
            ...(toDate && { lte: toDate }),
          },
        }
      : {};

    const [sales, payments] = await Promise.all([
      prisma.sale.findMany({
        where: {
          creditAmount: { gt: 0 },
          ...(customerId && { customerId }),
          ...dateRange,
        },
        include: {
          customer: { select: { name: true } },
          items: {
            include: {
              product: { select: { name: true } }
            }
          }
        },
        orderBy: { date: "asc" },
      }),
      prisma.customerPayment.findMany({
        where: {
          ...(customerId && { customerId }),
          ...dateRange,
        },
        include: {
          customer: { select: { name: true } },
        },
        orderBy: { date: "asc" },
      }),
    ]);

    /* -------------------------------------------------
       STEP C — NORMALIZE AND SORT
    ------------------------------------------------- */
    const allTransactions = [
      ...sales.map((s) => {
        const itemNames = s.items.map(it => it.product?.name || "Product").join(", ");
        return {
          id: `sale-${s.id}`,
          date: s.date,
          type: "SALE",
          customerName: s.customer?.name || "Walk-in",
          description: `Sale: ${itemNames} (Bill: ${s.billNumber || "-"})`,
          billAmount: Number(s.netAmount),
          paidAmount: Number(s.paidAmount),
          credit: Number(s.creditAmount),
          debit: 0,
          paymentMode: s.paymentMode,
          paymentRef: s.paymentRef,
          items: s.items.map(it => ({
            productName: it.product?.name || "",
            quantity: it.quantity,
            rate: it.rate,
            lineTotal: it.totalAmount,
          })),
        };
      }),
      ...payments.map((p) => ({
        id: `pay-${p.id}`,
        date: p.date,
        type: "PAYMENT",
        customerName: p.customer?.name || "Customer",
        description: p.remarks || "Repayment",
        billAmount: 0,
        paidAmount: Number(p.amount),
        credit: 0,
        debit: Number(p.amount),
        paymentMode: p.paymentMode,
        paymentRef: p.paymentRef,
        items: null,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    /* -------------------------------------------------
       STEP D — CALCULATE RUNNING BALANCE
    ------------------------------------------------- */
    let balance = openingBalance;
    const rows = allTransactions.map((t) => {
      balance += t.credit - t.debit;
      return {
        ...t,
        date: new Date(t.date).toISOString().slice(0, 10),
        balance,
      };
    });

    return NextResponse.json({
      openingBalance,
      rows,
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