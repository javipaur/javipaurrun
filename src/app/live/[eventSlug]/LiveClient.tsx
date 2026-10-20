"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Timer, ChevronRight, Radio } from "lucide-react";

const LiveMap = dynamic(
  () => import("./LiveMap"),
  { ssr: false, loading: () => (
    <div className="w-full h-[420px] rounded-xl border border-gray-200 bg-gray-100 dark:bg-gray-800 animate-pulse" />
  ) }
);

export interface LiveRunner {
  id: string;
  bib: number;
  name: string;
  category: string | null;
  status: string;
  startTime: string | null;
  finishTime: string | null;
  position: {
    lat: number;
    lng: number;
    km: number | null;
    speed: number | null;
    heading: number | null;
    createdAt: string;
    etaSecondsToFinish: number | null;
  } | null;
  passedCheckpointIds: string[];
  passCount: number;
}

export interface LiveCheckpoint {
  id: string;
  order: number;
  name: string;
  km: number;
  lat: number | null;
  lng: number | null;
}

export interface LiveEventInfo {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  date: string;
  liveOpen: boolean;
  totalDistance: number;
  organization: { id: string; name: string };
}

export interface LiveSnapshot {
  event: LiveEventInfo;
  checkpoints: LiveCheckpoint[];
  stats: { totalRunners: number; onCourse: number };
  runners: LiveRunner[];
}

interface LiveClientProps {
  snapshot: LiveSnapshot;
  eventSlug: string;
}

function sortRunners(a: LiveRunner, b: LiveRunner): number {
  if (a.status === "FINALIZADO" && b.status !== "FINALIZADO") return -1;
  if (a.status !== "FINALIZADO" && b.status === "FINALIZADO") return 1;
  const kmA = a.position?.km ?? -1;
  const kmB = b.position?.km ?? -1;
  return kmB - kmA;
}

interface WSMessage {
  type: string;
  data?: Record<string, unknown>;
  runnerId?: string;
  bib?: number;
}

export default function LiveClient({ snapshot, eventSlug }: LiveClientProps) {
  const [runners, setRunners] = useState<LiveRunner[]>(snapshot.runners);
  const [connected, setConnected] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("live-favs") || "[]"));
    } catch {
      return new Set();
    }
  });
  const [categoryFilter, setCategoryFilter] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    localStorage.setItem("live-favs", JSON.stringify([...favorites]));
  }, [favorites]);

  useEffect(() => {
    const gatewayBase = process.env.NEXT_PUBLIC_LIVE_URL || "";
    if (!gatewayBase) return;

    const wsUrl = `${gatewayBase.replace(/^http/, "ws")}/ws/${eventSlug}`;
    const sseUrl = `${gatewayBase}/events/${eventSlug}`;

    let disposed = false;

    function apply(msg: WSMessage) {
      if (msg.type === "position" && msg.data?.runnerId && msg.data?.lat != null) {
        const rid = msg.data.runnerId as string;
        setRunners((prev) =>
          prev.map((r) => {
            if (r.id !== rid) return r;
            return {
              ...r,
              status: r.status === "REGISTRADO" ? "EN_CURSO" : r.status,
              position: {
                lat: msg.data!.lat as number,
                lng: msg.data!.lng as number,
                km: (msg.data!.km as number | null) ?? r.position?.km ?? null,
                speed: (msg.data!.speed as number | null) ?? r.position?.speed ?? null,
                heading: (msg.data!.heading as number | null) ?? null,
                createdAt: (msg.data!.createdAt as string) || new Date().toISOString(),
                etaSecondsToFinish: (msg.data!.etaSecondsToFinish as number | null) ?? null,
              },
            };
          })
        );
      } else if (msg.type === "checkpoint" && msg.data?.runnerId && msg.data?.checkpointId) {
        const rid = msg.data.runnerId as string;
        const cpId = msg.data.checkpointId as string;
        setRunners((prev) =>
          prev.map((r) => {
            if (r.id !== rid) return r;
            const has = r.passedCheckpointIds.includes(cpId);
            return has
              ? r
              : { ...r, passedCheckpointIds: [...r.passedCheckpointIds, cpId], passCount: r.passCount + 1 };
          })
        );
      } else if (msg.type === "status" && msg.data?.runnerId && msg.data?.status) {
        const rid = msg.data.runnerId as string;
        const status = msg.data.status as string;
        setRunners((prev) =>
          prev.map((r) => (r.id === rid ? { ...r, status } : r))
        );
      }
    }

    function tryWs(url: string) {
      const ws = new WebSocket(url);
      ws.onopen = () => {
        if (!disposed) setConnected(true);
      };
      ws.onmessage = (ev) => {
        try {
          apply(JSON.parse(ev.data as string) as WSMessage);
        } catch {}
      };
      ws.onclose = () => {
        if (!disposed) {
          setConnected(false);
          sseRef.current = new EventSource(sseUrl);
          sseRef.current.onopen = () => setConnected(true);
          sseRef.current.onmessage = (ev) => {
            try {
              apply(JSON.parse(ev.data as string) as WSMessage);
            } catch {}
          };
        }
      };
      wsRef.current = ws;
    }

    tryWs(wsUrl);

    return () => {
      disposed = true;
      wsRef.current?.close();
      sseRef.current?.close();
    };
  }, [eventSlug]);

  const categories = useMemo(
    () =>
      Array.from(new Set(snapshot.runners.map((r) => r.category).filter((c): c is string => !!c))).sort(),
    [snapshot.runners]
  );

  const filtered = useMemo(() => {
    let list = [...runners];
    if (categoryFilter) list = list.filter((r) => r.category === categoryFilter);
    if (favoritesOnly) list = list.filter((r) => favorites.has(r.id));
    return list.sort(sortRunners);
  }, [runners, categoryFilter, favoritesOnly, favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onCourse = runners.filter((r) => r.status === "EN_CURSO").length;
  const finished = runners.filter((r) => r.status === "FINALIZADO").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LiveMap
            runners={runners}
            checkpoints={snapshot.checkpoints}
            totalDistance={snapshot.event.totalDistance}
          />
        </div>

        <div className="space-y-4">
          <div className="card-premium rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Radio size={16} className={connected ? "text-emerald-500" : "text-gray-400"} />
              <span className="text-sm font-semibold">
                {connected ? "En vivo" : "Conectando…"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-2">
                <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
                  {snapshot.stats.totalRunners}
                </p>
                <p className="text-[11px] text-gray-500">Dorsales</p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-2">
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {onCourse}
                </p>
                <p className="text-[11px] text-gray-500">En ruta</p>
              </div>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-2">
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                  {finished}
                </p>
                <p className="text-[11px] text-gray-500">Llegados</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(categoryFilter === c ? "" : c)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    categoryFilter === c
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {c}
                </button>
              ))}
              {favorites.size > 0 && (
                <button
                  onClick={() => setFavoritesOnly(!favoritesOnly)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    favoritesOnly
                      ? "bg-purple-500 text-white"
                      : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  ★ Favoritos
                </button>
              )}
            </div>
          </div>

          <div className="card-premium rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
              <h2 className="font-semibold text-sm">Clasificación en directo</h2>
              <MapPin size={16} className="text-orange-500" />
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  Aún no hay corredores en ruta.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white dark:bg-gray-900 text-left text-[11px] uppercase tracking-wide text-gray-400">
                    <tr>
                      <th className="px-3 py-2">Pos</th>
                      <th className="px-3 py-2">Dorsal</th>
                      <th className="px-3 py-2">Nombre</th>
                      <th className="px-3 py-2 text-right">KM</th>
                      <th className="px-3 py-2 text-right">Ritmo</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, idx) => {
                      const speed = r.position?.speed ?? null;
                      const pace = speed && speed > 0
                        ? (() => {
                            const sPerKm = 3600 / speed;
                            return `${Math.floor(sPerKm / 60)}:${String(Math.round(sPerKm % 60)).padStart(2, "0")}`;
                          })()
                        : null;
                      const isFinal = r.status === "FINALIZADO";
                      const speedKm = r.position?.km ?? 0;
                      return (
                        <tr
                          key={r.id}
                          className={`border-t border-gray-50 dark:border-white/5 ${isFinal ? "opacity-60" : ""}`}
                        >
                          <td className="px-3 py-2 font-semibold text-gray-400 tabular-nums">
                            {isFinal ? "🏁" : idx + 1}
                          </td>
                          <td className="px-3 py-2 font-bold tabular-nums">{r.bib}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                                style={{
                                  background: isFinal
                                    ? "#3b82f6"
                                    : r.status === "EN_CURSO"
                                    ? "#22c55e"
                                    : "#9ca3af",
                                }}
                              />
                              <span className="truncate max-w-[130px]">{r.name}</span>
                              <button
                                onClick={() => toggleFavorite(r.id)}
                                aria-label="Favorito"
                                className={`shrink-0 text-xs ${favorites.has(r.id) ? "text-purple-500" : "text-gray-300 dark:text-gray-600"} hover:text-purple-500`}
                              >
                                {favorites.has(r.id) ? "★" : "☆"}
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {r.status === "FINALIZADO" ? "✓" : speedKm > 0 ? speedKm : "—"}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-gray-500">
                            {r.status === "FINALIZADO" ? "—" : (pace ?? "—")}
                          </td>
                          <td className="px-2 py-2">
                            <ChevronRight
                              size={14}
                              className={`text-gray-200 dark:text-gray-700 ${favorites.has(r.id) ? "text-purple-400" : ""}`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {snapshot.checkpoints.length > 0 && (
        <div className="card-premium rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Timer size={16} className="text-orange-500" />
            <h2 className="font-semibold text-sm">Progreso por checkpoint</h2>
            <span className="text-xs text-gray-400">
              {snapshot.event.totalDistance > 0 ? ` · ${snapshot.event.totalDistance} m totales` : ""}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {snapshot.checkpoints.map((cp) => {
              const pct = snapshot.event.totalDistance > 0
                ? Math.min(100, Math.round((cp.km / snapshot.event.totalDistance) * 100))
                : 0;
              return (
                <div key={cp.id} className="rounded-xl border border-gray-100 dark:border-white/10 px-3 py-2">
                  <p className="text-xs font-semibold">{cp.name}</p>
                  <p className="text-[11px] text-gray-400">
                    km {cp.km}{cp.lat != null ? ` · ${pct}%` : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}