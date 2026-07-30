import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, session } = await requireAuth();
  if (authError || !session) return authError || NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const race = await prisma.race.findUnique({ where: { id } });
  if (!race) {
    return NextResponse.json({ error: "Carrera no encontrada" }, { status: 404 });
  }

  if (race.date < new Date()) {
    return NextResponse.json({ error: "La carrera ya ha pasado" }, { status: 400 });
  }

  const existing = await prisma.raceReminder.findUnique({
    where: { raceId_userId: { raceId: id, userId: session.user.id } },
  });
  if (existing) {
    if (existing.sent) {
      return NextResponse.json({ error: "El recordatorio ya fue enviado" }, { status: 409 });
    }
    return NextResponse.json({ success: true, reminder: existing });
  }

  const reminder = await prisma.raceReminder.create({
    data: {
      raceId: id,
      userId: session.user.id,
      daysBefore: 1,
    },
  });

  return NextResponse.json({ success: true, reminder });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, session } = await requireAuth();
  if (authError || !session) return authError || NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  await prisma.raceReminder.deleteMany({
    where: { raceId: id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, session } = await requireAuth();
  if (authError || !session) return authError || NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const reminder = await prisma.raceReminder.findUnique({
    where: { raceId_userId: { raceId: id, userId: session.user.id } },
  });

  return NextResponse.json({ reminder });
}
