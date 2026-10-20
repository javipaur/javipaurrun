import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { projectPosition, totalDistanceFromRoute } from "@/lib/live";
import LiveClient from "./LiveClient";
import type { LiveCheckpoint, LiveRunner, LiveEventInfo } from "./LiveClient";
import { Prisma } from "@/generated/prisma/client";

interface PageProps {
  params: Promise<{ eventSlug: string }>;
}

export const revalidate = 30;
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventSlug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    select: { name: true, description: true, organization: { select: { name: true } } },
  });

  if (!event) return { title: "Evento no encontrado - JavipaurRun" };

  const title = `${event.name} · Seguimiento en vivo - JavipaurRun`;
  const description =
    event.description || `Sigue en vivo a los corredores de ${event.name} (${event.organization.name}). Posiciones, ritmo y clasificación en tiempo real.`;

  return {
    title,
    description,
    openGraph: { title, description },
    robots: { index: false, follow: false },
  };
}

export default async function LivePage({ params }: PageProps) {
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

  if (!event) notFound();

  const totalDistance =
    totalDistanceFromRoute(event.route as Prisma.InputJsonValue | undefined) ||
    event.checkpoints.reduce((max, c) => Math.max(max, c.km), 0);

  const positions = await prisma.livePosition.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "desc" },
  });

  const latestByRunner = new Map<string, (typeof positions)[number]>();
  for (const p of positions) {
    if (!latestByRunner.has(p.runnerId)) latestByRunner.set(p.runnerId, p);
  }

  const passes = await prisma.checkpointPass.findMany({
    where: { eventId: event.id },
    orderBy: { time: "asc" },
  });
  const passesByRunner = new Map<string, typeof passes>();
  for (const pass of passes) {
    const list = passesByRunner.get(pass.runnerId) || [];
    if (!passesByRunner.has(pass.runnerId)) passesByRunner.set(pass.runnerId, list);
    list.push(pass);
  }

  const runners: LiveRunner[] = event.runners.map((r) => {
    const pos = latestByRunner.get(r.id) || null;
    const projection = pos
      ? projectPosition({ km: pos.km, speed: pos.speed, heading: pos.heading, totalDistance })
      : { km: null, speed: null, heading: null, etaSecondsToFinish: null };
    const runnerPasses = passesByRunner.get(r.id) || [];
    return {
      id: r.id,
      bib: r.bib,
      name: r.name,
      category: r.category,
      status: r.status,
      startTime: r.startTime?.toISOString() ?? null,
      finishTime: r.finishTime?.toISOString() ?? null,
      position: pos
        ? {
            lat: pos.lat,
            lng: pos.lng,
            km: pos.km,
            speed: pos.speed,
            heading: pos.heading,
            createdAt: pos.createdAt.toISOString(),
            etaSecondsToFinish: projection.etaSecondsToFinish,
          }
        : null,
      passedCheckpointIds: runnerPasses.map((p) => p.checkpointId),
      passCount: runnerPasses.length,
    };
  });

  const checkpoints: LiveCheckpoint[] = event.checkpoints.map((c) => ({
    id: c.id,
    order: c.order,
    name: c.name,
    km: c.km,
    lat: c.lat,
    lng: c.lng,
  }));

  const eventInfo: LiveEventInfo = {
    id: event.id,
    slug: event.slug,
    name: event.name,
    description: event.description,
    date: event.date.toISOString(),
    liveOpen: event.liveOpen,
    totalDistance,
    organization: event.organization,
  };

  const stats = {
    totalRunners: event.runners.length,
    onCourse: event.runners.filter((r) => r.status === "EN_CURSO").length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mb-1">
          {event.organization.name}
          {event.race ? ` · ${event.race.name}` : ""}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {event.name}
        </h1>
        {event.description && (
          <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-3xl">{event.description}</p>
        )}
      </div>

      {!event.liveOpen && (
        <div className="mb-6 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          Este evento no está emitiendo posiciones en directo ahora mismo.
        </div>
      )}

      <LiveClient snapshot={{ event: eventInfo, checkpoints, runners, stats }} eventSlug={eventSlug} />
    </div>
  );
}