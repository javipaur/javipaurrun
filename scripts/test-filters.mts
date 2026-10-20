import assert from "node:assert/strict";
import { buildCalendarWhere, buildCalendarOrder } from "../src/lib/race-filters";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK - ${name}`);
  } catch (error) {
    console.error(`FAIL - ${name}`);
    throw error;
  }
}

run("filtro por provincia", () => {
  const where = buildCalendarWhere({ provincia: "Madrid" }, new Date("2026-10-01"));
  assert.equal(where.province, "Madrid");
});

run("filtro por comunidad", () => {
  const where = buildCalendarWhere({ comunidad: "pais-vasco" }, new Date("2026-10-01"));
  assert.deepEqual(where.province, {
    in: ["Araba", "\u00c1lava", "Bizkaia", "Vizcaya", "Gipuzkoa", "Guip\u00fazcoa"],
  });
});

run("filtro por distancia", () => {
  const where = buildCalendarWhere({ distancia: "medio" }, new Date("2026-10-01"));
  assert.deepEqual(where.distanceKm, { gt: 5, lte: 15 });
});

run("filtro por mes", () => {
  const where = buildCalendarWhere({ mes: "2026-11" }, new Date("2026-10-15"));
  assert.ok(where.date && typeof where.date === "object");
});

run("busqueda case-insensitive", () => {
  const where = buildCalendarWhere({ buscar: "trail" }, new Date("2026-10-01"));
  assert.ok(Array.isArray(where.OR));
  assert.equal(where.OR?.length, 3);
});

run("orden por fecha por defecto", () => {
  assert.deepEqual(buildCalendarOrder({}), { date: "asc" });
});

run("orden por distancia asc", () => {
  assert.deepEqual(buildCalendarOrder({ orden: "distancia-asc" }), { distanceKm: "asc" });
});

console.log("Tests de filtros: OK");
