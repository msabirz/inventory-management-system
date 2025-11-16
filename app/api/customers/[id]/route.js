import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const id = Number(params.id);
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(customer);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const id = Number(params.id);
    const data = await request.json();
    const updated = await prisma.customer.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = Number(params.id);
    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({}, { status: 204 });
  } catch (err) {
    console.error(err);
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
