import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  const data = await req.json();
  const updated = await prisma.expenseCategory.update({
    where: { id: Number(params.id) },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
  await prisma.expenseCategory.delete({
    where: { id: Number(params.id) },
  });
  return NextResponse.json({ message: "Deleted" });
}
