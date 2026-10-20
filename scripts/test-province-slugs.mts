import assert from "node:assert/strict";
import { slugForProvinceName, getProvinceDbNames, PROVINCE_SLUGS } from "../src/lib/utils";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK - ${name}`);
  } catch (error) {
    console.error(`FAIL - ${name}`);
    throw error;
  }
}

run("nombre visible exacto devuelve su slug", () => {
  assert.equal(slugForProvinceName("Madrid"), "madrid");
  assert.equal(slugForProvinceName("Barcelona"), "barcelona");
  assert.equal(slugForProvinceName("Sevilla"), "sevilla");
});

run("insensible a mayusculas y acentos", () => {
  assert.equal(slugForProvinceName("madrid"), "madrid");
  assert.equal(slugForProvinceName("MÁLAGA"), "malaga");
  assert.equal(slugForProvinceName("  Cordoba  "), "cordoba");
});

run("'Araba' de la BD resuelve al slug 'alava'", () => {
  // Regresión: PROVINCE_SLUGS guarda "Álava/Araba" pero la BD guarda "Araba".
  // Con igualdad estricta el sitemap y /completitud lo perdían.
  assert.equal(slugForProvinceName("Araba"), "alava");
});

run("'Álava' y 'Álava/Araba' resuelven al mismo slug", () => {
  assert.equal(slugForProvinceName("Álava"), "alava");
  assert.equal(slugForProvinceName("Álava/Araba"), "alava");
});

run("'Baleares (Illes)' de la BD resuelve al slug 'baleares'", () => {
  assert.equal(slugForProvinceName("Baleares (Illes)"), "baleares");
  assert.equal(slugForProvinceName("Baleares"), "baleares");
});

run("nombres compuestos de la BD resuelven bien", () => {
  assert.equal(slugForProvinceName("A Coruña"), "a-coruna");
  assert.equal(slugForProvinceName("La Rioja"), "la-rioja");
  assert.equal(slugForProvinceName("Las Palmas"), "las-palmas");
  assert.equal(slugForProvinceName("Ciudad Real"), "ciudad-real");
  assert.equal(slugForProvinceName("Santa Cruz de Tenerife"), "santa-cruz-de-tenerife");
});

run("vacios y espacios devuelven null", () => {
  assert.equal(slugForProvinceName(""), null);
  assert.equal(slugForProvinceName("   "), null);
});

run("una provincia inexistente devuelve null en vez de un slug equivocado", () => {
  assert.equal(slugForProvinceName("Zzzzz"), null);
});

run("'Otra' (provincia no deducida) NO genera enlace", () => {
  // "Otra" es un valor centinela del scraper, no una provincia real.
  assert.equal(slugForProvinceName("Otra"), null);
});

run("ida y vuelta: cada nombre de BD vuelve a una pagina de la misma provincia", () => {
  for (const [slug, display] of Object.entries(PROVINCE_SLUGS)) {
    const dbNames = getProvinceDbNames(slug);
    assert.ok(dbNames.length > 0, `${slug} no devuelve nombres de BD`);
    for (const name of dbNames) {
      const resolved = slugForProvinceName(name);
      assert.ok(resolved, `"${name}" deberia tener slug`);
      // Puede haber slugs alias (alava / arabako): lo que importa es que ambos
      // apunten a la MISMA provincia, no al mismo string de slug.
      assert.equal(
        PROVINCE_SLUGS[resolved],
        display,
        `"${name}" resuelve a "${resolved}" (${PROVINCE_SLUGS[resolved]}) pero deberia ser "${display}"`
      );
    }
  }
});

run("solo hay un alias de slug duplicado y es Alava", () => {
  // Vigilancia: cada slug duplicado genera dos URLs con el mismo contenido.
  const byDisplay = new Map<string, string[]>();
  for (const [slug, display] of Object.entries(PROVINCE_SLUGS)) {
    byDisplay.set(display, [...(byDisplay.get(display) ?? []), slug]);
  }
  const dupes = [...byDisplay.entries()].filter(([, slugs]) => slugs.length > 1);
  assert.equal(dupes.length, 1, `duplicados inesperados: ${JSON.stringify(dupes)}`);
  assert.deepEqual(dupes[0][1].sort(), ["alava", "arabako"]);
});

console.log("Tests de provincias: OK");
