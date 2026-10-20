import { prisma } from "../src/lib/prisma";
import { parseKmFromDistance, getAutonomousCommunity } from "../src/lib/utils";

async function main() {
  console.log("[backfill] Leyendo carreras existentes...");
  const races = await prisma.race.findMany({
    select: {
      id: true,
      distance: true,
      province: true,
      distanceKm: true,
      community: true,
      url: true,
      registrationUrl: true,
    },
  });

  let processed = 0;
  let updated = 0;

  for (const race of races) {
    processed += 1;
    const distanceKm = parseKmFromDistance(race.distance);
    const community = getAutonomousCommunity(race.province);
    const data: {
      distanceKm?: number | null;
      community?: string;
      registrationUrl?: string | null;
    } = {};

    if (race.distanceKm !== (distanceKm ?? null)) data.distanceKm = distanceKm;
    if (!race.community || race.community !== community) data.community = community;
    if (!race.registrationUrl && race.url) data.registrationUrl = race.url;

    if (Object.keys(data).length > 0) {
      await prisma.race.update({ where: { id: race.id }, data });
      updated += 1;
    }

    if (processed % 500 === 0) console.log(`[backfill] Procesadas ${processed}/${races.length} (actualizadas ${updated})`);
  }

  console.log(`[backfill] Completado: ${processed} procesadas, ${updated} actualizadas.`);
}

main()
  .catch((err) => {
    console.error("[backfill] Error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
