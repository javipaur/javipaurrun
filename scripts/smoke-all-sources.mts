import assert from "node:assert/strict";
import {
  scrapeFromCarrerasPopulares,
  scrapeFromBuscametas,
  scrapeFromLasterketak,
  scrapeFromRockTheSport,
  scrapeFromSportmaniacs,
} from "../src/lib/scraping";

async function main() {
  const sources = [
    { name: "CarrerasPopulares", run: scrapeFromCarrerasPopulares },
    { name: "Buscametas", run: scrapeFromBuscametas },
    { name: "Lasterketak", run: scrapeFromLasterketak },
    { name: "RockTheSport", run: scrapeFromRockTheSport },
    { name: "Sportmaniacs", run: scrapeFromSportmaniacs },
  ];

  let total = 0;
  for (const source of sources) {
    try {
      const races = await source.run();
      console.log(`${source.name}: ${races.length} carreras`);
      total += races.length;
    } catch (error) {
      console.error(`${source.name}: error`, error);
      throw error;
    }
  }

  console.log(`Total combinado: ${total} carreras`);
  console.log("Smoke todas las fuentes: OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
