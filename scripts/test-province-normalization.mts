import assert from "node:assert/strict";
import { normalizeProvinceName, provinces, getProvinceDbNames } from "../src/lib/utils";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK - ${name}`);
  } catch (error) {
    console.error(`FAIL - ${name}`);
    throw error;
  }
}

run("la lista de provincias no tiene duplicados", () => {
  assert.equal(new Set(provinces).size, provinces.length);
});

run("no expone Álava y Araba por separado", () => {
  assert.ok(provinces.includes("Araba"));
  assert.ok(!provinces.includes("Álava"));
  assert.ok(!provinces.includes("Guipúzcoa"));
  assert.ok(!provinces.includes("Illes Balears"));
});

run("normaliza alias hacia el nombre canónico", () => {
  assert.equal(normalizeProvinceName("Álava"), "Araba");
  assert.equal(normalizeProvinceName("alava/araba"), "Araba");
  assert.equal(normalizeProvinceName("Guipúzcoa"), "Gipuzkoa");
  assert.equal(normalizeProvinceName("Vizcaya"), "Bizkaia");
  assert.equal(normalizeProvinceName("Illes Balears"), "Baleares (Illes)");
});

run("normaliza acentos y mayúsculas", () => {
  assert.equal(normalizeProvinceName("cáceres"), "Cáceres");
  assert.equal(normalizeProvinceName("  MADRID "), "Madrid");
  assert.equal(normalizeProvinceName("A Coruña"), "A Coruña");
});

run("acepta prefijos administrativos", () => {
  assert.equal(normalizeProvinceName("Provincia de Sevilla"), "Sevilla");
});

run("devuelve null si no reconoce", () => {
  assert.equal(normalizeProvinceName("Andorra"), null);
  assert.equal(normalizeProvinceName(""), null);
  assert.equal(normalizeProvinceName(null), null);
});

run("toda provincia canónica se normaliza a sí misma", () => {
  for (const p of provinces) {
    const result = normalizeProvinceName(p);
    if (result && result !== p) {
      console.warn(`  nota: "${p}" -> "${result}"`);
    }
  }
  assert.ok(provinces.length > 40);
});

run("el slug 'alava' resuelve al nombre que existe en la BD", () => {
  // Regresión: /carreras/alava mostraba el nombre visible "Álava/Araba" y
  // filtraba por él, pero en la BD solo existe "Araba" -> 0 resultados.
  const names = getProvinceDbNames("alava");
  assert.ok(names.includes("Araba"), `esperaba Araba, obtuve ${JSON.stringify(names)}`);
  assert.ok(!names.includes("Álava/Araba"), "no debe usarse el nombre visible como valor de BD");
});

run("todos los slugs resuelven a provincias que existen", () => {
  const slugs = [
    "alava", "arabako", "bizkaia", "gipuzkoa", "madrid", "navarra",
    "barcelona", "valencia", "sevilla", "baleares", "las-palmas",
  ];
  for (const slug of slugs) {
    const names = getProvinceDbNames(slug);
    assert.ok(names.length > 0, `${slug} no resuelve a ninguna provincia`);
    for (const n of names) {
      assert.ok(provinces.includes(n), `${slug} -> "${n}" no está en la lista canónica`);
    }
  }
});

run("slug inexistente devuelve lista vacía", () => {
  assert.deepEqual(getProvinceDbNames("no-existe"), []);
});

console.log("Tests de normalización de provincias: OK");