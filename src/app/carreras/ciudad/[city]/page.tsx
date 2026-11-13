import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RaceCard from "@/components/RaceCard";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { cities, cityWhere, canonicalCitySlug } from "@/lib/cities";
import { slugForProvinceName } from "@/lib/utils";


interface PageProps {
  params: Promise<{ city: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  return Object.keys(cities)
    .filter((city) => canonicalCitySlug(city) === city)
    .map((city) => ({ city }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const info = cities[city.toLowerCase()];
  if (!info) return { title: "Ciudad no encontrada", robots: { index: false, follow: false } };
  const canonical = `/carreras/ciudad/${canonicalCitySlug(city)}`;
  return {
    title: `Carreras populares en ${info.name}`,
    description: info.description,
    alternates: { canonical },
    openGraph: {
      title: `Carreras populares en ${info.name}`,
      description: info.description,
      url: canonical,
    },
  };
}

export default async function CityPage({ params }: PageProps) {
  const { city } = await params;
  const info = cities[city.toLowerCase()];
  if (!info) notFound();
  // `gasteiz` y `vitoria-gasteiz` servían el mismo contenido con dos URLs.
  if (city !== canonicalCitySlug(city)) permanentRedirect(`/carreras/ciudad/${canonicalCitySlug(city)}`);

  const provinceSlug =
    slugForProvinceName(info.province) ?? info.province.toLowerCase().replace(/[^a-z]/g, "");

  const races = await prisma.race.findMany({
    where: cityWhere(info),
    orderBy: { date: "asc" },
  });

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
            Carreras en {info.name}
          </h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
          {races.length} carrera{races.length !== 1 ? "s" : ""} próxima{races.length !== 1 ? "s" : ""} en {info.name}
          <span className="ml-1">
            · <Link href={`/carreras/${provinceSlug}`} className="text-orange-600 hover:text-orange-700">
              Ver todas en {info.province}
            </Link>
          </span>
        </p>
      </div>

      {races.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {races.map((race, i) => (
            <RaceCard key={race.id} race={race} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
          <MapPin size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 font-medium mb-1">No hay carreras próximas en {info.name}</p>
          <p className="text-gray-400 text-sm mb-4">Prueba a buscar en la provincia</p>
          <Link
            href={`/carreras/${provinceSlug}`}
            className="px-5 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium"
          >
            Ver carreras en {info.province}
          </Link>
        </div>
      )}
    </div>
  );
}
