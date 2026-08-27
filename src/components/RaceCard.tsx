"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Timer, ArrowUpRight, Tag, Clock, BarChart3, Share2 } from "lucide-react";
import { formatDateShort, getRaceTypeLabel } from "@/lib/utils";
import RaceResultForm from "./RaceResultForm";
import ShareButtons from "./ShareButtons";

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
  };
  index?: number;
}

const typeConfig: Record<string, { bg: string; text: string }> = {
  ASFALTO: { bg: "bg-orange-50", text: "text-orange-700" },
  MEDIA_MARATON: { bg: "bg-purple-50", text: "text-purple-700" },
  MARATON: { bg: "bg-red-50", text: "text-red-700" },
  TRAIL: { bg: "bg-emerald-50", text: "text-emerald-700" },
  MARCHA: { bg: "bg-amber-50", text: "text-amber-700" },
  ORIENTACION: { bg: "bg-blue-50", text: "text-blue-700" },
};

const typeDot: Record<string, string> = {
  ASFALTO: "bg-orange-500",
  MEDIA_MARATON: "bg-purple-500",
  MARATON: "bg-red-500",
  TRAIL: "bg-emerald-500",
  MARCHA: "bg-amber-500",
  ORIENTACION: "bg-blue-500",
};

export default function RaceCard({ race, index = 0 }: RaceCardProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const config = typeConfig[race.type] || typeConfig.ASFALTO;

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
        className="card-premium group block p-5 animate-fade-in-up"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="flex items-center justify-between mb-3.5">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${typeDot[race.type] || "bg-gray-400"}`} />
            {getRaceTypeLabel(race.type)}
          </span>
          {race.distance && (
            <span className="text-xs font-semibold text-gray-400">{race.distance}</span>
          )}
        </div>

        <h3 className="font-bold text-gray-900 dark:text-white text-[15px] leading-snug mb-4 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
          {race.name}
        </h3>

        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Calendar size={13} className="shrink-0 text-gray-400" />
            <span className="font-medium">{formatDateShort(race.date)}</span>
            {race.time && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <Timer size={13} className="shrink-0 text-gray-400" />
                <span>{race.time}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <MapPin size={13} className="shrink-0 text-gray-400" />
            <span className="truncate">{race.location}</span>
          </div>
          {race.price && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Tag size={13} className="shrink-0 text-gray-400" />
              <span>{race.price}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3.5 border-t hairline">
          <span className="text-xs font-medium text-gray-400">{race.province}</span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <button
              onClick={handleCompare}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer transition-colors"
            >
              <BarChart3 size={12} />
              <span className="hidden sm:inline">Comparar</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer transition-colors"
            >
              <Share2 size={12} />
            </button>
            <span
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowForm(true);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer transition-colors"
            >
              <Clock size={12} />
              {success ? "✅" : "Registrar tiempo"}
            </span>
            {race.url && (
              <a
                href={race.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
              >
                <span className="hidden sm:inline">Inscríbete</span>
                <ArrowUpRight size={12} />
              </a>
            )}
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
