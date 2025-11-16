import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");

  if (!fs.existsSync(dbPath)) {
    return NextResponse.json({ error: "Database not found" }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(dbPath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename=backup-dev-${Date.now()}.db`,
    },
  });
}
