import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RaceCard from "@/components/RaceCard";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { RACE_TYPE_LANDINGS, raceTypeLanding, raceTypeLandingWhere } from "@/lib/race-types";
import { upcomingWhere } from "@/lib/races";
import { ItemListJsonLd } from "@/components/JsonLd";

interface PageProps {
  params: Promise<{ tipo: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  return RACE_TYPE_LANDINGS.map((landing) => ({ tipo: landing.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tipo } = await params;
  const landing = raceTypeLanding(tipo.toLowerCase());
  if (!landing) return { title: "Categoría no encontrada", robots: { index: false, follow: false } };

  const path = `/carreras/tipo/${landing.slug}`;

  // Una landing sin carreras es contenido vacío: no se indexa hasta que la
  // sincronización traiga pruebas de esa disciplina. Sigue accesible por enlace.
  let hasRaces = true;
  try {
    hasRaces = (await prisma.race.count({ where: upcomingWhere(raceTypeLandingWhere(landing)) })) > 0;
  } catch {}

  return {
    title: landing.title,
    description: landing.description,
    alternates: { canonical: path },
    ...(hasRaces ? {} : { robots: { index: false, follow: true } }),
    openGraph: { title: landing.title, description: landing.description, url: path },
  };
}

export default async function RaceTypeLandingPage({ params }: PageProps) {
  const { tipo } = await params;
  const landing = raceTypeLanding(tipo.toLowerCase());
  if (!landing) notFound();

  const where = upcomingWhere(raceTypeLandingWhere(landing));

  const [races, total, provinceCounts] = await Promise.all([
    prisma.race.findMany({
      where,
      orderBy: { date: "asc" },
      take: 60,
    }),
    prisma.race.count({ where }),
    prisma.race.groupBy({ by: ["province"], where, _count: true }),
  ]);

  const otherLandings = RACE_TYPE_LANDINGS.filter((item) => item.slug !== landing.slug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      {races.length > 0 && (
        <ItemListJsonLd
          name={landing.heading}
          items={races.slice(0, 25).map((race) => ({
            name: race.name,
            url: `/carrera/${race.slug}`,
          }))}
        />
      )}

      <Link
        href="/calendario"
        className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Calendario completo
      </Link>

      <div className="mb-7">
        <p className="section-eyebrow mb-1.5">Por disciplina</p>
        <h1 className="section-title">{landing.heading}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          {total.toLocaleString("es-ES")} carrera{total !== 1 ? "s" : ""} próxima{total !== 1 ? "s" : ""} en{" "}
          {provinceCounts.length} provincia{provinceCounts.length !== 1 ? "s" : ""}
        </p>
      </div>

      <p className="text-text-secondary leading-relaxed max-w-3xl mb-8">{landing.intro}</p>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        {otherLandings.map((item) => (
          <Link key={item.slug} href={`/carreras/tipo/${item.slug}`} className="chip">
            {item.label}
          </Link>
        ))}
        <Link href="/carreras" className="chip">
          <MapPin size={13} />
          Por provincia
        </Link>
      </div>

      {races.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {races.map((race, i) => (
              <RaceCard key={race.id} race={race} index={i} />
            ))}
          </div>
          {total > races.length && (
            <div className="text-center mt-8">
              <Link href="/calendario" className="btn-secondary">
                <CalendarDays size={15} />
                Ver las {total.toLocaleString("es-ES")} carreras en el calendario
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 card-premium px-6">
          <p className="font-semibold text-gray-900 dark:text-white mb-1">
            Todavía no hay carreras de esta disciplina en el calendario
          </p>
          <p className="text-gray-500 text-sm mb-5">
            Se sincroniza a diario con las fuentes; vuelve en unos días o consulta el calendario completo.
          </p>
          <Link href="/calendario" className="btn-primary">
            Ir al calendario
            <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}
