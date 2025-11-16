import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
const categories = await prisma.category.findMany({ orderBy: { id: "desc" } });
return NextResponse.json(categories);
}

export async function POST(request) {
const data = await request.json();
const created = await prisma.category.create({ data });
return NextResponse.json(created, { status: 201 });
}