import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { id: "desc" },
  });
  return NextResponse.json(suppliers);
}

export async function POST(request) {
  const data = await request.json();
  const created = await prisma.supplier.create({ data });
  return NextResponse.json(created, { status: 201 });
}
