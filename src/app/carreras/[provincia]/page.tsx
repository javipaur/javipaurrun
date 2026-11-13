import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RaceCard from "@/components/RaceCard";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin } from "lucide-react";
import {
  PROVINCE_SLUGS,
  canonicalProvinceSlug,
  canonicalProvinceSlugs,
  getRaceTypeLabel,
  getAutonomousCommunityLabel,
} from "@/lib/utils";
import { getProvinceDirectory, raceProvinceNames, upcomingWhere } from "@/lib/races";
import { ItemListJsonLd } from "@/components/JsonLd";

interface PageProps {
  params: Promise<{ provincia: string }>;
}

export const revalidate = 3600;

/**
 * Sin `generateStaticParams` la ruta se renderiza en cada peticion y Next
 * responde `Cache-Control: private, no-store`: el ISR de `revalidate` no llega
 * a aplicarse. Con la lista de provincias, las landings se prerenderizan.
 *
 * Solo se generan los slugs canónicos: `arabako` es alias de `alava` y no debe
 * producir una segunda URL con el mismo contenido.
 */
export async function generateStaticParams() {
  return canonicalProvinceSlugs().map((provincia) => ({ provincia }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { provincia } = await params;
  const slug = canonicalProvinceSlug(provincia);
  const name = PROVINCE_SLUGS[slug];

  if (!name) return { title: "Provincia no encontrada", robots: { index: false, follow: false } };

  const directory = await getProvinceDirectory();
  const count = directory.bySlug.get(slug)?.count ?? 0;
  const countLabel = count > 0 ? `${count} próximas · ` : "";

  const title = `Carreras populares en ${name}`;
  const description = `${countLabel}calendario de carreras populares en ${name}: running, trail, media maratón y marchas. Encuentra tu próxima carrera.`;

  return {
    title,
    description,
    alternates: { canonical: `/carreras/${slug}` },
    openGraph: { title, description, url: `/carreras/${slug}` },
  };
}

export default async function ProvincePage({ params }: PageProps) {
  const { provincia } = await params;
  const slug = canonicalProvinceSlug(provincia);
  const name = PROVINCE_SLUGS[slug];

  if (!name) notFound();

  // Los alias (`/carreras/arabako`) redirigen a la URL canónica en vez de
  // servir el mismo contenido en dos direcciones.
  if (provincia !== slug) permanentRedirect(`/carreras/${slug}`);

  // Nombres exactos tal y como están en la BD (p.ej. slug "alava" -> ["Araba"]).
  // Salen del mismo directorio que alimenta el contador del hub.
  const provinceNames = await raceProvinceNames(slug);
  const directory = await getProvinceDirectory();
  const entry = directory.bySlug.get(slug);

  const [races, typeCounts, galleryRaces] = await Promise.all([
    prisma.race.findMany({
      where: upcomingWhere({ province: { in: provinceNames } }),
      orderBy: { date: "asc" },
    }),
    prisma.race.groupBy({
      by: ["type"],
      where: upcomingWhere({ province: { in: provinceNames } }),
      _count: true,
    }),
    prisma.race.findMany({
      where: { province: { in: provinceNames }, pendingReview: false, image: { not: null } },
      orderBy: { date: "desc" },
      take: 6,
      select: { name: true, slug: true, image: true },
    }),
  ]);

  const allProvinceSlugs = canonicalProvinceSlugs();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      {races.length > 0 && (
        <ItemListJsonLd
          name={`Carreras populares en ${name}`}
          items={races.slice(0, 25).map((race) => ({
            name: race.name,
            url: `/carrera/${race.slug}`,
          }))}
        />
      )}

      <Link
        href="/carreras"
        className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Todas las provincias
      </Link>

      <div className="mb-7">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-brand-gradient/10 border border-orange-200/60 dark:border-orange-500/20 flex items-center justify-center">
            <MapPin size={22} className="text-orange-500" />
          </div>
          <div>
            <p className="section-eyebrow mb-0.5">{entry?.communityLabel ?? getAutonomousCommunityLabel("otra")}</p>
            <h1 className="section-title">
              Carreras en {name}
            </h1>
          </div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          {races.length} carrera{races.length !== 1 ? "s" : ""} próxima{races.length !== 1 ? "s" : ""} en {name}
          {races.length > 0 && (
            <>
              {" · "}
              <Link href={`/calendario?provincia=${encodeURIComponent(provinceNames[0] ?? name)}`} className="text-orange-600 hover:text-orange-700">
                ver en el calendario
              </Link>
            </>
          )}
        </p>
      </div>

      {typeCounts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-7">
          {typeCounts
            .sort((a, b) => b._count - a._count)
            .map((t) => (
              <span key={t.type} className="chip">
                {getRaceTypeLabel(t.type)}
                <span className="font-semibold opacity-60">({t._count})</span>
              </span>
            ))}
        </div>
      )}

      {galleryRaces.length > 0 && (
        <div className="mb-8">
          <p className="section-eyebrow mb-3">Imágenes</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {galleryRaces.map((g) => (
              <Link
                key={g.slug}
                href={`/carrera/${g.slug}`}
                className="relative aspect-square rounded-xl overflow-hidden group"
              >
                <Image
                  src={g.image as string}
                  alt={g.name}
                  fill
                  sizes="(max-width: 768px) 33vw, 15vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
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
          <p className="font-semibold text-gray-900 dark:text-white mb-1">No hay carreras próximas en {name}</p>
          <p className="text-gray-500 text-sm mb-5">Prueba a buscar en otras provincias cercanas</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {allProvinceSlugs
              .filter((s) => s !== slug)
              .sort((a, b) => PROVINCE_SLUGS[a].localeCompare(PROVINCE_SLUGS[b], "es"))
              .slice(0, 6)
              .map((k) => (
                <Link
                  key={k}
                  href={`/carreras/${k}`}
                  className="chip"
                >
                  {PROVINCE_SLUGS[k]}
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
