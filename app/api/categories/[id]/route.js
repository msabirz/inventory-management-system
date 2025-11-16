import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
const id = Number(params.id);
const data = await request.json();
const updated = await prisma.category.update({ where: { id }, data });
return NextResponse.json(updated);
}

export async function DELETE(request, { params }) {
const id = Number(params.id);
await prisma.category.delete({ where: { id } });
return NextResponse.json({}, { status: 204 });
}