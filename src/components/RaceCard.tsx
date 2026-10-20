"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Timer, Tag, Clock, BarChart3, Share2, ArrowUpRight } from "lucide-react";
import { formatDateShort, getRaceTypeLabel, daysUntilLabel, getRaceBadgeClass, getRaceDotClass, getRaceGradient } from "@/lib/utils";
import RaceResultForm from "./RaceResultForm";

export interface RaceCardRace {
  id: string;
  name: string;
  slug: string;
  type: string;
  distance?: string | null;
  location: string;
  province: string;
  date: Date | string;
  time?: string | null;
  description?: string | null;
  url?: string | null;
  price?: string | null;
  image?: string | null;
}

interface RaceCardProps {
  race: RaceCardRace;
  index?: number;
}

const UNKNOWN_LOCATIONS = new Set(["", "por determinar", "desconocido", "-"]);

/**
 * "Otra" es el valor centinela del scraper cuando no deduce la provincia.
 * No es una provincia ni un topónimo: mostrarlo como si lo fuera confunde.
 */
const UNKNOWN_PROVINCES = new Set(["", "otra", "otra provincia", "desconocido", "-"]);

function isUnknown(value: string | null | undefined): boolean {
  return UNKNOWN_LOCATIONS.has((value || "").trim().toLowerCase());
}

export default function RaceCard({ race, index = 0 }: RaceCardProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imageError, setImageError] = useState(false);

  const showImage = Boolean(race.image) && !imageError;

  // Si el scraper no devolvió ciudad, mostramos la provincia en su lugar.
  // Y si tampoco se conoce la provincia, decimos que está por confirmar en vez
  // de imprimir "Otra" como si fuera un lugar.
  const provinceKnown = !UNKNOWN_PROVINCES.has((race.province || "").trim().toLowerCase());
  const isUnknownLocation = isUnknown(race.location);
  const locationLabel = isUnknownLocation
    ? provinceKnown
      ? race.province
      : "Ubicación por confirmar"
    : race.location;

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = window.location.origin + "/carrera/" + race.slug;
    const text = `${race.name} - ${formatDateShort(race.date)} en ${locationLabel}`;
    if (navigator.share) {
      navigator.share({ title: race.name, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
    }
  }

  function handleCompare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const params = new URLSearchParams(window.location.search);
    const existing = params.get("ids") || "";
    const ids = existing ? existing.split(",") : [];
    if (!ids.includes(race.id)) {
      ids.push(race.id);
    }
    if (ids.length >= 2) {
      router.push(`/comparar?ids=${ids.slice(0, 3).join(",")}`);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.set("ids", ids.join(","));
      window.history.replaceState({}, "", url.toString());
    }
  }

  return (
    <>
      <article
        className="card-premium group relative flex flex-col overflow-hidden animate-fade-in-up h-full"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        {/* Enlace "stretched": cubre toda la tarjeta sin anidar <a> dentro de <a>. */}
        <Link
          href={`/carrera/${race.slug}`}
          className="absolute inset-0 z-0"
          aria-label={`Ver detalles de ${race.name}`}
        >
          <span className="sr-only">{race.name}</span>
        </Link>

        {showImage && (
          <div className="relative aspect-[16/9] bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
            <Image
              src={race.image as string}
              alt={race.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/10" />
            <span className={`absolute bottom-3 left-3 ${getRaceBadgeClass(race.type)}`}>
              <span className={getRaceDotClass(race.type)} />
              {getRaceTypeLabel(race.type)}
            </span>
            {race.url && (
              <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 dark:bg-black/60 backdrop-blur text-emerald-600 dark:text-emerald-400 shadow-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                Inscripciones abiertas
              </span>
            )}
          </div>
        )}

        {!showImage && (
          <div
            className={`h-20 bg-gradient-to-br ${getRaceGradient(race.type)} opacity-90 flex items-center justify-center px-4 shrink-0`}
          >
            <span className="text-white/80 text-sm font-semibold tracking-wide truncate">
              {race.name}
            </span>
          </div>
        )}

        <div className={`flex flex-1 flex-col ${showImage ? "p-5" : "px-5 pt-4 pb-5"}`}>
          {!showImage && (
            <div className="flex items-center justify-between mb-3.5">
              <span className={getRaceBadgeClass(race.type)}>
                <span className={getRaceDotClass(race.type)} />
                {getRaceTypeLabel(race.type)}
              </span>
              {race.distance && (
                <span className="text-xs font-semibold text-text-tertiary">{race.distance}</span>
              )}
            </div>
          )}

          <h3 className="font-bold text-text-primary text-[15px] leading-snug mb-4 line-clamp-2 group-hover:text-primary-light transition-colors">
            {race.name}
          </h3>

          <div className="space-y-2 mb-5">
            <div className="flex items-center gap-2 text-xs text-text-secondary flex-wrap">
              <Calendar size={13} className="shrink-0 text-text-tertiary" />
              <span className="font-medium">{formatDateShort(race.date)}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-50 text-primary text-[11px] font-semibold">
                {daysUntilLabel(race.date)}
              </span>
              {race.time && (
                <>
                  <span className="text-text-tertiary">·</span>
                  <Timer size={13} className="shrink-0 text-text-tertiary" />
                  <span>{race.time}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <MapPin size={13} className="shrink-0 text-text-tertiary" />
              <span className="truncate">{locationLabel}</span>
            </div>
            {race.price && (
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <Tag size={13} className="shrink-0 text-text-tertiary" />
                <span>{race.price}</span>
              </div>
            )}
          </div>

          {/* mt-auto empuja el pie al fondo: todas las tarjetas alinean sus acciones. */}
          <div className="flex items-center justify-between gap-2 pt-3.5 border-t hairline mt-auto relative z-10">
            <span className="text-xs font-medium text-text-tertiary truncate">
              {provinceKnown ? race.province : "Sin provincia"}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCompare}
                title="Comparar"
                aria-label={`Comparar ${race.name}`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-primary hover:bg-primary-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
              >
                <BarChart3 size={13} />
                <span className="hidden md:inline">Comparar</span>
              </button>
              <button
                onClick={handleShare}
                title="Compartir"
                aria-label={`Compartir ${race.name}`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-primary hover:bg-primary-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
              >
                <Share2 size={13} />
                <span className="hidden md:inline">Compartir</span>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowForm(true);
                }}
                title={success ? "Tiempo registrado" : "Registrar tiempo"}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-primary hover:bg-primary-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
              >
                <Clock size={13} />
                <span className="hidden md:inline">{success ? "Registrado ✓" : "Tiempo"}</span>
              </button>
              {race.url && (
                <a
                  href={race.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-brand-gradient shadow-sm hover:brightness-105 transition-all"
                >
                  <span className="hidden md:inline">Inscríbete</span>
                  <ArrowUpRight size={13} />
                </a>
              )}
            </div>
          </div>
        </div>
      </article>

      {showForm && (
        <RaceResultForm
          raceId={race.id}
          raceName={race.name}
          onClose={() => setShowForm(false)}
          onSuccess={() => setSuccess(true)}
        />
      )}
    </>
  );
}