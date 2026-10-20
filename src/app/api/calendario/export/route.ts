import { prisma } from "@/lib/prisma";
import { generateICSVevent } from "@/lib/ical";
import { buildCalendarWhere } from "@/lib/race-filters";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const raw = {
    tipo: searchParams.get("tipo") || undefined,
    provincia: searchParams.get("provincia") || undefined,
    comunidad: searchParams.get("comunidad") || undefined,
    distancia: searchParams.get("distancia") || undefined,
    buscar: searchParams.get("buscar") || undefined,
    mes: searchParams.get("mes") || undefined,
  };

  const where = buildCalendarWhere(raw);

  const races = await prisma.race.findMany({
    where,
    orderBy: { date: "asc" },
    take: 500,
    select: {
      name: true,
      description: true,
      location: true,
      province: true,
      date: true,
      endDate: true,
      time: true,
      url: true,
      type: true,
      distanceKm: true,
    },
  });

  const events = races
    .map((race) => {
      // iCal exige UTC. Si la carrera tiene hora, se combina con la fecha.
      const [hours, minutes] = (race.time || "09:00").split(":").map(Number);
      const startDate = new Date(race.date);
      startDate.setUTCHours(
        Number.isFinite(hours) ? hours : 9,
        Number.isFinite(minutes) ? minutes : 0,
        0,
        0
      );

      const endDate = race.endDate ? new Date(race.endDate) : null;
      if (endDate) {
        endDate.setUTCHours(
          Number.isFinite(hours) ? hours : 9,
          Number.isFinite(minutes) ? minutes + 60 : 60,
          0,
          0
        );
      }

      const distanceLabel = race.distanceKm ? ` (${race.distanceKm} km)` : "";
      const location = [race.location, race.province].filter(Boolean).join(", ");

      return generateICSVevent({
        name: `${race.name}${distanceLabel}`,
        description: race.description,
        location,
        startDate,
        endDate,
        url: race.url,
      });
    })
    .join("\r\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JavipaurRun//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:JavipaurRun",
    events,
    "END:VCALENDAR",
  ].join("\r\n");

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `javipaurrun-${stamp}.ics`;

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}