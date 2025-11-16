import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET ALL EXPENSES
export async function GET() {
  const expenses = await prisma.expense.findMany({
    include: { category: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(expenses);
}

// CREATE EXPENSE
export async function POST(req) {
  try {
    const data = await req.json();

    const expense = await prisma.expense.create({
      data: {
        ...data,
        date: new Date(data.date).toISOString(), // FIXED FOR PRISMA DATETIME
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("EXPENSE CREATE ERROR:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
