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
    <div className="border-t hairline pt-7 mt-8">
      <p className="section-eyebrow mb-3.5">También te puede interesar</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {races.map((r) => (
          <Link
            key={r.id}
            href={`/carrera/${r.slug}`}
            className="card-premium group flex flex-col gap-1.5 px-4 py-3.5"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                {getRaceTypeLabel(r.type)}
              </span>
              {r.distance && (
                <span className="text-[10px] text-gray-400">{r.distance}</span>
              )}
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
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
