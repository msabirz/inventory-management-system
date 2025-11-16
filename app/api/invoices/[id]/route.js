import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET SINGLE INVOICE BY ID
export async function GET(request, { params }) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(params.id) },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Invoice GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}
