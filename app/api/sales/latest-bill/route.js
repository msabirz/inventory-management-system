import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const latestSale = await prisma.sale.findFirst({
      orderBy: { id: "desc" },
      select: { billNumber: true },
    });
    return NextResponse.json({ latestBillNumber: latestSale?.billNumber || null });
  } catch (err) {
    console.error("Latest Bill GET Error:", err);
    return NextResponse.json({ error: "Failed to fetch latest bill number" }, { status: 500 });
  }
}
