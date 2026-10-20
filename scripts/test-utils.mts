import assert from "node:assert/strict";
import {
  parseKmFromDistance,
  getAutonomousCommunity,
  getProvincesByCommunity,
  distanceRanges,
  haversineKm,
} from "../src/lib/utils";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK - ${name}`);
  } catch (error) {
    console.error(`FAIL - ${name}`);
    throw error;
  }
}

run("parseKmFromDistance con coma", () => {
  assert.equal(parseKmFromDistance("21,1 km"), 21.1);
});

run("parseKmFromDistance con punto", () => {
  assert.equal(parseKmFromDistance("10.5 km"), 10.5);
});

run("parseKmFromDistance sin valor", () => {
  assert.equal(parseKmFromDistance("sin distancia"), null);
});

run("autonomous community por provincia", () => {
  assert.equal(getAutonomousCommunity("Madrid"), "madrid");
  assert.equal(getAutonomousCommunity("Gipuzkoa"), "pais-vasco");
});

run("provincias por comunidad", () => {
  const vasco = getProvincesByCommunity("pais-vasco");
  assert.ok(vasco.includes("Araba"));
  assert.ok(vasco.includes("Bizkaia"));
  assert.ok(vasco.includes("Gipuzkoa"));
});

run("haversineKm Madrid-Barcelona", () => {
  const distance = haversineKm(40.4168, -3.7038, 41.3874, 2.1686);
  assert.ok(distance > 500 && distance < 515);
});

console.log("Tests de utilidades: OK");
