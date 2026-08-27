import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RaceCard from "@/components/RaceCard";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

const provinceSlugs: Record<string, string> = {
  "a-coruna": "A Coruña",
  alava: "Álava/Araba",
  arabako: "Álava/Araba",
  albacete: "Albacete",
  alicante: "Alicante",
  almeria: "Almería",
  asturias: "Asturias",
  avila: "Ávila",
  badajoz: "Badajoz",
  baleares: "Baleares",
  barcelona: "Barcelona",
  bizkaia: "Bizkaia",
  burgos: "Burgos",
  caceres: "Cáceres",
  cadiz: "Cádiz",
  cantabria: "Cantabria",
  castellon: "Castellón",
  "ciudad-real": "Ciudad Real",
  cordoba: "Córdoba",
  cuenca: "Cuenca",
  girona: "Girona",
  granada: "Granada",
  guadalajara: "Guadalajara",
  gipuzkoa: "Gipuzkoa",
  huelva: "Huelva",
  huesca: "Huesca",
  jaen: "Jaén",
  leon: "León",
  lleida: "Lleida",
  lugo: "Lugo",
  madrid: "Madrid",
  malaga: "Málaga",
  murcia: "Murcia",
  navarra: "Navarra",
  ourense: "Ourense",
  palencia: "Palencia",
  "las-palmas": "Las Palmas",
  pontevedra: "Pontevedra",
  "la-rioja": "La Rioja",
  salamanca: "Salamanca",
  "santa-cruz-de-tenerife": "Santa Cruz de Tenerife",
  segovia: "Segovia",
  sevilla: "Sevilla",
  soria: "Soria",
  tarragona: "Tarragona",
  teruel: "Teruel",
  toledo: "Toledo",
  valencia: "Valencia",
  valladolid: "Valladolid",
  zamora: "Zamora",
  zaragoza: "Zaragoza",
  ceuta: "Ceuta",
  melilla: "Melilla",
};

const canonicalDisplay: Record<string, string> = {
  "Álava/Araba": "Álava/Araba",
  Bizkaia: "Bizkaia",
  Gipuzkoa: "Gipuzkoa",
};

interface PageProps {
  params: Promise<{ provincia: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { provincia } = await params;
  const slug = provincia.toLowerCase();
  const name = provinceSlugs[slug];

  if (!name) return { title: "Provincia no encontrada - JavipaurRun" };

  const title = `Carreras populares en ${name} - JavipaurRun`;
  const description = `Calendario de carreras populares en ${name}. Running, trail, media maratón y marchas. Encuentra tu próxima carrera.`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

function displayName(canonical: string): string {
  return canonicalDisplay[canonical] || canonical;
}

export default async function ProvincePage({ params }: PageProps) {
  const { provincia } = await params;
  const slug = provincia.toLowerCase();
  const name = provinceSlugs[slug];

  if (!name) notFound();

  const dbProvince = name;

  const races = await prisma.race.findMany({
    where: {
      province: { contains: dbProvince },
      date: { gte: new Date() },
    },
    orderBy: { date: "asc" },
  });

  const typeCounts = await prisma.race.groupBy({
    by: ["type"],
    where: { province: { contains: dbProvince } },
    _count: true,
  });

  const allProvinceSlugs = Object.keys(provinceSlugs);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      <Link
        href="/calendario"
        className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Volver al calendario
      </Link>

      <div className="mb-7">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-brand-gradient/10 border border-orange-200/60 dark:border-orange-500/20 flex items-center justify-center">
            <MapPin size={22} className="text-orange-500" />
          </div>
          <div>
            <p className="section-eyebrow mb-0.5">Por provincia</p>
            <h1 className="section-title">
              Carreras en {displayName(name)}
            </h1>
          </div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          {races.length} carrera{races.length !== 1 ? "s" : ""} próxima{races.length !== 1 ? "s" : ""} en {displayName(name)}
        </p>
      </div>

      {typeCounts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-7">
          {typeCounts.map((t) => (
            <Link
              key={t.type}
              href={`/calendario?tipo=${t.type}&provincia=${encodeURIComponent(dbProvince)}`}
              className="chip"
            >
              {t.type.replace("_", " ").toLowerCase()}
              <span className="font-semibold opacity-60">({t._count})</span>
            </Link>
          ))}
        </div>
      )}

      {races.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {races.map((race, i) => (
            <RaceCard key={race.id} race={race} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 card-premium px-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center mb-4">
            <MapPin size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="font-semibold text-gray-900 dark:text-white mb-1">No hay carreras próximas en {displayName(name)}</p>
          <p className="text-gray-500 text-sm mb-5">Prueba a buscar en otras provincias cercanas</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {allProvinceSlugs
              .filter((s) => s !== slug)
              .sort((a, b) => provinceSlugs[a].localeCompare(provinceSlugs[b], "es"))
              .slice(0, 6)
              .map((k) => (
                <Link
                  key={k}
                  href={`/carreras/${k}`}
                  className="chip"
                >
                  {displayName(provinceSlugs[k])}
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
