import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const latestInvoice = await prisma.invoice.findFirst({
      orderBy: { id: "desc" },
      select: { invoiceNumber: true },
    });
    return NextResponse.json({ latestInvoiceNumber: latestInvoice?.invoiceNumber || null });
  } catch (err) {
    console.error("Latest Invoice Num GET Error:", err);
    return NextResponse.json({ error: "Failed to fetch latest invoice number" }, { status: 500 });
  }
}
