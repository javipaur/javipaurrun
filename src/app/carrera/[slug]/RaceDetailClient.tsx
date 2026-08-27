"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Timer,
  Tag,
  ExternalLink,
  Clock,
  Share2,
  Trophy,
} from "lucide-react";
import dynamic from "next/dynamic";
import RaceResultForm from "@/components/RaceResultForm";
import ReviewSection from "@/components/ReviewSection";
import WeatherWidget from "@/components/WeatherWidget";
import ShareButtons from "@/components/ShareButtons";
import { downloadICal } from "@/lib/ical";

const RaceMap = dynamic(
  () => import("@/components/RaceMap"),
  { ssr: false, loading: () => null }
);

interface Race {
  id: string;
  name: string;
  slug: string;
  type: string;
  distance: string | null;
  location: string;
  province: string;
  date: Date | string;
  endDate: Date | string | null;
  time: string | null;
  description: string | null;
  url: string | null;
  image: string | null;
  price: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  source: string | null;
}

interface Result {
  id: string;
  time: string;
  position: number | null;
  category: string | null;
  notes: string | null;
  createdAt: string;
  user: { id: string; name: string | null };
}

export default function RaceDetailClient({
  race,
  typeColor,
  typeLabel,
  formatDate,
}: {
  race: Race;
  typeColor: string;
  typeLabel: Record<string, string>;
  formatDate: (d: Date | string) => string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [reminder, setReminder] = useState<"none" | "loading" | "active" | "error">("none");

  useEffect(() => {
    fetch(`/api/races/${race.id}/results`)
      .then((res) => res.json())
      .then((data) => setResults(data.results || []))
      .catch(() => {});
  }, [race.id]);

  useEffect(() => {
    fetch(`/api/races/${race.id}/remind`)
      .then((r) => r.json())
      .then((d) => { if (d.reminder) setReminder("active"); })
      .catch(() => {});
  }, [race.id]);

  async function handleRemind() {
    setReminder("loading");
    try {
      const res = await fetch(`/api/races/${race.id}/remind`, { method: "POST" });
      if (res.ok) setReminder("active");
      else setReminder("none");
    } catch { setReminder("error"); }
  }

  const mapMarkers = race.latitude && race.longitude
    ? [{
        id: race.id,
        name: race.name,
        lat: race.latitude,
        lng: race.longitude,
        date: new Date(race.date).toISOString(),
        type: race.type,
        location: race.location,
        province: race.province,
        url: race.url,
        distance: race.distance,
      }]
    : [];

  const dateObj = new Date(race.date);
  const isPast = dateObj < new Date();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      <Link
        href="/calendario"
        className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Volver al calendario
      </Link>

      <div className="card-premium overflow-hidden">
        {race.image && (
          <div className="aspect-[2/1] sm:aspect-[3/1] bg-gray-100 relative overflow-hidden">
            <img
              src={race.image}
              alt={race.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${typeColor}`}>
              {typeLabel[race.type] || race.type}
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
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white mb-7 leading-tight tracking-tight">
            {race.name}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar size={16} className="shrink-0 text-gray-400" />
                <span>{formatDate(race.date)}</span>
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

          <div className="flex flex-wrap gap-3 mb-8">
            {race.url && (
              <a
                href={race.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <ExternalLink size={16} />
                {isPast ? "Ver resultado" : "Inscribirme"}
              </a>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="btn-secondary"
            >
              <Trophy size={16} />
              {success ? "✅ Tiempo registrado" : "Registrar mi tiempo"}
            </button>
            <button
              onClick={() =>
                downloadICal({
                  name: race.name,
                  description: race.description,
                  location: `${race.location}, ${race.province}`,
                  startDate: new Date(race.date),
                  endDate: race.endDate ? new Date(race.endDate) : undefined,
                  url: race.url,
                })
              }
              className="btn-secondary"
            >
              <Calendar size={16} />
              Añadir a calendario
            </button>
            <button
              onClick={handleRemind}
              disabled={reminder === "loading" || reminder === "active"}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reminder === "active" ? "✅ Recordatorio activo" : reminder === "loading" ? "..." : "🔔 Recordar"}
            </button>
          </div>

          {race.description && (
            <div className="mb-8">
              <p className="section-eyebrow mb-2">Descripción</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                {race.description}
              </p>
            </div>
          )}

          {race.latitude && race.longitude && (
            <div className="mb-6">
              <WeatherWidget
                latitude={race.latitude}
                longitude={race.longitude}
                date={race.date instanceof Date ? race.date.toISOString() : race.date}
                raceLocation={`${race.location}, ${race.province}`}
              />
            </div>
          )}

          {mapMarkers.length > 0 && (
            <div className="mb-8">
              <p className="section-eyebrow mb-3">Ubicación</p>
              <RaceMap races={mapMarkers} zoom={12} />
            </div>
          )}

          <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-1.5">
                  <Share2 size={14} />
                  Compartir
                </h2>
                <p className="text-xs text-gray-400">
                  {results.length} resultado{results.length !== 1 ? "s" : ""}
                </p>
              </div>
              <ShareButtons
                url={typeof window !== "undefined" ? window.location.href : ""}
                title={race.name}
                description={`${formatDate(race.date)} en ${race.location}`}
              />
            </div>
          </div>

          {results.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-6 mt-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Resultados ({results.length})
              </h2>
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm"
                  >
                    <span className="text-gray-400 font-mono w-6 text-center">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 font-mono">
                        {r.time}
                      </span>
                      {r.category && (
                        <span className="text-gray-500 ml-2">· {r.category}</span>
                      )}
                      {r.position && (
                        <span className="text-gray-500 ml-2">· Puesto #{r.position}</span>
                      )}
                    </div>
                    <Link
                      href={`/atleta/${r.user.id}`}
                      className="text-gray-400 text-xs hover:text-orange-500 transition-colors"
                    >
                      {r.user.name || "Anónimo"}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ReviewSection raceId={race.id} />
        </div>
      </div>

      {showForm && (
        <RaceResultForm
          raceId={race.id}
          raceName={race.name}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setSuccess(true);
            fetch(`/api/races/${race.id}/results`)
              .then((res) => res.json())
              .then((data) => setResults(data.results || []));
          }}
        />
      )}
    </div>
  );
}
