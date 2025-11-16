import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table");

  // Map URL table names → Prisma model names
  const modelMap = {
    customers: "customer",
    products: "product",
    suppliers: "supplier",
    categories: "category"
  };

  if (!modelMap[table]) {
    return NextResponse.json(
      { error: "Invalid table name" },
      { status: 400 }
    );
  }

  const prismaModel = modelMap[table];

  try {
    const data = await prisma[prismaModel].findMany();

    if (data.length === 0) {
      return NextResponse.json(
        { error: "No data found" },
        { status: 404 }
      );
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(",")];

    data.forEach((row) => {
      const values = headers.map((h) => JSON.stringify(row[h] ?? ""));
      csvRows.push(values.join(","));
    });

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=${table}.csv`,
      },
    });
  } catch (err) {
    console.error("CSV Export Error:", err);
    return NextResponse.json(
      { error: "Failed to export CSV" },
      { status: 500 }
    );
  }
}
