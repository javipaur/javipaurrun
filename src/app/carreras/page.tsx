import type { Metadata } from "next";
import Link from "next/link";
import { getProvinceDirectory } from "@/lib/races";
import { getAutonomousCommunityLabel } from "@/lib/utils";
import { MapPin, ChevronRight, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Carreras por provincia",
  description:
    "Encuentra carreras populares en tu provincia: running, trail, media maratón y marchas. Directorio de carreras por provincia en toda España.",
  alternates: { canonical: "/carreras" },
};

export const revalidate = 3600;

const communityOrder = [
  "andalucia", "aragon", "asturias", "baleares", "canarias", "cantabria",
  "castilla-la-mancha", "castilla-y-leon", "cataluna", "comunidad-valenciana",
  "extremadura", "galicia", "la-rioja", "madrid", "murcia", "navarra",
  "pais-vasco", "otra",
];

export default async function ProvincesPage() {
  // Mismo directorio que usan la home y cada provincia: alias deduplicados y
  // contadores que cuadran entre páginas.
  const directory = await getProvinceDirectory();

  const grouped = new Map<string, typeof directory.allProvinces>();
  for (const province of directory.allProvinces) {
    if (!grouped.has(province.community)) grouped.set(province.community, []);
    grouped.get(province.community)!.push(province);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-brand-gradient/10 border border-orange-200/60 dark:border-orange-500/20 flex items-center justify-center">
            <MapPin size={22} className="text-orange-500" />
          </div>
          <div>
            <p className="section-eyebrow mb-0.5">Directorio nacional</p>
            <h1 className="section-title">Carreras por provincia</h1>
          </div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          {directory.upcomingTotal.toLocaleString("es-ES")} carreras próximas en{" "}
          {directory.provinceCount} provincias de toda España.
        </p>
        {directory.unassignedUpcoming > 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1.5 flex items-start gap-1.5">
            <Info size={13} className="mt-0.5 shrink-0" />
            <span>
              {directory.unassignedUpcoming.toLocaleString("es-ES")} de ellas todavía no tienen
              provincia asignada; puedes verlas en el{" "}
              <Link href="/calendario" className="text-orange-600 hover:text-orange-700 font-medium">
                calendario completo
              </Link>
              .
            </span>
          </p>
        )}
      </div>

      {communityOrder.map((community) => {
        const items = grouped.get(community);
        if (!items || items.length === 0) return null;
        return (
          <div key={community} className="mb-8">
            <h2 className="section-eyebrow mb-4">{getAutonomousCommunityLabel(community)}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items
                .sort((a, b) => a.label.localeCompare(b.label, "es"))
                .map((p) => (
                  <Link
                    key={p.slug}
                    href={`/carreras/${p.slug}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-3 card-premium transition-colors hover:border-orange-400/60 dark:hover:border-orange-400/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 shrink-0 rounded-lg bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-orange-500">
                        <MapPin size={16} />
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {p.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                        {p.count} carrera{p.count !== 1 ? "s" : ""}
                      </span>
                      <ChevronRight size={15} className="text-gray-300 group-hover:text-orange-400 dark:text-gray-600 transition-colors" />
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        );
      })}

      <div className="card-premium rounded-2xl px-6 py-6 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          ¿No ves tu comunidad? Prueba el{" "}
          <Link href="/calendario" className="text-orange-600 hover:text-orange-700 font-medium">
            calendario completo
          </Link>{" "}
          con todos los filtros.
        </p>
      </div>
    </div>
  );
}
