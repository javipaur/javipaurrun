import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, getRaceDetailColor, getRaceTypeLabel } from "@/lib/utils";
import { startOfToday } from "@/lib/time";
import { EventJsonLd } from "@/components/JsonLd";
import RaceDetailClient from "./RaceDetailClient";
import RaceHeroImage from "./RaceHeroImage";
import RelatedRaces from "@/components/RelatedRaces";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Calendar, Clock, ExternalLink, MapPin, Tag } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

/**
 * Las fichas proximas se prerenderizan (las que reciben trafico de busqueda);
 * el resto de las 2.200 carreras se generan bajo demanda y se cachean igual.
 * Sin esta funcion la ruta responde `Cache-Control: no-store` y no hay ISR.
 */
export async function generateStaticParams() {
  try {
    const races = await prisma.race.findMany({
      where: { pendingReview: false, date: { gte: startOfToday() } },
      orderBy: { date: "asc" },
      select: { slug: true },
      take: 500,
    });
    return races.map((race) => ({ slug: race.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const race = await prisma.race.findUnique({ where: { slug } });
  if (!race) return { title: "Carrera no encontrada" };

  return {
    title: race.name,
    description:
      race.description?.slice(0, 160) ||
      `${race.name} el ${formatDate(race.date)} en ${race.location}, ${race.province}. ${race.distance ? `Distancia: ${race.distance}.` : ""} ${race.type}`,
    alternates: { canonical: `/carrera/${race.slug}` },
    openGraph: {
      url: `/carrera/${race.slug}`,
      ...(race.image ? { images: [{ url: race.image, width: 1200, height: 630 }] } : {}),
    },
  };
}

export default async function RaceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const race = await prisma.race.findUnique({ where: { slug } });

  if (!race) notFound();

  const related = await prisma.race.findMany({
    where: {
      id: { not: race.id },
      date: { gte: startOfToday() },
      OR: [
        { province: race.province },
        { type: race.type },
      ],
    },
    orderBy: { date: "asc" },
    take: 4,
  });

  const isPast = new Date(race.date) < new Date();
  const typeLabel = getRaceTypeLabel(race.type);
  const typeColor = getRaceDetailColor(race.type);

  return (
    <>
      <EventJsonLd
        name={race.name}
        date={race.date.toISOString()}
        endDate={race.endDate ? race.endDate.toISOString() : null}
        location={race.location}
        province={race.province}
        url={race.url}
        description={race.description}
        image={race.image}
        status={race.status}
        price={race.price}
      />

      <div className="max-w-4xl mx-auto">
        <div className="px-4 sm:px-6 pt-6">
          <Breadcrumbs
            items={[
              { href: "/calendario", label: "Calendario" },
              { label: race.name },
            ]}
          />
        </div>

        <div className="px-4 sm:px-6 py-6 md:py-8">
          <article className="card-premium overflow-hidden">
            {race.image && <RaceHeroImage src={race.image} alt={race.name} />}

            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${typeColor}`}>
                  {typeLabel}
                </span>
                {race.distance && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {race.distance}
                  </span>
                )}
                {race.status === "INSCRIPCIONES_ABIERTAS" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                    Inscripciones abiertas
                  </span>
                )}
                {race.status === "CANCELADA" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700">
                    Cancelada
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white mb-7 leading-tight tracking-tight">
                {race.name}
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Calendar size={16} className="shrink-0 text-gray-400" />
                    <span>
                      <time dateTime={race.date.toISOString().slice(0, 10)}>{formatDate(race.date)}</time>
                    </span>
                    {race.endDate && (
                      <span className="text-gray-400">— {formatDate(race.endDate)}</span>
                    )}
                  </div>
                  {race.time && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Clock size={16} className="shrink-0 text-gray-400" />
                      <span>{race.time}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <MapPin size={16} className="shrink-0 text-gray-400" />
                    <span>{race.location}, {race.province}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {race.price && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Tag size={16} className="shrink-0 text-gray-400" />
                      <span>{race.price}</span>
                    </div>
                  )}
                  {race.source && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <ExternalLink size={16} className="shrink-0 text-gray-400" />
                      <span>Fuente: {race.source}</span>
                    </div>
                  )}
                </div>
              </div>

              {race.url && (
                <div className="mb-8">
                  <a
                    href={race.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    <ExternalLink size={16} />
                    {isPast ? "Ver resultado" : "Inscribirme"}
                  </a>
                </div>
              )}

              <div className="mb-8">
                <p className="section-eyebrow mb-2">Descripción</p>
                {race.description ? (
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                    {race.description}
                  </p>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {race.name} se celebra el {formatDate(race.date)} en {race.location} ({race.province}).
                    {race.distance ? ` La prueba tiene una distancia de ${race.distance}.` : ""}{" "}
                    Consulta la información oficial del organizador para horarios, recorrido y detalles de la inscripción.
                  </p>
                )}
              </div>

              <RaceDetailClient race={race} />
            </div>
          </article>
        </div>

        <div className="px-4 sm:px-6">
          <RelatedRaces races={related} />
        </div>
      </div>
    </>
  );
}
