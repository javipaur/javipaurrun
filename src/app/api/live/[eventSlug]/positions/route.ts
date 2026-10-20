import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/auth-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { livePositionSchema, getZodErrorMessage } from "@/lib/validation";
import {
  hashRunnerToken,
  findCheckpointPasses,
  projectPosition,
  totalDistanceFromRoute,
} from "@/lib/live";
import { publishLive } from "@/lib/realtime";
import { Prisma } from "@/generated/prisma/client";

const runnerLimiter = rateLimit({ interval: 20_000, max: 6 });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventSlug: string }> }
) {
  const { eventSlug } = await params;

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: { checkpoints: true },
  });
  if (!event) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  }
  if (!event.liveOpen) {
    return NextResponse.json({ error: "El seguimiento no está activo" }, { status: 403 });
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return NextResponse.json({ error: "Token de dorsal requerido" }, { status: 401 });
  }

  const tokenHash = hashRunnerToken(token.trim());
  const runner = await prisma.eventRunner.findUnique({
    where: { token: tokenHash },
  });

  if (!runner || runner.eventId !== event.id) {
    return NextResponse.json({ error: "Dorsal no válido" }, { status: 401 });
  }

  const ip = getClientIp(req);
  const { allowed } = runnerLimiter.check(`live:${event.id}:${runner.id}:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiadas peticiones. Los datos se envían cada 15-20s." },
      { status: 429, headers: { "Retry-After": "20" } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = livePositionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }

  const { lat, lng, km, speed, heading, timestamp } = parsed.data;

  const createdAt = timestamp ? new Date(timestamp * 1000) : new Date();

  const totalDistance =
    totalDistanceFromRoute(event.route as Prisma.InputJsonValue | undefined) ||
    event.checkpoints.reduce((max, c) => Math.max(max, c.km), 0);

  const projection = projectPosition({
    km,
    speed,
    heading,
    totalDistance,
  });

  const passedCheckpointIds = new Set(
    (
      await prisma.checkpointPass.findMany({
        where: {
          runnerId: runner.id,
          checkpointId: { in: event.checkpoints.map((c) => c.id) },
        },
        select: { checkpointId: true },
      })
    ).map((p) => p.checkpointId)
  );

  const foundPasses = findCheckpointPasses(
    lat,
    lng,
    event.checkpoints,
    passedCheckpointIds
  );

  await prisma.$transaction(async (tx) => {
    await tx.livePosition.create({
      data: {
        runnerId: runner.id,
        eventId: event.id,
        lat,
        lng,
        km: projection.km,
        speed: projection.speed,
        heading: projection.heading,
        createdAt,
      },
    });

    for (const { checkpoint } of foundPasses) {
      await tx.checkpointPass.create({
        data: {
          runnerId: runner.id,
          checkpointId: checkpoint.id,
          eventId: event.id,
          source: "GEOFENCE",
        },
      });
    }
  });

  await publishLive({
    eventId: event.slug,
    type: "position",
    data: {
      runnerId: runner.id,
      bib: runner.bib,
      name: runner.name,
      category: runner.category,
      lat,
      lng,
      km: projection.km,
      speed: projection.speed,
      heading: projection.heading,
      etaSecondsToFinish: projection.etaSecondsToFinish,
      createdAt: createdAt.toISOString(),
    },
  });

  for (const { checkpoint } of foundPasses) {
    await publishLive({
      eventId: event.slug,
      type: "checkpoint",
      data: {
        runnerId: runner.id,
        bib: runner.bib,
        checkpointId: checkpoint.id,
        checkpointName: checkpoint.name,
        km: checkpoint.km,
      },
    });
  }

  return new NextResponse(null, { status: 204 });
}