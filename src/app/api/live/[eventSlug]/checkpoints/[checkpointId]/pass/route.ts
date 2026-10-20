import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganizer, getClientIp } from "@/lib/auth-helpers";
import { apiLimiter } from "@/lib/rate-limit";
import { checkpointPassSchema, getZodErrorMessage } from "@/lib/validation";
import { publishLive } from "@/lib/realtime";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventSlug: string; checkpointId: string }> }
) {
  const { eventSlug, checkpointId } = await params;

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
  });
  if (!event) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  }

  const { error: authError } = await requireOrganizer(event.id);
  if (authError) return authError;

  const checkpoint = await prisma.checkpoint.findFirst({
    where: { id: checkpointId, eventId: event.id },
  });
  if (!checkpoint) {
    return NextResponse.json({ error: "Checkpoint no encontrado" }, { status: 404 });
  }

  const ip = getClientIp(req);
  const { allowed } = apiLimiter.check(`checkpoint:${event.id}:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = checkpointPassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }

  const { bib, source } = parsed.data;

  const runner = await prisma.eventRunner.findUnique({
    where: { eventId_bib: { eventId: event.id, bib } },
  });
  if (!runner) {
    return NextResponse.json({ error: "Dorsal no encontrado" }, { status: 404 });
  }

  const existing = await prisma.checkpointPass.findUnique({
    where: {
      runnerId_checkpointId: { runnerId: runner.id, checkpointId: checkpoint.id },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Este dorsal ya ha pasado por este checkpoint", pass: existing },
      { status: 409 }
    );
  }

  try {
    const pass = await prisma.checkpointPass.create({
      data: {
        runnerId: runner.id,
        checkpointId: checkpoint.id,
        eventId: event.id,
        source,
      },
    });

    const finished = await prisma.checkpoint.findFirst({
      where: { eventId: event.id },
      orderBy: { order: "desc" },
    });

    let statusUpdate = false;
    if (finished && finished.id === checkpoint.id) {
      await prisma.eventRunner.update({
        where: { id: runner.id },
        data: { status: "FINALIZADO", finishTime: new Date() },
      });
      statusUpdate = true;
    }

    await publishLive({
      eventId: event.slug,
      type: "checkpoint",
      data: {
        runnerId: runner.id,
        bib: runner.bib,
        checkpointId: checkpoint.id,
        checkpointName: checkpoint.name,
        km: checkpoint.km,
        source,
      },
    });

    if (statusUpdate) {
      await publishLive({
        eventId: event.slug,
        type: "status",
        data: { runnerId: runner.id, bib: runner.bib, status: "FINALIZADO" },
      });
    }

    return NextResponse.json({ success: true, pass });
  } catch {
    return NextResponse.json({ error: "Error al registrar el paso" }, { status: 500 });
  }
}