"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Share2, Trophy } from "lucide-react";
import dynamic from "next/dynamic";
import RaceResultForm from "@/components/RaceResultForm";
import ReviewSection from "@/components/ReviewSection";
import WeatherWidget from "@/components/WeatherWidget";
import ShareButtons from "@/components/ShareButtons";
import { downloadICal } from "@/lib/ical";
import { formatDate } from "@/lib/utils";

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

/**
 * Islas interactivas de la ficha de carrera.
 *
 * El contenido indexable (titulo, fecha, lugar, precio, descripcion y CTA) se
 * renderiza en `page.tsx`, en servidor. Aqui solo queda lo que necesita estado
 * de cliente: registrar tiempo, recordatorio, iCal, clima, mapa, compartir,
 * resultados y resenas.
 */
export default function RaceDetailClient({
  race,
}: {
  race: Race;
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

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-8">
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
    </>
  );
}
