import assert from "node:assert/strict";
import { detectProvince, matchProvinceAlias } from "../src/lib/scraping";
import { slugForProvinceName } from "../src/lib/utils";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK - ${name}`);
  } catch (error) {
    console.error(`FAIL - ${name}`);
    throw error;
  }
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

run("detecta la provincia por el nombre de la carrera", () => {
  assert.equal(detectProvince("Maratón de Valencia"), "Valencia");
  assert.equal(detectProvince("Media Maratón de Sevilla"), "Sevilla");
  assert.equal(detectProvince("Trail de Tenerife"), "Santa Cruz de Tenerife");
});

run("detecta la provincia por la ciudad", () => {
  assert.equal(detectProvince("La Desértica VIII edición, Alicante"), "Alicante");
  assert.equal(detectProvince("BILBAO NIGHT RUN FEST"), "Bizkaia");
  assert.equal(detectProvince("Aramotz Mendi Lasterketa, Vitoria"), "Araba");
});

run("no confunde 'marcelona' con 'barcelona'", () => {
  // Regresión: los limites de palabra evitan el falso positivo.
  assert.notEqual(detectProvince("Maratón de Marbella"), "Barcelona");
});

run("Ceuta y Melilla ahora son detectables", () => {
  // Antes no estaban en el mapa y acababan siempre en "Otra".
  assert.equal(detectProvince("Carrera en Ceuta"), "Ceuta");
  assert.equal(detectProvince("Media Maratón de Melilla"), "Melilla");
});

run("la tabla de alias cubre topónimos que el mapa no lista", () => {
  assert.equal(matchProvinceAlias(norm("Celebracion en Coruna")), "A Coruña");
  assert.equal(matchProvinceAlias(norm("Logrono Trail")), "La Rioja");
  assert.equal(matchProvinceAlias(norm("Prueba en-player")), null);
});

run("la tabla de alias no da falsos positivos por subcadena", () => {
  // "illes" (alias de Baleares) no debe aparecer dentro de otra palabra.
  assert.equal(matchProvinceAlias(norm("Villares")), null);
  assert.equal(matchProvinceAlias(norm("Castrillo")), null);
});

run("texto vacio o irreconocible devuelve 'Otra'", () => {
  assert.equal(detectProvince(""), "Otra");
  assert.equal(detectProvince("Carrera sin lugar definido"), "Otra");
});

run("detectProvince usa el alias antes de rendirse con 'Otra'", () => {
  // "Logrono" solo esta en PROVINCE_CANON, no en el mapa de palabras clave.
  const detectado = detectProvince("Logrono Trail");
  assert.notEqual(detectado, "Otra", "deberia resolver la provincia desde el alias");
  assert.equal(detectado, "La Rioja");
});

run("el nombre canonico devuelto existe en PROVINCE_SLUGS", () => {
  // Si detectProvince devuelve un nombre que no tiene pagina, la carrera se pierde.
  const casos = [
    "Araba", "Albacete", "Alicante", "Almería", "Asturias", "Ávila",
    "Badajoz", "Baleares (Illes)", "Barcelona", "Burgos", "Cáceres", "Cádiz",
    "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "A Coruña", "Cuenca",
    "Girona", "Granada", "Guadalajara", "Gipuzkoa", "Huelva", "Huesca", "Jaén",
    "León", "Lleida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra",
    "Ourense", "Palencia", "Las Palmas", "Pontevedra", "La Rioja", "Salamanca",
    "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", "Tarragona",
    "Teruel", "Toledo", "Valencia", "Valladolid", "Bizkaia", "Zamora",
    "Zaragoza", "Ceuta", "Melilla",
  ];
  const utils = { slugForProvinceName };
  for (const c of casos) {
    assert.ok(
      utils.slugForProvinceName(c) !== null,
      `"${c}" no tiene pagina de provincia: se perderia en el sitemap`
    );
  }
});

console.log("Tests de deteccion de provincia: OK");
