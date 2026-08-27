import "dotenv/config";
import { runAllScrapers } from "../src/lib/scraping";
import { prisma } from "../src/lib/prisma";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Falta DATABASE_URL en .env");
    process.exit(1);
  }

  console.log("Iniciando scraping completo de carreras...");
  const started = Date.now();

  const results = await runAllScrapers();

  console.log("\n=== RESULTADO POR FUENTE ===");
  let totalFound = 0;
  let totalImported = 0;
  for (const r of results) {
    totalFound += r.found;
    totalImported += r.imported;
    const status = r.error ? `ERROR: ${r.error}` : "OK";
    console.log(
      `- ${r.label.padEnd(16)} encontradas: ${String(r.found).padStart(5)} | nuevas: ${String(
        r.imported
      ).padStart(5)} | ${status}`
    );
  }

  const total = await prisma.race.count();
  const upcoming = await prisma.race.count({ where: { date: { gte: new Date() } } });

  console.log("\n=== RESUMEN ===");
  console.log(`Total encontradas: ${totalFound}`);
  console.log(`Total nuevas importadas: ${totalImported}`);
  console.log(`Carreras totales en BD: ${total}`);
  console.log(`Carreras próximas en BD: ${upcoming}`);
  console.log(`Tiempo: ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main()
  .catch((e) => {
    console.error("Error durante el scraping:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
