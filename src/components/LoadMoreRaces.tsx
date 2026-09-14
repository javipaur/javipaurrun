"use client";

import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import RaceCard, { type RaceCardRace } from "./RaceCard";
import { useToast } from "./Toast";

interface LoadMoreRacesProps {
  races: RaceCardRace[];
  total: number;
  page: number;
  query: string;
}

export default function LoadMoreRaces({ races: initialRaces, total, page: initialPage, query }: LoadMoreRacesProps) {
  const { toast } = useToast();
  const [races, setRaces] = useState(initialRaces);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);

  const remaining = total - races.length;

  async function loadMore() {
    if (loading) return;
    setLoading(true);
    try {
      const next = page + 1;
      const res = await fetch(`/api/races/calendario?${query}&page=${next}`);
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      setRaces((prev) => [...prev, ...data.races]);
      setPage(next);
    } catch {
      toast("No se pudieron cargar más carreras", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {races.map((race, i) => (
          <RaceCard key={race.id} race={race} index={i} />
        ))}
      </div>

      {remaining > 0 && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="btn-secondary text-sm disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                Cargar más ({remaining} carrera{remaining !== 1 ? "s" : ""})
                <ChevronDown size={15} />
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}