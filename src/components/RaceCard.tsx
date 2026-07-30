"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Timer, ArrowUpRight, Tag, Clock, BarChart3 } from "lucide-react";
import { formatDateShort, getRaceTypeLabel } from "@/lib/utils";
import RaceResultForm from "./RaceResultForm";

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

export default function RaceCard({ race, index = 0 }: RaceCardProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const config = typeConfig[race.type] || typeConfig.ASFALTO;

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
        className="group block bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 animate-fade-in-up"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${config.bg} ${config.text}`}>
            {getRaceTypeLabel(race.type)}
          </span>
          {race.distance && (
            <span className="text-xs text-gray-400 font-medium">{race.distance}</span>
          )}
        </div>

        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-3 line-clamp-2 group-hover:text-orange-600 transition-colors">
          {race.name}
        </h3>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar size={13} className="shrink-0 text-gray-400" />
            <span>{formatDateShort(race.date)}</span>
            {race.time && (
              <>
                <span className="text-gray-300">·</span>
                <Timer size={13} className="shrink-0 text-gray-400" />
                <span>{race.time}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin size={13} className="shrink-0 text-gray-400" />
            <span className="truncate">{race.location}</span>
          </div>
          {race.price && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Tag size={13} className="shrink-0 text-gray-400" />
              <span>{race.price}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-400">{race.province}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCompare}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-orange-600 cursor-pointer transition-colors"
            >
              <BarChart3 size={12} />
              Comparar
            </button>
            <span
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowForm(true);
              }}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-orange-600 cursor-pointer transition-colors"
            >
              <Clock size={12} />
              {success ? "✅ Registrado" : "Registrar tiempo"}
            </span>
            {race.url && (
              <a
                href={race.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors"
              >
                Inscríbete
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
