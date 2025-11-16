import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const dbPath = path.join(process.cwd(), "prisma", "dev.db");

  await writeFile(dbPath, buffer);

  return NextResponse.json({ message: "Database restored successfully" });
}
