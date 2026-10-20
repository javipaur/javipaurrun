import assert from "node:assert/strict";
import { scrapeFromBuscametas } from "../src/lib/scraping";

async function main() {
  const races = await scrapeFromBuscametas();
  console.log(`Smoke Buscametas: ${races.length} carreras encontradas`);
  assert.ok(races.length > 0, "Buscametas no devolvió carreras");

  for (const race of races) {
    assert.ok(race.name.length >= 3, "Nombre inválido");
    assert.ok(race.province, "Provincia vacía");
    assert.ok(race.date, "Fecha vacía");
    assert.ok(race.location, "Ubicación vacía");
  }

  console.log("Smoke Buscametas: OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
