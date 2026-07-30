import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import RaceCard from "@/components/RaceCard";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

const provinceNames: Record<string, string> = {
  araba: "Álava/Araba",
  alava: "Álava/Araba",
  bizkaia: "Bizkaia",
  gipuzkoa: "Gipuzkoa",
  cantabria: "Cantabria",
  burgos: "Burgos",
  larioja: "La Rioja",
  rioja: "La Rioja",
  navarra: "Navarra",
  zamora: "Zamora",
};

const provinceMeta: Record<string, { title: string; description: string }> = {
  araba: {
    title: "Carreras populares en Álava/Araba",
    description: "Calendario de carreras populares en Álava/Araba. Running, trail, media maratón y marchas en Vitoria-Gasteiz y toda la provincia.",
  },
  alava: {
    title: "Carreras populares en Álava/Araba",
    description: "Calendario de carreras populares en Álava/Araba. Running, trail, media maratón y marchas en Vitoria-Gasteiz y toda la provincia.",
  },
  bizkaia: {
    title: "Carreras populares en Bizkaia",
    description: "Calendario de carreras populares en Bizkaia. Running, trail, media maratón y marchas en Bilbao, Getxo, Durango y toda la provincia.",
  },
  gipuzkoa: {
    title: "Carreras populares en Gipuzkoa",
    description: "Calendario de carreras populares en Gipuzkoa. Running, trail, media maratón y marchas en Donostia, Irun, Eibar y toda la provincia.",
  },
  cantabria: {
    title: "Carreras populares en Cantabria",
    description: "Calendario de carreras populares en Cantabria. Running, trail, media maratón y marchas en Santander, Torrelavega y toda la provincia.",
  },
  burgos: {
    title: "Carreras populares en Burgos",
    description: "Calendario de carreras populares en la provincia de Burgos. Running, trail, media maratón y marchas en Burgos capital y la provincia.",
  },
  larioja: {
    title: "Carreras populares en La Rioja",
    description: "Calendario de carreras populares en La Rioja. Running, trail, media maratón y marchas en Logroño y toda la comunidad.",
  },
  rioja: {
    title: "Carreras populares en La Rioja",
    description: "Calendario de carreras populares en La Rioja. Running, trail, media maratón y marchas en Logroño y toda la comunidad.",
  },
  navarra: {
    title: "Carreras populares en Navarra",
    description: "Calendario de carreras populares en Navarra. Running, trail, media maratón y marchas en Pamplona, Tudela y toda la comunidad foral.",
  },
  zamora: {
    title: "Carreras populares en Zamora",
    description: "Calendario de carreras populares en la provincia de Zamora. Running, trail, media maratón y marchas en Zamora capital y la provincia.",
  },
};

interface PageProps {
  params: Promise<{ provincia: string }>;
}

export async function generateStaticParams() {
  return Object.keys(provinceNames).map((provincia) => ({ provincia }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { provincia } = await params;
  const slug = provincia.toLowerCase();
  const name = provinceNames[slug];

  if (!name) return { title: "Provincia no encontrada - JavipaurRun" };

  const meta = provinceMeta[slug] || {
    title: `Carreras populares en ${name}`,
    description: `Calendario de carreras populares en ${name}. Encuentra tu próxima carrera.`,
  };

  return {
    title: `${meta.title} - JavipaurRun`,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function ProvincePage({ params }: PageProps) {
  const { provincia } = await params;
  const slug = provincia.toLowerCase();
  const name = provinceNames[slug];

  if (!name) notFound();

  const dbProvince = name; // e.g. "Álava/Araba" or "Bizkaia"

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
            Carreras en {name}
          </h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
          {races.length} carrera{races.length !== 1 ? "s" : ""} próxima{races.length !== 1 ? "s" : ""} en {name}
        </p>
      </div>

      {/* Type stats */}
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
          <p className="text-gray-500 font-medium mb-1">No hay carreras próximas en {name}</p>
          <p className="text-gray-400 text-sm mb-4">Prueba a buscar en otras provincias cercanas</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(provinceNames)
              .filter(([k]) => k !== slug && !(slug === "alava" && k === "araba") && !(slug === "araba" && k === "alava") && !(slug === "larioja" && k === "rioja") && !(slug === "rioja" && k === "larioja"))
              .slice(0, 4)
              .map(([k, v]) => (
                <Link
                  key={k}
                  href={`/carreras/${k}`}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {v}
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
