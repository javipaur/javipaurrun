import assert from "node:assert/strict";
import {
  scrapeFromCarrerasPopulares,
  scrapeFromBuscametas,
  scrapeFromKronoak,
  scrapeFromMonrasin,
  scrapeFromFAA,
} from "../src/lib/scraping";

async function main() {
  const sources = [
    { name: "CarrerasPopulares", run: scrapeFromCarrerasPopulares, min: 1 },
    { name: "Buscametas", run: scrapeFromBuscametas, min: 1 },
    { name: "Kronoak", run: scrapeFromKronoak, min: 1 },
    { name: "Monrasin", run: scrapeFromMonrasin, min: 0 },
    { name: "FAA Aragón", run: scrapeFromFAA, min: 1 },
  ];

  let total = 0;
  for (const source of sources) {
    const races = await source.run();
    console.log(`${source.name}: ${races.length} carreras`);
    assert.ok(races.length >= source.min, `${source.name} devolvió menos carreras de las esperadas`);
    total += races.length;
  }

  console.log(`Total combinado: ${total} carreras`);
  console.log("Smoke fuentes: OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
