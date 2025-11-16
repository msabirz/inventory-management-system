import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Fetch settings (auto-create if missing)
export async function GET() {
  let settings = await prisma.settings.findFirst();

  if (!settings) {
    // Safety: delete all and create only one
    await prisma.settings.deleteMany();
    settings = await prisma.settings.create({
      data: {},
    });
  }

  return NextResponse.json(settings);
}


// Update settings
export async function POST(request) {
  const data = await request.json();

  let settings = await prisma.settings.findFirst();

  if (!settings) {
    settings = await prisma.settings.create({ data });
  } else {
    settings = await prisma.settings.update({
      where: { id: settings.id },
      data,
    });
  }

  return NextResponse.json(settings);
}
