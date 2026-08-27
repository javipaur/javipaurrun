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

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={20} className="text-orange-500" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Carreras en {displayName(name)}
          </h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
          {races.length} carrera{races.length !== 1 ? "s" : ""} próxima{races.length !== 1 ? "s" : ""} en {displayName(name)}
        </p>
      </div>

      {typeCounts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {typeCounts.map((t) => (
            <Link
              key={t.type}
              href={`/calendario?tipo=${t.type}&provincia=${encodeURIComponent(dbProvince)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {t.type.replace("_", " ").toLowerCase()}
              <span className="text-gray-400 font-medium">({t._count})</span>
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
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
          <MapPin size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 font-medium mb-1">No hay carreras próximas en {displayName(name)}</p>
          <p className="text-gray-400 text-sm mb-4">Prueba a buscar en otras provincias cercanas</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {allProvinceSlugs
              .filter((s) => s !== slug)
              .sort((a, b) => provinceSlugs[a].localeCompare(provinceSlugs[b], "es"))
              .slice(0, 6)
              .map((k) => (
                <Link
                  key={k}
                  href={`/carreras/${k}`}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
