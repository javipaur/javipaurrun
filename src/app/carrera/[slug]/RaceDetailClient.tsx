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
  Check,
  Copy,
} from "lucide-react";
import RaceMap from "@/components/RaceMap";
import RaceResultForm from "@/components/RaceResultForm";

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
  user: { name: string | null };
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/races/${race.id}/results`)
      .then((res) => res.json())
      .then((data) => setResults(data.results || []))
      .catch(() => {});
  }, [race.id]);

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

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `${race.name} - ${formatDate(race.date)} en ${race.location}`;

  function handleShare(platform: string) {
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    };
    if (platform === "copy") {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
      return;
    }
    window.open(urls[platform], "_blank", "noopener,noreferrer");
  }

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

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
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
            <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold ${typeColor}`}>
              {typeLabel[race.type] || race.type}
            </span>
            {race.distance && (
              <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                {race.distance}
              </span>
            )}
            {race.status === "INSCRIPCIONES_ABIERTAS" && (
              <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-green-50 text-green-700">
                Inscripciones abiertas
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 leading-tight">
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
                className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
              >
                <ExternalLink size={16} />
                {isPast ? "Ver resultado" : "Inscribirme"}
              </a>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              <Trophy size={16} />
              {success ? "✅ Tiempo registrado" : "Registrar mi tiempo"}
            </button>
          </div>

          {race.description && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Descripción</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                {race.description}
              </p>
            </div>
          )}

          {mapMarkers.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Ubicación</h2>
              <RaceMap races={mapMarkers} zoom={12} />
            </div>
          )}

          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-1">Compartir</h2>
                <p className="text-xs text-gray-400">
                  {results.length} resultado{results.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShare("whatsapp")}
                  className="w-9 h-9 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors"
                  title="Compartir en WhatsApp"
                >
                  <span className="text-sm font-bold">WA</span>
                </button>
                <button
                  onClick={() => handleShare("twitter")}
                  className="w-9 h-9 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors"
                  title="Compartir en Twitter"
                >
                  <span className="text-sm font-bold">𝕏</span>
                </button>
                <button
                  onClick={() => handleShare("copy")}
                  className="w-9 h-9 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors"
                  title="Copiar enlace"
                >
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>

          {results.length > 0 && (
            <div className="border-t border-gray-100 pt-6 mt-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Resultados ({results.length})
              </h2>
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-xl text-sm"
                  >
                    <span className="text-gray-400 font-mono w-6 text-center">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900 font-mono">
                        {r.time}
                      </span>
                      {r.category && (
                        <span className="text-gray-500 ml-2">· {r.category}</span>
                      )}
                      {r.position && (
                        <span className="text-gray-500 ml-2">· Puesto #{r.position}</span>
                      )}
                    </div>
                    <span className="text-gray-400 text-xs">
                      {r.user.name || "Anónimo"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
