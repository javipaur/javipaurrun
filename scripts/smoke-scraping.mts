import assert from "node:assert/strict";
import { scrapeFromCarrerasPopulares } from "../src/lib/scraping";
import { parseKmFromDistance } from "../src/lib/utils";

async function main() {
  const races = await scrapeFromCarrerasPopulares();
  console.log(`Smoke: ${races.length} carreras encontradas`);
  assert.ok(races.length > 0, "El scraper no devolvió carreras");

  for (const race of races) {
    assert.ok(race.name.length >= 3, "Nombre inválido");
    assert.ok(race.province, "Provincia vacía");
    assert.ok(race.date, "Fecha vacía");
    assert.ok(race.location, "Ubicación vacía");
    if (race.distance) {
      assert.ok(parseKmFromDistance(race.distance) !== undefined, `Distancia no parseable: ${race.distance}`);
    }
  }

  console.log("Smoke scraping: OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
