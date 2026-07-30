import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, getRaceTypeLabel } from "@/lib/utils";
import RaceCard from "@/components/RaceCard";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

const cities: Record<string, { name: string; province: string; description: string }> = {
  bilbao: {
    name: "Bilbao",
    province: "Bizkaia",
    description: "Carreras populares en Bilbao y alrededores. Running, trail y marchas en la capital de Bizkaia.",
  },
  "vitoria-gasteiz": {
    name: "Vitoria-Gasteiz",
    province: "Araba",
    description: "Carreras populares en Vitoria-Gasteiz. Running, trail y marchas en la capital de Álava/Araba.",
  },
  gasteiz: {
    name: "Vitoria-Gasteiz",
    province: "Araba",
    description: "Carreras populares en Vitoria-Gasteiz. Running, trail y marchas en la capital de Álava/Araba.",
  },
  donostia: {
    name: "Donostia-San Sebastián",
    province: "Gipuzkoa",
    description: "Carreras populares en Donostia-San Sebastián. Running, trail y marchas en la capital de Gipuzkoa.",
  },
  "san-sebastian": {
    name: "Donostia-San Sebastián",
    province: "Gipuzkoa",
    description: "Carreras populares en Donostia-San Sebastián. Running, trail y marchas en la capital de Gipuzkoa.",
  },
  santander: {
    name: "Santander",
    province: "Cantabria",
    description: "Carreras populares en Santander. Running, trail y marchas en la capital de Cantabria.",
  },
  logrono: {
    name: "Logroño",
    province: "La Rioja",
    description: "Carreras populares en Logroño. Running, trail y marchas en la capital de La Rioja.",
  },
  pamplona: {
    name: "Pamplona-Iruña",
    province: "Navarra",
    description: "Carreras populares en Pamplona-Iruña. Running, trail y marchas en la capital de Navarra.",
  },
  "pamplona-iruna": {
    name: "Pamplona-Iruña",
    province: "Navarra",
    description: "Carreras populares en Pamplona-Iruña. Running, trail y marchas en la capital de Navarra.",
  },
  burgos: {
    name: "Burgos",
    province: "Burgos",
    description: "Carreras populares en Burgos. Running, trail y marchas en la capital burgalesa.",
  },
  zamora: {
    name: "Zamora",
    province: "Zamora",
    description: "Carreras populares en Zamora. Running, trail y marchas en la capital zamorana.",
  },
  getxo: {
    name: "Getxo",
    province: "Bizkaia",
    description: "Carreras populares en Getxo. Running y trail en la costa de Bizkaia.",
  },
  durango: {
    name: "Durango",
    province: "Bizkaia",
    description: "Carreras populares en Durango. Running y trail en el Duranguesado.",
  },
  eibar: {
    name: "Eibar",
    province: "Gipuzkoa",
    description: "Carreras populares en Eibar. Running y trail en el corazón de Gipuzkoa.",
  },
  irun: {
    name: "Irun",
    province: "Gipuzkoa",
    description: "Carreras populares en Irun. Running y trail en la frontera de Gipuzkoa.",
  },
  "torrelavega": {
    name: "Torrelavega",
    province: "Cantabria",
    description: "Carreras populares en Torrelavega. Running y trail en Cantabria.",
  },
  tudela: {
    name: "Tudela",
    province: "Navarra",
    description: "Carreras populares en Tudela. Running y trail en la Ribera de Navarra.",
  },
  "barakaldo": {
    name: "Barakaldo",
    province: "Bizkaia",
    description: "Carreras populares en Barakaldo. Running en la Margen Izquierda de Bizkaia.",
  },
  portugalete: {
    name: "Portugalete",
    province: "Bizkaia",
    description: "Carreras populares en Portugalete. Running en la Margen Izquierda de Bizkaia.",
  },
  "santurtzi": {
    name: "Santurtzi",
    province: "Bizkaia",
    description: "Carreras populares en Santurtzi. Running en la Margen Izquierda de Bizkaia.",
  },
};

interface PageProps {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  return Object.keys(cities).map((city) => ({ city }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const info = cities[city.toLowerCase()];
  if (!info) return { title: "Ciudad no encontrada - JavipaurRun" };
  return {
    title: `Carreras populares en ${info.name} - JavipaurRun`,
    description: info.description,
    openGraph: {
      title: `Carreras populares en ${info.name}`,
      description: info.description,
    },
  };
}

export default async function CityPage({ params }: PageProps) {
  const { city } = await params;
  const info = cities[city.toLowerCase()];
  if (!info) notFound();

  const races = await prisma.race.findMany({
    where: {
      location: { contains: info.name },
      date: { gte: new Date() },
    },
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
          {races.length === 0 && (
            <span className="ml-1">
              · <Link href={`/carreras/${info.province.toLowerCase().replace(/[^a-z]/g, "")}`} className="text-orange-600 hover:text-orange-700">
                Ver carreras en {info.province}
              </Link>
            </span>
          )}
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
            href={`/carreras/${info.province.toLowerCase().replace(/[^a-z]/g, "")}`}
            className="px-5 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium"
          >
            Ver carreras en {info.province}
          </Link>
        </div>
      )}
    </div>
  );
}
