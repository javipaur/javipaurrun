import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET() {
  const { error: authError, session } = await requireAuth();
  if (authError || !session) return authError || NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const results = await prisma.raceResult.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        race: {
          select: { id: true, name: true, slug: true, date: true, location: true, type: true },
        },
      },
    });

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
