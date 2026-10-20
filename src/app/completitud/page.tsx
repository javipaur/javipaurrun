import type { Metadata } from "next";
import Link from "next/link";
import { getDataQuality, timeAgo } from "@/lib/data-quality";
import { slugForProvinceName } from "@/lib/utils";
import { siteUrl } from "@/lib/site-url-server";
import { ArrowRight, CheckCircle2, Database, MapPinned, Radio } from "lucide-react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Estado y calidad de los datos",
  description:
    "Cuántas carreras hay en JavipaurRun, de qué fuentes proceden, cuándo se sincronizaron por última vez y qué porcentaje de campos (ciudad, precio, distancia, coordenadas) está completo. Transparencia total sobre el calendario de carreras de España.",
  alternates: { canonical: "/completitud" },
  openGraph: {
    title: "Estado y calidad de los datos | JavipaurRun",
    description:
      "Transparencia total: fuentes, sincronización y completitud de los datos del calendario de carreras de España.",
    url: "/completitud",
    siteName: "JavipaurRun",
    type: "website",
    locale: "es_ES",
  },
};

/** Color del estado de una fuente. */
function statusTone(status: string | null) {
  const s = (status || "").toUpperCase();
  if (s.includes("FAIL") || s.includes("ERROR")) return "text-red-400";
  if (s.includes("PARTIAL") || s.includes("WARN")) return "text-amber-400";
  return "text-emerald-400";
}

export default async function CompletitudPage() {
  const SITE_URL = await siteUrl();
  const dq = await getDataQuality();

  // Estado degradado: preferimos decirlo a renderizar una página vacía.
  if (!dq.ok) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 md:py-24 text-center">
        <Database size={28} className="text-text-tertiary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          No podemos mostrar las métricas ahora mismo
        </h1>
        <p className="text-text-secondary leading-relaxed mb-6">
          No hemos podido leer el calendario para calcular la cobertura. El resto del sitio
          sigue funcionando; inténtalo de nuevo en unos minutos.
        </p>
        <Link href="/calendario" className="btn-primary">
          Ir al calendario
          <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  const bestField = [...dq.fields].sort((a, b) => b.percent - a.percent)[0];
  const worstField = [...dq.fields].sort((a, b) => a.percent - b.percent)[0];

  // slugForProvinceName y no PROVINCE_SLUGS[...]: el nombre de la BD puede ser
  // "Araba" mientras el slug se llama "Álava/Araba", y con el lookup directo
  // esas provincias salían sin enlace.
  const linkedProvinces = dq.provinces
    .map((p) => ({ ...p, slug: slugForProvinceName(p.province) }))
    .filter((p): p is typeof p & { slug: string } => p.slug !== null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Calendario de carreras populares de España (JavipaurRun)",
    description:
      "Directorio de carreras populares en España con fecha, distancia, localidad y enlace de inscripción.",
    creator: { "@id": `${SITE_URL}/#organization` },
    isAccessibleForFree: true,
    dateModified: (dq.lastSync ?? new Date()).toISOString().slice(0, 10),
    variableMeasured: [
      { "@type": "PropertyValue", name: "Carreras totales", value: dq.total },
      { "@type": "PropertyValue", name: "Próximas", value: dq.upcoming },
      { "@type": "PropertyValue", name: "Provincias", value: dq.provinceCount },
    ],
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <p className="section-eyebrow mb-1.5">Transparencia</p>
      <h1 className="section-title mb-4">Estado y calidad de los datos</h1>

      <p className="text-text-secondary leading-relaxed max-w-3xl mb-8">
        Reunimos carreras de varias plataformas organizadoras y las normalizamos en un
        único calendario. Ninguna fuente cubre todo el país, así que{" "}
        <strong className="text-text-primary">
          preferimos decirte dónde faltan datos a fingir que no existen
        </strong>
        . Esta página se actualiza con el calendario y refleja exactamente lo que hay
        en la base de datos ahora mismo.
      </p>

      {/* Cifras principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stats-card">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1">
            Carreras
          </p>
          <p className="text-3xl font-black text-text-primary tabular-nums">{dq.total}</p>
        </div>
        <div className="stats-card">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1">
            Próximas
          </p>
          <p className="text-3xl font-black text-primary tabular-nums">{dq.upcoming}</p>
        </div>
        <div className="stats-card">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1">
            Provincias
          </p>
          <p className="text-3xl font-black text-text-primary tabular-nums">
            {dq.provinceCount}
          </p>
        </div>
        <div className="stats-card">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1">
            Fuentes
          </p>
          <p className="text-3xl font-black text-text-primary tabular-nums">
            {dq.sources.length}
          </p>
        </div>
      </div>

      {/* Última sincronización */}
      <div className="card-premium p-4 sm:p-5 mb-8 flex items-start gap-3">
        <Radio size={18} className="text-primary mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-text-primary">
            Última sincronización: {timeAgo(dq.lastSync)}
          </p>
          <p className="text-text-secondary mt-0.5">
            {dq.lastSync
              ? `El calendario se reconstruye automáticamente contra cada fuente. La información puede cambiar en origen; siempre puedes seguir el enlace de inscripción original.`
              : `Todavía no hay registro de sincronización. Los datos provienen del alta manual y de las fuentes indexadas.`}
          </p>
        </div>
      </div>

      {/* Completitud por campo */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-text-primary mb-1">Completitud por campo</h2>
        <p className="text-sm text-text-secondary mb-5">
          Porcentaje de las {dq.upcoming} próximas que tienen cada dato.{" "}
          {worstField && worstField.percent < 100 && (
            <>
              El campo más débil es{" "}
              <strong className="text-text-primary">{worstField.label.toLowerCase()}</strong> (
              {worstField.percent}%) — si falta, puedes corregirlo desde la ficha de la carrera.
            </>
          )}
        </p>

        <div className="card-premium p-5 sm:p-6 space-y-4">
          {dq.fields.map((f) => (
            <div key={f.key}>
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <span className="text-sm font-medium text-text-primary">{f.label}</span>
                <span className="text-sm font-bold tabular-nums text-text-primary">
                  {f.percent}
                  <span className="text-text-tertiary font-normal">%</span>
                </span>
              </div>
              <div
                className="h-2 rounded-full bg-surface-elevated overflow-hidden"
                role="progressbar"
                aria-valuenow={f.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${f.label}: ${f.percent}% completo`}
              >
                <div
                  className="h-full rounded-full bg-brand-gradient transition-[width] duration-700"
                  style={{ width: `${Math.max(f.percent, 1)}%` }}
                />
              </div>
              <p className="text-xs text-text-tertiary mt-1 tabular-nums">
                {f.filled.toLocaleString("es-ES")} de {f.total.toLocaleString("es-ES")}
              </p>
            </div>
          ))}
        </div>

        {bestField && bestField.percent === 100 && (
          <p className="text-sm text-text-secondary mt-4 flex items-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            <span>
              <strong className="text-text-primary">{bestField.label}</strong> está completo en
              el 100% de las próximas: es el dato en el que más puedes confiar para planificar.
            </span>
          </p>
        )}
      </section>

      {/* Fuentes */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-text-primary mb-1">De dónde salen los datos</h2>
        <p className="text-sm text-text-secondary mb-5">
          Cada fuente aporta un volumen distinto. El enlace de inscripción que verás en cada
          carrera apunta siempre al organizador original.
        </p>

        <div className="card-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 sm:px-5 py-3 font-semibold text-text-tertiary text-xs uppercase tracking-wide">
                    Fuente
                  </th>
                  <th className="px-4 sm:px-5 py-3 font-semibold text-text-tertiary text-xs uppercase tracking-wide">
                    Carreras
                  </th>
                  <th className="px-4 sm:px-5 py-3 font-semibold text-text-tertiary text-xs uppercase tracking-wide">
                    Última sync
                  </th>
                  <th className="px-4 sm:px-5 py-3 font-semibold text-text-tertiary text-xs uppercase tracking-wide">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {dq.sources.map((s) => (
                  <tr key={s.source} className="border-b border-border/60 last:border-0">
                    <td className="px-4 sm:px-5 py-3 font-medium text-text-primary">
                      {s.label}
                    </td>
                    <td className="px-4 sm:px-5 py-3 tabular-nums text-text-secondary">
                      {s.count.toLocaleString("es-ES")}
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-text-secondary">
                      {timeAgo(s.lastSync)}
                    </td>
                    <td
                      className={`px-4 sm:px-5 py-3 font-semibold capitalize ${statusTone(s.lastStatus)}`}
                    >
                      {s.lastStatus ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Cobertura por provincia */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-text-primary mb-1">
          Cobertura por provincia
        </h2>
        <p className="text-sm text-text-secondary mb-5">
          La cobertura no es uniforme: Madrid o Barcelona tienen muchas más carreras que
          provincias pequeñas. Puedes ver el detalle de cada una entrando en su página.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {linkedProvinces.map((p) => (
            <Link
              key={p.province}
              href={`/carreras/${p.slug}`}
              className="card-premium card-premium-hover p-4 flex items-center justify-between gap-2"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-text-primary truncate">
                  {p.province}
                </span>
                <span className="block text-xs text-text-tertiary truncate">
                  {p.communityLabel}
                </span>
              </span>
              <span className="text-sm font-bold tabular-nums text-primary shrink-0">
                {p.count}
              </span>
            </Link>
          ))}
        </div>

        {linkedProvinces.length === 0 && (
          <p className="text-sm text-text-secondary">
            Aún no hay provincias con suficiente cobertura para enlazar.
          </p>
        )}
      </section>

      {/* Desglose por tipo */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-text-primary mb-5">Próximas por disciplina</h2>
        <div className="flex flex-wrap gap-2.5">
          {dq.types.map((t) => (
            <Link
              key={t.type}
              href={`/calendario?tipo=${t.type}`}
              className="chip hover:chip-active"
            >
              <span className={`type-dot dot-${t.type}`} />
              {t.label}
              <span className="text-text-tertiary tabular-nums">({t.count})</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="card-premium p-6 sm:p-8 text-center">
        <Database size={24} className="text-primary mx-auto mb-3" />
        <h2 className="text-lg font-bold text-text-primary mb-1.5">
          ¿Falta alguna carrera?
        </h2>
        <p className="text-sm text-text-secondary mb-5 max-w-md mx-auto">
          Si conoces un evento que no está en el calendario, añádelo. Revisamos cada envío
          antes de publicarlo.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/calendario" className="btn-primary">
            Explorar calendario
            <ArrowRight size={15} />
          </Link>
          <Link href="/enviar-carrera" className="btn-secondary">
            <MapPinned size={15} />
            Añadir una carrera
          </Link>
        </div>
      </div>
    </div>
  );
}
