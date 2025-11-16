import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({ orderBy: { id: 'desc' } });
    return NextResponse.json(customers);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const created = await prisma.customer.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error(err);
    // handle unique constraint
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
