import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const logs = await prisma.scrapeLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ logs: [] });
  }
}
