import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const categories = await prisma.expenseCategory.findMany();
  return NextResponse.json(categories);
}

export async function POST(req) {
  const data = await req.json();
  const category = await prisma.expenseCategory.create({ data });
  return NextResponse.json(category);
}
