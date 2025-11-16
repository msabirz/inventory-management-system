import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// UPDATE EXPENSE
export async function PUT(req, { params }) {
  try {
    const data = await req.json();

    const updated = await prisma.expense.update({
      where: { id: Number(params.id) },
      data: {
        ...data,
        date: new Date(data.date).toISOString(), // FIXED FOR PRISMA DATETIME
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("EXPENSE UPDATE ERROR:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

// DELETE EXPENSE
export async function DELETE(req, { params }) {
  try {
    await prisma.expense.delete({
      where: { id: Number(params.id) },
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("EXPENSE DELETE ERROR:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
