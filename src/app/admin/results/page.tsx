"use client";

import { useEffect, useState } from "react";
import { Timer, MapPin, Trash2 } from "lucide-react";

interface Result {
  id: string;
  time: string;
  position: number | null;
  category: string | null;
  notes: string | null;
  createdAt: string;
  race: {
    id: string;
    name: string;
    date: string;
    location: string;
    type: string;
  };
}

export default function MyResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchResults() {
    setLoading(true);
    try {
      const res = await fetch("/api/me/results");
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchResults();
  }, []);

  if (loading) {
    return <p className="text-gray-500">Cargando resultados...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Mis resultados</h1>
      <p className="text-gray-500 text-sm mb-6">
        {results.length} resultado{results.length !== 1 ? "s" : ""} registrado{results.length !== 1 ? "s" : ""}
      </p>

      {results.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">⏱️</div>
          <p className="text-gray-500 font-medium mb-1">No has registrado ningún resultado</p>
          <p className="text-gray-400 text-sm">
            Busca carreras en el calendario y registra tu tiempo
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{r.race.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Timer size={12} />
                      {r.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {r.race.location}
                    </span>
                    {r.position && <span>Puesto: #{r.position}</span>}
                    {r.category && <span>Categoría: {r.category}</span>}
                    <span className="text-gray-400">
                      {new Date(r.race.date).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                  {r.notes && (
                    <p className="text-xs text-gray-400 mt-1 italic">{r.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
