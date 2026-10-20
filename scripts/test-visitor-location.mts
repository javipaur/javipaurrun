import assert from "node:assert/strict";
import {
  normalizeProvinceFromText,
  locationFromNominatim,
  communityLabel,
} from "../src/lib/visitor-location";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK - ${name}`);
  } catch (error) {
    console.error(`FAIL - ${name}`);
    throw error;
  }
}

run("normaliza nombres con acentos", () => {
  assert.equal(normalizeProvinceFromText("Cáceres"), "Cáceres");
  assert.equal(normalizeProvinceFromText("A Coruña"), "A Coruña");
  assert.equal(normalizeProvinceFromText("Álava"), "Araba");
});

run("normaliza variantes de casing y espacios", () => {
  assert.equal(normalizeProvinceFromText("  madrid  "), "Madrid");
  assert.equal(normalizeProvinceFromText("VALENCIA"), "Valencia");
});

run("acepta prefijos tipo 'Provincia de X'", () => {
  assert.equal(normalizeProvinceFromText("Provincia de Sevilla"), "Sevilla");
});

run("devuelve null si no reconoce la provincia", () => {
  assert.equal(normalizeProvinceFromText("Andorra"), null);
  assert.equal(normalizeProvinceFromText(""), null);
  assert.equal(normalizeProvinceFromText(undefined), null);
});

run("extrae provincia de la respuesta de Nominatim", () => {
  const result = locationFromNominatim(
    { address: { province: "Álava", country: "España" } },
    42.84,
    -2.67
  );
  assert.equal(result.province, "Araba");
  assert.equal(result.community, "pais-vasco");
  assert.equal(result.lat, 42.84);
});

run("usa state como fallback de Nominatim", () => {
  const result = locationFromNominatim({ address: { state: "Barcelona" } }, 41.38, 2.17);
  assert.equal(result.province, "Barcelona");
  assert.equal(result.community, "cataluna");
});

run("usa state_district cuando state es la comunidad (caso real ES)", () => {
  // Respuesta real de Nominatim para Vitoria.
  const result = locationFromNominatim(
    {
      address: {
        city: "Vitoria",
        county: "Cuadrilla de Vitoria",
        state_district: "Álava",
        state: "País Vasco",
        country: "España",
      },
    },
    42.8467,
    -2.6716
  );
  assert.equal(result.province, "Araba");
  assert.equal(result.community, "pais-vasco");
});

run("cae a la comunidad cuando no hay provincia", () => {
  const result = locationFromNominatim({ address: { state: "Cataluña" } }, 41.38, 2.17);
  assert.equal(result.province, null);
  assert.equal(result.community, "cataluna");
});

run("sigue funcionando sin address", () => {
  const result = locationFromNominatim({}, 40.4, -3.7);
  assert.equal(result.province, null);
  assert.equal(result.community, null);
  assert.equal(result.lat, 40.4);
});

run("etiquetas de comunidad legibles", () => {
  assert.equal(communityLabel("pais-vasco"), "País Vasco");
  assert.equal(communityLabel(null), "");
});

console.log("Tests de ubicación del visitante: OK");