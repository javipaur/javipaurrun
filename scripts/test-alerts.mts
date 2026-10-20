import assert from "node:assert/strict";
import { matchesAlert, alertToCalendarFilters, normalizeAlertInput } from "../src/lib/alerts";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK - ${name}`);
  } catch (error) {
    console.error(`FAIL - ${name}`);
    throw error;
  }
}

const race = {
  province: "Araba",
  type: "TRAIL" as const,
  distanceKm: 21.1,
};

run("match sin filtros (acepta todo)", () => {
  assert.equal(
    matchesAlert(race, { province: null, community: null, type: null, minKm: null, maxKm: null }),
    true
  );
});

run("match por provincia", () => {
  assert.equal(
    matchesAlert(race, { province: "Araba", community: null, type: null, minKm: null, maxKm: null }),
    true
  );
  assert.equal(
    matchesAlert(race, { province: "Madrid", community: null, type: null, minKm: null, maxKm: null }),
    false
  );
});

run("match por comunidad", () => {
  assert.equal(
    matchesAlert(race, { province: null, community: "pais-vasco", type: null, minKm: null, maxKm: null }),
    true
  );
});

run("match por tipo", () => {
  assert.equal(
    matchesAlert(race, { province: null, community: null, type: "TRAIL", minKm: null, maxKm: null }),
    true
  );
  assert.equal(
    matchesAlert(race, { province: null, community: null, type: "ASFALTO", minKm: null, maxKm: null }),
    false
  );
});

run("rango de distancia incluye extremos", () => {
  assert.equal(
    matchesAlert(race, { province: null, community: null, type: null, minKm: 21.1, maxKm: 42 }),
    true
  );
  assert.equal(
    matchesAlert(race, { province: null, community: null, type: null, minKm: 25, maxKm: 42 }),
    false
  );
});

run("carrera sin distancia no matchea rangos", () => {
  assert.equal(
    matchesAlert(
      { province: "Araba", type: "TRAIL", distanceKm: null },
      { province: null, community: null, type: null, minKm: 0, maxKm: 42 }
    ),
    false
  );
});

run("alerta → filtros de calendario (rango conocido)", () => {
  const filters = alertToCalendarFilters({
    province: "Araba",
    community: null,
    type: "TRAIL",
    minKm: 15,
    maxKm: 42,
  });
  assert.equal(filters.provincia, "Araba");
  assert.equal(filters.tipo, "TRAIL");
  assert.equal(filters.distancia, "largo");
});

run("alerta → filtros de calendario (rango personalizado)", () => {
  const filters = alertToCalendarFilters({
    province: null,
    community: null,
    type: null,
    minKm: 8,
    maxKm: 18,
  });
  assert.equal(filters.distancia, undefined);
});

run("normalizeAlertInput limpia valores vacíos", () => {
  const result = normalizeAlertInput({ province: "  ", community: "madrid" });
  assert.equal(result.province, null);
  assert.equal(result.community, "madrid");
});

console.log("Tests de alertas: OK");