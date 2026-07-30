import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const reviews = await prisma.review.findMany({
      where: { raceId: id },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, image: true } } },
    });

    const avg = await prisma.review.aggregate({
      where: { raceId: id },
      _avg: { rating: true },
      _count: true,
    });

    return NextResponse.json({
      reviews,
      average: avg._avg.rating ? Math.round(avg._avg.rating * 10) / 10 : 0,
      total: avg._count,
    });
  } catch {
    return NextResponse.json({ reviews: [], average: 0, total: 0 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, session } = await requireAuth();
  if (authError || !session) return authError || NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { rating, comment } = body;

  if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "La puntuación debe ser entre 1 y 5" }, { status: 400 });
  }

  const race = await prisma.race.findUnique({ where: { id } });
  if (!race) {
    return NextResponse.json({ error: "Carrera no encontrada" }, { status: 404 });
  }

  const existing = await prisma.review.findUnique({
    where: { raceId_userId: { raceId: id, userId: session.user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Ya has valorado esta carrera" }, { status: 409 });
  }

  try {
    const review = await prisma.review.create({
      data: {
        raceId: id,
        userId: session.user.id,
        rating,
        comment: comment || null,
      },
      include: { user: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json({ success: true, review });
  } catch {
    return NextResponse.json({ error: "Error al guardar la valoración" }, { status: 500 });
  }
}
