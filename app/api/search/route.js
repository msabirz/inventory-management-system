import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const module = searchParams.get("module") || "all";

  if (!q.trim()) return NextResponse.json([]);

  const results = {};

  const searchConfig = {
    products: () =>
      prisma.product.findMany({
        where: {
          name: { contains: q },
        },
        take: 10,
      }),

    customers: () =>
      prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { phone: { contains: q } },
            { email: { contains: q } },
          ],
        },
        take: 10,
      }),

    suppliers: () =>
      prisma.supplier.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { phone: { contains: q } },
          ],
        },
        take: 10,
      }),

    invoices: () =>
      prisma.invoice.findMany({
        where: {
          invoiceNumber: { contains: q },
        },
        include: { customer: true },
        take: 10,
      }),

    categories: () =>
      prisma.category.findMany({
        where: { name: { contains: q } },
        take: 10,
      }),
  };

  if (module !== "all") {
    results[module] = await searchConfig[module]();
  } else {
    results.products = await searchConfig.products();
    results.customers = await searchConfig.customers();
    results.suppliers = await searchConfig.suppliers();
    results.invoices = await searchConfig.invoices();
    results.categories = await searchConfig.categories();
  }

  return NextResponse.json(results);
}
