import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getClientIp } from "@/lib/auth-helpers";
import { apiLimiter } from "@/lib/rate-limit";

function parseTime(time: string): { hours: number; minutes: number; seconds: number } | null {
  const parts = time.split(":").map(Number);
  if (parts.length === 2) {
    const [m, s] = parts;
    if (!isNaN(m) && !isNaN(s) && s < 60) return { hours: 0, minutes: m, seconds: s };
  }
  if (parts.length === 3) {
    const [h, m, s] = parts;
    if (!isNaN(h) && !isNaN(m) && !isNaN(s) && m < 60 && s < 60)
      return { hours: h, minutes: m, seconds: s };
  }
  return null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const results = await prisma.raceResult.findMany({
      where: { raceId: id },
      orderBy: [{ hours: "asc" }, { minutes: "asc" }, { seconds: "asc" }],
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, session } = await requireAuth();
  if (authError || !session) return authError || NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const ip = getClientIp(req);
  const { allowed } = apiLimiter.check(`result:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  }

  const { id } = await params;
  const body = await req.json();
  const { time, position, category, notes, proofUrl } = body;

  if (!time || typeof time !== "string") {
    return NextResponse.json({ error: "El tiempo es obligatorio (formato: mm:ss o h:mm:ss)" }, { status: 400 });
  }

  const parsed = parseTime(time);
  if (!parsed) {
    return NextResponse.json({ error: "Formato de tiempo inválido. Usa mm:ss o h:mm:ss" }, { status: 400 });
  }

  const race = await prisma.race.findUnique({ where: { id } });
  if (!race) {
    return NextResponse.json({ error: "Carrera no encontrada" }, { status: 404 });
  }

  const existing = await prisma.raceResult.findUnique({
    where: { raceId_userId: { raceId: id, userId: session.user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Ya has registrado un resultado para esta carrera" }, { status: 409 });
  }

  try {
    const result = await prisma.raceResult.create({
      data: {
        raceId: id,
        userId: session.user.id,
        time,
        hours: parsed.hours,
        minutes: parsed.minutes,
        seconds: parsed.seconds,
        position: position ? parseInt(position, 10) : null,
        category: category || null,
        notes: notes || null,
        proofUrl: proofUrl || null,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, result });
  } catch {
    return NextResponse.json({ error: "Error al guardar el resultado" }, { status: 500 });
  }
}
