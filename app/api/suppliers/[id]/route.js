import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  const id = Number(params.id);
  const data = await request.json();

  const updated = await prisma.supplier.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(request, { params }) {
  await prisma.supplier.delete({
    where: { id: Number(params.id) },
  });

  return NextResponse.json({}, { status: 204 });
}
