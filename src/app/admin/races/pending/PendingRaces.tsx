"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Loader2, Inbox, ExternalLink } from "lucide-react";
import { getRaceTypeLabel, formatDateShort } from "@/lib/utils";
import { useToast } from "@/components/Toast";

export interface PendingRace {
  id: string;
  name: string;
  type: string;
  distance: string | null;
  location: string;
  city: string | null;
  province: string;
  date: string;
  time: string | null;
  description: string | null;
  url: string | null;
  registrationUrl: string | null;
  price: string | null;
}

interface PendingRacesProps {
  races: PendingRace[];
}

export default function PendingRaces({ races: initialRaces }: PendingRacesProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [races, setRaces] = useState(initialRaces);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function review(id: string, action: "approve" | "reject") {
    if (busyId) return;
    setBusyId(id);

    try {
      const res = await fetch("/api/admin/races/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo completar la acción");
      }

      setRaces((prev) => prev.filter((r) => r.id !== id));
      toast(
        action === "approve" ? "Carrera aprobada y publicada" : "Propuesta rechazada",
        "success"
      );
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Error inesperado", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (races.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-gray-300 rounded-xl">
        <Inbox size={32} className="mx-auto text-gray-400 mb-3" />
        <p className="font-semibold text-gray-700 mb-1">No hay propuestas pendientes</p>
        <p className="text-sm text-gray-500">
          Las nuevas propuestas de <Link href="/enviar-carrera" className="text-orange-500 hover:underline">Añadir carrera</Link> aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {races.length} propuesta{races.length !== 1 ? "s" : ""} esperando revisión.
        Al aprobar se publica en el calendario; al rechazar se elimina.
      </p>

      {races.map((race) => (
        <div
          key={race.id}
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-orange-200 transition-colors"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900">{race.name}</h3>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                  {getRaceTypeLabel(race.type)}
                </span>
              </div>

              <p className="text-sm text-gray-600 mt-1">
                {[race.location, race.province].filter(Boolean).join(", ")}
                {race.distance ? ` · ${race.distance}` : ""}
                {" · "}
                {formatDateShort(race.date)}
                {race.time ? ` ${race.time}` : ""}
                {race.price ? ` · ${race.price}` : ""}
              </p>

              {race.description && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-3">{race.description}</p>
              )}

              {(race.url || race.registrationUrl) && (
                <div className="flex flex-wrap gap-3 mt-2">
                  {race.url && (
                    <a
                      href={race.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-orange-500 hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink size={11} /> Web oficial
                    </a>
                  )}
                  {race.registrationUrl && (
                    <a
                      href={race.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-orange-500 hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink size={11} /> Inscripciones
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => review(race.id, "approve")}
                disabled={busyId !== null}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {busyId === race.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                Aprobar
              </button>
              <button
                onClick={() => review(race.id, "reject")}
                disabled={busyId !== null}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <X size={14} />
                Rechazar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}