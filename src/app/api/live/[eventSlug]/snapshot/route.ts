import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  projectPosition,
  totalDistanceFromRoute,
} from "@/lib/live";
import { Prisma } from "@/generated/prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventSlug: string }> }
) {
  const { eventSlug } = await params;

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      checkpoints: { orderBy: { order: "asc" } },
      runners: true,
      organization: { select: { id: true, name: true } },
      race: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!event) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  }

  const totalDistance =
    totalDistanceFromRoute(event.route as Prisma.InputJsonValue | undefined) ||
    event.checkpoints.reduce((max, c) => Math.max(max, c.km), 0);

  const latestPositions = await Promise.all(
    event.runners.map(async (runner) => {
      const pos = await prisma.livePosition.findFirst({
        where: { runnerId: runner.id },
        orderBy: { createdAt: "desc" },
      });
      const passes = await prisma.checkpointPass.findMany({
        where: { runnerId: runner.id, eventId: event.id },
        orderBy: { time: "asc" },
      });
      return { runner, position: pos, passes };
    })
  );

  const totalRunners = event.runners.length;
  const onCourse = event.runners.filter((r) => r.status === "EN_CURSO").length;

  return NextResponse.json({
    event: {
      id: event.id,
      slug: event.slug,
      name: event.name,
      description: event.description,
      date: event.date,
      liveOpen: event.liveOpen,
      status: event.status,
      route: event.route,
      organization: event.organization,
      race: event.race,
      totalDistance,
    },
    checkpoints: event.checkpoints,
    stats: { totalRunners, onCourse },
    runners: latestPositions.map(({ runner, position, passes }) => {
      const projection = position
        ? projectPosition({
            km: position.km,
            speed: position.speed,
            heading: position.heading,
            totalDistance,
          })
        : { km: null, speed: null, heading: null, etaSecondsToFinish: null };
      const passedCheckpointIds = passes.map((p) => p.checkpointId);
      return {
        id: runner.id,
        bib: runner.bib,
        name: runner.name,
        category: runner.category,
        status: runner.status,
        startTime: runner.startTime,
        finishTime: runner.finishTime,
        position: position
          ? {
              lat: position.lat,
              lng: position.lng,
              km: position.km,
              speed: position.speed,
              heading: position.heading,
              createdAt: position.createdAt,
              etaSecondsToFinish: projection.etaSecondsToFinish,
            }
          : null,
        passedCheckpointIds,
        passCount: passedCheckpointIds.length,
      };
    }),
  });
}