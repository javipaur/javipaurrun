import { prisma } from "@/lib/prisma";
import { matchesAlert, type AlertBounds } from "@/lib/alerts";
import { sendNewRacesAlert } from "@/lib/email";

import { envSiteUrl } from "@/lib/site-url";

const APP_URL = envSiteUrl();
const LOOKBACK_HOURS = 48;

export async function runAlertDigest() {
  const since = new Date(Date.now() - LOOKBACK_HOURS * 3600_000);

  const [alerts, newRaces] = await Promise.all([
    prisma.raceAlert.findMany({ where: { active: true } }),
    prisma.race.findMany({
      where: { pendingReview: false, createdAt: { gte: since } },
      orderBy: { date: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        province: true,
        type: true,
        distanceKm: true,
        location: true,
        date: true,
      },
    }),
  ]);

  if (alerts.length === 0 || newRaces.length === 0) {
    return { alerts: alerts.length, candidates: newRaces.length, sent: 0, matches: 0 };
  }

  let sent = 0;
  let matches = 0;

  for (const alert of alerts) {
    const bounds: AlertBounds = {
      province: alert.province,
      community: alert.community,
      type: alert.type,
      minKm: alert.minKm,
      maxKm: alert.maxKm,
    };

    const matched = newRaces.filter((race) => matchesAlert(race, bounds));
    if (matched.length === 0) continue;

    matches += matched.length;

    const digest = matched.slice(0, 15);

    await sendNewRacesAlert({
      to: alert.email,
      races: digest.map((race) => ({
        name: race.name,
        slug: race.slug,
        province: race.province,
        location: race.location,
        distanceKm: race.distanceKm,
        date: race.date.toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      })),
      unsubscribeUrl: `${APP_URL}/api/alerts?email=${encodeURIComponent(alert.email)}`,
    });

    await prisma.raceAlert.update({
      where: { id: alert.id },
      data: { lastSentAt: new Date() },
    });

    sent += 1;
  }

  return { alerts: alerts.length, candidates: newRaces.length, sent, matches };
}