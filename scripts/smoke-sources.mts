import assert from "node:assert/strict";
import { scrapeFromCarrerasPopulares, scrapeFromBuscametas } from "../src/lib/scraping";

async function main() {
  const sources = [
    { name: "CarrerasPopulares", run: scrapeFromCarrerasPopulares, min: 1 },
    { name: "Buscametas", run: scrapeFromBuscametas, min: 1 },
  ];

  let total = 0;
  for (const source of sources) {
    const races = await source.run();
    console.log(`${source.name}: ${races.length} carreras`);
    assert.ok(races.length >= source.min, `${source.name} devolvió 0 carreras`);
    total += races.length;
  }

  console.log(`Total combinado: ${total} carreras`);
  console.log("Smoke fuentes: OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
