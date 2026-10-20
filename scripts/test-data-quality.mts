import assert from "node:assert/strict";
import { buildStats, timeAgo, type StatsInput } from "../src/lib/data-quality";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK - ${name}`);
  } catch (error) {
    console.error(`FAIL - ${name}`);
    throw error;
  }
}

/** Base limpia: 2 filas, todo relleno. */
function baseSample(overrides: Partial<StatsInput> = {}): StatsInput {
  const fullRow = {
    location: "Madrid",
    time: "09:00",
    distanceKm: 10,
    latitude: 40.4,
    url: "https://ejemplo.test",
    price: "20 €",
    image: "https://ejemplo.test/a.jpg",
    registrationUrl: "https://ejemplo.test/inscripcion",
  };
  return {
    total: 100,
    upcoming: 2,
    byProvince: [{ province: "Madrid", _count: 40 }],
    byType: [{ type: "ASFALTO", _count: 2 }],
    bySource: [{ source: "rockthesport", _count: 100 }],
    recentLogs: [],
    samples: [fullRow, { ...fullRow }],
    ...overrides,
  };
}

const fieldBy = (d: ReturnType<typeof buildStats>, key: string) =>
  d.fields.find((f) => f.key === key)!;

run("ok:true en datos válidos", () => {
  assert.equal(buildStats(baseSample()).ok, true);
});

run("todos los campos al 100% con filas completas", () => {
  const d = buildStats(baseSample());
  for (const f of d.fields) {
    assert.equal(f.percent, 100, `${f.key} debería estar al 100%`);
    assert.equal(f.total, 2);
  }
});

run("cuenta null como vacío", () => {
  const row = {
    location: null, time: null, distanceKm: null, latitude: null,
    url: null, price: null, image: null, registrationUrl: null,
  };
  const d = buildStats(baseSample({ samples: [row, row] }));
  assert.equal(fieldBy(d, "location").percent, 0);
  assert.equal(fieldBy(d, "price").percent, 0);
});

run("'Por determinar' cuenta como vacío", () => {
  // Es el valor por defecto del scraper: no debe contar como ciudad conocida.
  const s = baseSample().samples[0];
  const d = buildStats(baseSample({ samples: [{ ...s, location: "Por determinar" }, s] }));
  assert.equal(fieldBy(d, "location").filled, 1);
  assert.equal(fieldBy(d, "location").percent, 50);
});

run("cadena vacía y guion cuentan como vacías", () => {
  const s = baseSample().samples[0];
  const d = buildStats(baseSample({ samples: [{ ...s, price: "" }, { ...s, price: "-" }] }));
  assert.equal(fieldBy(d, "price").percent, 0);
});

run("espacios en blanco cuentan como vacíos", () => {
  const s = baseSample().samples[0];
  const d = buildStats(baseSample({ samples: [{ ...s, time: "   " }, s] }));
  assert.equal(fieldBy(d, "time").percent, 50);
});

run("distancia 0 no cuenta como conocida", () => {
  const s = baseSample().samples[0];
  const d = buildStats(baseSample({ samples: [{ ...s, distanceKm: 0 }, s] }));
  assert.equal(fieldBy(d, "distanceKm").filled, 1);
});

run("sin muestras no divide por cero", () => {
  const d = buildStats(baseSample({ samples: [], upcoming: 0 }));
  for (const f of d.fields) {
    assert.equal(f.percent, 0);
    assert.equal(Number.isNaN(f.percent), false);
  }
});

run("mediana de distancia ignora nulos y no negativos", () => {
  const s = baseSample().samples[0];
  const d = buildStats(baseSample({ samples: [{ ...s, distanceKm: 10 }, { ...s, distanceKm: 20 }, { ...s, distanceKm: null }] }));
  assert.equal(d.medianDistanceKm, 20);
});

run("mediana nula si ninguna carrera tiene distancia", () => {
  const s = baseSample().samples[0];
  const d = buildStats(baseSample({ samples: [{ ...s, distanceKm: null }, { ...s, distanceKm: null }] }));
  assert.equal(d.medianDistanceKm, null);
});

run("provincias ordenadas por número de carreras", () => {
  const d = buildStats(
    baseSample({
      byProvince: [
        { province: "Álava", _count: 3 },
        { province: "Madrid", _count: 90 },
        { province: "Ceuta", _count: 1 },
      ],
    })
  );
  assert.deepEqual(d.provinces.map((p) => p.province), ["Madrid", "Álava", "Ceuta"]);
  assert.equal(d.provinceCount, 3);
});

run("cada provincia trae su comunidad resuelta", () => {
  const d = buildStats(baseSample({ byProvince: [{ province: "Gipuzkoa", _count: 4 }] }));
  assert.equal(d.provinces[0].community, "pais-vasco");
});

run("fuente sin nombre no rompe el desglose", () => {
  const d = buildStats(baseSample({ bySource: [{ source: null, _count: 7 }] }));
  assert.equal(d.sources[0].source, "desconocida");
  assert.equal(d.sources[0].count, 7);
});

run("etiqueta de fuente desconocida cae al slug", () => {
  const d = buildStats(baseSample({ bySource: [{ source: "fuente-nueva", _count: 7 }] }));
  assert.equal(d.sources[0].label, "fuente-nueva");
});

run("última sync toma el registro más reciente de cualquier fuente", () => {
  const d = buildStats(
    baseSample({
      recentLogs: [
        { source: "a", createdAt: new Date("2026-01-01"), status: "SUCCESS" },
        { source: "b", createdAt: new Date("2026-10-01"), status: "PARTIAL" },
      ],
    })
  );
  assert.equal(d.lastSync?.toISOString(), "2026-10-01T00:00:00.000Z");
  assert.equal(d.sources.find((s) => s.source === "b")?.lastStatus, "PARTIAL");
});

run("sin logs la última sync es null, no undefined", () => {
  assert.equal(buildStats(baseSample({ recentLogs: [] })).lastSync, null);
});

run("una fuente caída con 0 carreras sigue apareciendo", () => {
  // Regresión: antes las fuentes sin carreras se perdían y ocultaban el fallo.
  const d = buildStats(
    baseSample({
      bySource: [{ source: "rockthesport", _count: 100 }],
      recentLogs: [
        { source: "rockthesport", createdAt: new Date("2026-10-02"), status: "SUCCESS" },
        { source: "buscametas", createdAt: new Date("2026-10-01"), status: "FAIL" },
      ],
    })
  );
  const fallida = d.sources.find((s) => s.source === "buscametas");
  assert.ok(fallida, "la fuente fallida debe aparecer en la tabla");
  assert.equal(fallida.count, 0);
  assert.equal(fallida.lastStatus, "FAIL");
});

run("la última sync cuenta fuentes caídas y sanas por igual", () => {
  const d = buildStats(
    baseSample({
      recentLogs: [
        { source: "rockthesport", createdAt: new Date("2026-10-01"), status: "SUCCESS" },
        { source: "buscametas", createdAt: new Date("2026-10-03"), status: "FAIL" },
      ],
    })
  );
  assert.equal(d.lastSync?.toISOString(), "2026-10-03T00:00:00.000Z");
});

run("los logs más antiguos no pisan a los recientes de su fuente", () => {
  const d = buildStats(
    baseSample({
      recentLogs: [
        { source: "a", createdAt: new Date("2026-10-05"), status: "SUCCESS" },
        { source: "a", createdAt: new Date("2020-01-01"), status: "FAIL" },
      ],
    })
  );
  assert.equal(d.lastSync?.toISOString(), "2026-10-05T00:00:00.000Z");
});

run("tipo desconocido cae al valor crudo en la etiqueta", () => {
  const d = buildStats(baseSample({ byType: [{ type: "RELETO", _count: 2 }] }));
  assert.equal(d.types[0].label, "RELETO");
});

run("timeAgo formatea pasado, presente y futuro", () => {
  const now = Date.now();
  assert.match(timeAgo(new Date(now - 30_000)), /instantes/);
  assert.match(timeAgo(new Date(now - 5 * 60_000)), /5 min/);
  assert.match(timeAgo(new Date(now - 3 * 3_600_000)), /3 h/);
  assert.match(timeAgo(new Date(now - 2 * 86_400_000)), /2 días/);
  assert.match(timeAgo(new Date(now - 60 * 86_400_000)), /2 meses/);
  assert.equal(timeAgo(null), "sin datos");
});

console.log("Tests de calidad de datos: OK");
