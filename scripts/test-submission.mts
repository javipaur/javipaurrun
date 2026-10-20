import assert from "node:assert/strict";
import { normalizeRaceSubmission } from "../src/lib/race-submission";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK - ${name}`);
  } catch (error) {
    console.error(`FAIL - ${name}`);
    throw error;
  }
}

run("normaliza una propuesta completa", () => {
  const result = normalizeRaceSubmission({
    name: "  Carrera Popular de Vitoria  ",
    type: "TRAIL",
    distance: "21,1 km",
    city: "Vitoria",
    province: "Araba",
    date: "2027-05-10",
    url: "https://ejemplo.com",
    registrationUrl: "",
  });

  assert.equal(result.name, "Carrera Popular de Vitoria");
  assert.equal(result.slug, "carrera-popular-de-vitoria");
  assert.equal(result.distanceKm, 21.1);
  assert.equal(result.location, "Vitoria");
  assert.equal(result.city, "Vitoria");
  assert.equal(result.province, "Araba");
  assert.equal(result.community, "pais-vasco");
  assert.equal(result.url, "https://ejemplo.com");
  assert.equal(result.registrationUrl, undefined);
  assert.equal(result.source, "manual");
  assert.equal(result.pendingReview, true);
});

run("deriva la ubicación desde la provincia si no hay ciudad", () => {
  const result = normalizeRaceSubmission({
    name: "Trail de la Sierra",
    type: "TRAIL",
    province: "Madrid",
    date: "2027-06-01",
  });

  assert.equal(result.location, "Madrid");
  assert.equal(result.city, null);
  assert.equal(result.community, "madrid");
  assert.equal(result.distanceKm, null);
});

run("slug sin acentos para evitar problemas de URL", () => {
  const result = normalizeRaceSubmission({
    name: "Marcha de Cerdanyola del Vallès",
    type: "MARCHA",
    province: "Barcelona",
    date: "2027-04-20",
  });

  assert.equal(result.slug, "marcha-de-cerdanyola-del-valles");
});

console.log("Tests de alta de carreras: OK");