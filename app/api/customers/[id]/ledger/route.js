import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_, { params }) {
  try {
    const customerId = Number(params.id);

    // Fetch all sales (credit) and payments (debit)
    const sales = await prisma.sale.findMany({
      where: { customerId },
      orderBy: { date: "asc" },
      include: { product: true },
    });

    const payments = await prisma.customerPayment.findMany({
      where: { customerId },
      orderBy: { date: "asc" },
    });

    // Combine and sort by date
    const ledger = [
      ...sales.map((s) => ({
        id: `sale-${s.id}`,
        date: s.date,
        type: "SALE",
        description: `Sale: ${s.product?.name || "Product"} (Bill No: ${s.billNumber || "-"})`,
        credit: s.creditAmount || 0,
        debit: 0,
        amount: s.netAmount,
        paid: s.paidAmount,
        paymentMode: s.paymentMode,
        paymentRef: s.paymentRef,
      })),
      ...payments.map((p) => ({
        id: `pay-${p.id}`,
        date: p.date,
        type: "PAYMENT",
        description: p.remarks || "Repayment",
        credit: 0,
        debit: p.amount,
        amount: 0,
        paid: p.amount,
        paymentMode: p.paymentMode,
        paymentRef: p.paymentRef,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = 0;
    const ledgerWithBalance = ledger.map((item) => {
      runningBalance += item.credit - item.debit;
      return { ...item, balance: runningBalance };
    });

    return NextResponse.json({
      ledger: ledgerWithBalance.reverse(), // Show newest first
      currentBalance: runningBalance,
    });
  } catch (err) {
    console.error("Ledger Fetch Error:", err);
    return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 });
  }
}
