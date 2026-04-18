import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req, { params }) {
  try {
    const customerId = Number(params.id);
    const { amount, remarks, date, paymentMode, paymentRef } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
    }

    const payment = await prisma.customerPayment.create({
      data: {
        customerId,
        amount: Number(amount),
        remarks: remarks || "",
        paymentMode: paymentMode || null,
        paymentRef: paymentRef || null,
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    console.error("Payment Capture Error:", err);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}

export async function GET(_, { params }) {
  try {
    const customerId = Number(params.id);
    const payments = await prisma.customerPayment.findMany({
      where: { customerId },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(payments);
  } catch (err) {
    console.error("Payment Fetch Error:", err);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
