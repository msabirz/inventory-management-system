import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function GET() {
  try {
    const data = await prisma.sale.findMany({
      orderBy: { id: "desc" },
      include: { 
        items: {
          include: { product: true }
        }, 
        customer: true 
      },
    });
    return NextResponse.json(data);
  } catch (err) {
    const fs = require("fs");
    fs.appendFileSync("debug_api_errors.log", `[${new Date().toISOString()}] Sales GET Error: ${err.message}\n${err.stack}\n\n`);
    console.error("Sales GET Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      items, // array of { productId, quantity, rate, totalAmount }
      customerId,
      discount,
      paidAmount,
      creditAmount,
      netAmount,
      remarks,
      date,
      billNumber,
      customerPhone,
      paymentMode,
      paymentRef,
    } = body;

    // ---- DATE ----
    if (!date || date.trim() === "") {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }
    const isoDate = new Date(date + "T00:00:00");

    // ---- NUMBERS ----
    const itemsTotal = (items || []).reduce((sum, item) => sum + safeNumber(item.totalAmount), 0);
    const disc = safeNumber(discount);
    const net = safeNumber(netAmount || itemsTotal - disc);
    const paid = safeNumber(paidAmount);
    const credit = safeNumber(creditAmount || net - paid);

    const sale = await prisma.$transaction(async (tx) => {
      // 1. Prepare items and create products if needed
      const processedItems = [];
      for (const item of (items || [])) {
        let pId = item.productId;
        if (pId === "NEW") {
          const newP = await tx.product.create({
            data: {
              name: item.name,
              unit: item.unit || "unit",
              description: item.description || "",
              categoryId: Number(item.categoryId),
              sellingPrice: safeNumber(item.rate),
              quantity: 0, // start with 0
            }
          });
          pId = newP.id;
        }
        processedItems.push({ ...item, productId: Number(pId) });
      }

      // 2. Create Sale
      const createdSale = await tx.sale.create({
        data: {
          customerId: customerId ? Number(customerId) : null,
          totalAmount: itemsTotal,
          discount: disc,
          netAmount: net,
          paidAmount: paid,
          creditAmount: credit,
          remarks: remarks || "",
          date: isoDate,
          billNumber: billNumber || null,
          paymentMode: paymentMode || null,
          paymentRef: paymentRef || null,
          items: {
            create: processedItems.map((item) => ({
              productId: item.productId,
              quantity: safeNumber(item.quantity),
              rate: safeNumber(item.rate),
              pricePerUnit: safeNumber(item.rate),
              totalAmount: safeNumber(item.totalAmount),
            })),
          },
        },
        include: {
          items: {
            include: { product: true }
          },
          customer: true
        }
      });

      // 3. Update Customer Phone
      if (customerId && customerPhone) {
        await tx.customer.update({
          where: { id: Number(customerId) },
          data: { phone: customerPhone },
        });
      }

      // 4. Decrease Stock for each product
      for (const item of processedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: safeNumber(item.quantity) } },
        });
      }

      return createdSale;
    });

    return NextResponse.json(sale);
  } catch (err) {
    const fs = require("fs");
    fs.appendFileSync("debug_api_errors.log", `[${new Date().toISOString()}] Sales POST Error: ${err.message}\n${err.stack}\n\n`);
    console.error("Sales POST Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
