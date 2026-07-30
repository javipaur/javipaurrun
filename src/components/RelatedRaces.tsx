import Link from "next/link";
import { formatDateShort, getRaceTypeLabel } from "@/lib/utils";
import { Calendar, MapPin } from "lucide-react";

interface RaceSummary {
  id: string;
  name: string;
  slug: string;
  type: string;
  distance: string | null;
  location: string;
  province: string;
  date: Date;
  time: string | null;
}

export default function RelatedRaces({ races }: { races: RaceSummary[] }) {
  if (races.length === 0) return null;

  return (
    <div className="border-t border-gray-100 dark:border-gray-700 pt-6 mt-6">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Carreras relacionadas
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {races.map((r) => (
          <Link
            key={r.id}
            href={`/carrera/${r.slug}`}
            className="flex flex-col gap-1.5 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase">
                {getRaceTypeLabel(r.type)}
              </span>
              {r.distance && (
                <span className="text-[10px] text-gray-400">{r.distance}</span>
              )}
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
              {r.name}
            </span>
            <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {formatDateShort(r.date)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {r.location}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
