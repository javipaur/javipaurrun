"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Clock, MapPin, Megaphone, Share2 } from "lucide-react";

const GuideMap = dynamic(() => import("./SpectatorGuideMap"), {
  ssr: false,
  loading: () => <div className="h-[320px] rounded-2xl bg-gray-100 dark:bg-gray-800" />,
});

export type GuidePoint = { id: string; label: string; km: number; tip: string; lat?: number | null; lng?: number | null };

function parsePace(pace: string) {
  const m = pace.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const sec = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  return sec > 0 ? sec : null;
}

function parseDistanceKm(distance?: string | null): number | null {
  if (!distance) return null;
  const m = distance.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const v = parseFloat(m[1]);
  return Number.isFinite(v) && v > 0 ? v : null;
}

function parseStartTime(time?: string | null): string | null {
  if (!time) return null;
  const m = time.match(/(\d{1,2})[:.](\d{2})/);
  if (!m) return null;
  const hh = m[1].padStart(2, "0");
  return `${hh}:${m[2]}`;
}

function fmtElapsed(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function addClock(startHHMM: string | null, sec: number) {
  if (!startHHMM) return null;
  const [hh, mm] = startHHMM.split(":").map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const base = hh * 3600 + mm * 60 + sec;
  const h = Math.floor((base / 3600) % 24);
  const m = Math.floor((base % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function SpectatorGuide({
  raceName,
  distance,
  startTime,
  latitude,
  longitude,
  location,
  points: providedPoints,
}: {
  raceName: string;
  distance?: string | null;
  startTime?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location: string;
  points?: GuidePoint[];
}) {
  const km = parseDistanceKm(distance);
  const parsedStart = parseStartTime(startTime);
  const [pace, setPace] = useState("5:30");
  const [clock, setClock] = useState(parsedStart ?? "");

  const points: GuidePoint[] = useMemo(() => {
    if (providedPoints && providedPoints.length > 0) {
      return [...providedPoints].sort((a, b) => a.km - b.km);
    }
    if (!km) {
      return [
        { id: "start", label: "Salida", km: 0, tip: "Buen sitio para ver el ambiente inicial y la salida." },
        { id: "finish", label: "Meta", km: 0, tip: `Punto de encuentro recomendado en la zona de llegada (${location}).` },
      ];
    }
    const marks = [0, Math.round(km * 0.25 * 10) / 10, Math.round(km * 0.5 * 10) / 10, Math.round(km * 0.75 * 10) / 10, km]
      .filter((v, i, a) => a.indexOf(v) === i)
      .map((v) => Math.min(v, km));
    const tips = [
      "Salida: llega con tiempo para ubicarte y evitar cortes.",
      "Punto intermedio temprano: suele haber menos gente.",
      "Mitad de carrera: buen sitio para dar ánimos y avituallamiento personal si la organización lo permite.",
      "Tramo final: anima fuerte, es donde más se nota.",
      "Meta: acuerda un punto de encuentro concreto para después de la llegada.",
    ];
    const labels = ["Salida", "Punto 25%", "Mitad", "Punto 75%", "Meta"];
    return marks.map((m, i) => ({ id: `p${i}`, label: labels[i] ?? `Km ${m}`, km: m, tip: tips[i] ?? tips[tips.length - 1] }));
  }, [km, location, providedPoints]);

  const paceSec = parsePace(pace);
  const start = clock.match(/^(\d{1,2}):(\d{2})$/) ? clock : null;
  const rows = points.map((p) => {
    const elapsed = paceSec ? paceSec * p.km : null;
    return { ...p, eta: elapsed != null ? addClock(start, elapsed) : null, elapsed: elapsed != null ? fmtElapsed(elapsed) : null };
  });

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `Guía para animar en ${raceName}: puntos y horarios estimados.`;
    try {
      if (navigator.share) await navigator.share({ title: `Animar · ${raceName}`, text, url });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(url); alert("Enlace copiado"); }
    } catch {}
  }

  return (
    <section className="mt-10 rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-orange-950/10 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Guía para acompañantes</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white"><Megaphone size={20} className="text-amber-500" /> Animar en carrera</h2>
            {providedPoints && providedPoints.length > 0 ? (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                Puntos oficiales
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                Puntos sugeridos
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {providedPoints && providedPoints.length > 0
              ? "Puntos del recorrido con horas estimadas de paso según el ritmo. Compártelo con familia y amigos."
              : "Puntos sugeridos para ver al corredor y horas estimadas de paso según el ritmo. Compártelo con familia y amigos."}
          </p>
        </div>
        <button onClick={share} className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white/70 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-white dark:border-amber-800 dark:bg-transparent dark:text-amber-300"><Share2 size={15}/> Compartir</button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div>
          {latitude != null && longitude != null ? (
            <GuideMap latitude={latitude} longitude={longitude} name={raceName} location={location} points={rows} />
          ) : (
            <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-amber-300 bg-white/50 p-6 text-center text-sm text-gray-600 dark:border-amber-800 dark:bg-transparent dark:text-gray-400">
              <div>
                <MapPin className="mx-auto mb-2 text-amber-500" />
                Mapa detallado no disponible todavía. Punto de referencia: <strong>{location}</strong>. Consulta la web oficial para el recorrido y accesos.
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/70 bg-white/80 p-4 dark:border-gray-800 dark:bg-gray-900/70">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">Ritmo (min/km)</span>
              <input value={pace} onChange={(e) => setPace(e.target.value)} placeholder="5:30" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">Hora de salida</span>
              <input value={clock} onChange={(e) => setClock(e.target.value)} placeholder="09:00" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950" />
            </label>
          </div>
          <div className="mt-4 space-y-2.5">
            {rows.map((p) => (
              <div key={p.id} className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{p.label} {km ? <span className="font-normal text-gray-500">· km {p.km}</span> : null}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-gray-900 dark:text-amber-300"><Clock size={12} /> {p.eta ?? "--:--"}</span>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{p.tip}</p>
                {p.elapsed && <p className="mt-1 text-xs text-gray-500">Tiempo de carrera estimado: {p.elapsed}</p>}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">Estimación a ritmo constante. Verifica recorrido, cortes y accesos en la información oficial del organizador.</p>
        </div>
      </div>
    </section>
  );
}
