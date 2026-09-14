"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Timer, ArrowUpRight, Tag, Clock, BarChart3, Share2 } from "lucide-react";
import { formatDateShort, getRaceTypeLabel, daysUntilLabel } from "@/lib/utils";
import RaceResultForm from "./RaceResultForm";

const TYPE_GRADIENTS: Record<string, string> = {
  TRAIL: "from-emerald-600 via-emerald-500/50 to-teal-600",
  MARATON: "from-violet-600 via-violet-500/50 to-indigo-600",
  MEDIA_MARATON: "from-blue-600 via-blue-500/50 to-cyan-600",
  ASFALTO: "from-slate-600 via-slate-500/50 to-zinc-600",
  MARCHA: "from-amber-600 via-amber-500/50 to-orange-600",
  ORIENTACION: "from-pink-600 via-pink-500/50 to-rose-600",
};
function getFallbackGradient(type: string): string {
  return TYPE_GRADIENTS[type] || "from-gray-600 via-gray-500/50 to-gray-700";
}

interface RaceCardProps {
  race: {
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
  };
  index?: number;
}

function badgeClass(type: string): string {
  return `type-badge type-${type}`;
}

function dotClass(type: string): string {
  return `type-dot dot-${type}`;
}

const knownTypes = ["ASFALTO", "MEDIA_MARATON", "MARATON", "TRAIL", "MARCHA", "ORIENTACION"];

function badgeClassSafe(type: string): string {
  return knownTypes.includes(type) ? badgeClass(type) : "type-badge type-ASFALTO";
}

function dotClassSafe(type: string): string {
  return knownTypes.includes(type) ? dotClass(type) : "type-dot dot-ASFALTO";
}

export default function RaceCard({ race, index = 0 }: RaceCardProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = window.location.origin + "/carrera/" + race.slug;
    const text = `${race.name} - ${formatDateShort(race.date)} en ${race.location}`;
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
      <Link
        href={`/carrera/${race.slug}`}
        className="card-premium group block overflow-hidden animate-fade-in-up"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        {race.image && (
          <div className="relative aspect-[16/9] bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <Image
              src={race.image}
              alt={race.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/10" />
            <span className={`absolute bottom-3 left-3 ${badgeClassSafe(race.type)}`}>
              <span className={dotClassSafe(race.type)} />
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

        {!race.image && (
          <div className={`aspect-[21/6] bg-gradient-to-br ${getFallbackGradient(race.type)} opacity-90 flex items-center justify-center px-4`}>
            <span className="text-white/80 text-sm font-semibold tracking-wide truncate">{race.name}</span>
          </div>
        )}

        <div className={race.image ? "p-5" : "px-5 pt-3 pb-5"}>
        {!race.image && (
        <div className="flex items-center justify-between mb-3.5">
          <span className={`${badgeClassSafe(race.type)}`}>
            <span className={dotClassSafe(race.type)} />
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
          <div className="flex items-center gap-2 text-xs text-text-secondary">
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
            <span className="truncate">{race.location}</span>
          </div>
          {race.price && (
<div className="flex items-center gap-2 text-xs text-text-secondary flex-wrap">
              <Tag size={13} className="shrink-0 text-text-tertiary" />
              <span>{race.price}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-3.5 border-t hairline">
          <span className="text-xs font-medium text-text-tertiary">{race.province}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCompare}
              title="Comparar"
              aria-label="Comparar"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-primary hover:bg-primary-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
            >
              <BarChart3 size={13} />
              <span className="hidden md:inline">Comparar</span>
            </button>
            <button
              onClick={handleShare}
              title="Compartir"
              aria-label="Compartir"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-primary hover:bg-primary-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
            >
              <Share2 size={13} />
              <span className="hidden md:inline">Compartir</span>
            </button>
            <span
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
            </span>
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
      </Link>

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
