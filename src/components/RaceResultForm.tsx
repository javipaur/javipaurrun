"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { X, Timer } from "lucide-react";

interface RaceResultFormProps {
  raceId: string;
  raceName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RaceResultForm({ raceId, raceName, onClose, onSuccess }: RaceResultFormProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [time, setTime] = useState("");
  const [position, setPosition] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");

  if (!session) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="card-premium rounded-xl p-6 max-w-sm w-full text-center">
          <p className="text-text-primary font-medium mb-3">Inicia sesión para registrar tu tiempo</p>
          <a
            href="/auth/login"
            className="btn-primary"
          >
            Iniciar sesión
          </a>
          <button onClick={onClose} className="block mx-auto mt-3 text-sm text-text-secondary hover:text-text-primary">Cerrar</button>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/races/${raceId}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time,
          position: position || undefined,
          category: category || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Error al guardar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card-premium rounded-xl w-full max-w-md p-6 relative animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary">
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg type-badge type-ASFALTO flex items-center justify-center">
            <Timer size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary">Registrar tiempo</h2>
            <p className="text-sm text-text-secondary line-clamp-1">{raceName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Tiempo *</label>
            <input
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="h:mm:ss o mm:ss (ej: 1:23:45 o 42:30)"
              required
              className="field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Puesto</label>
              <input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                type="number"
                min="1"
                placeholder="Ej: 15"
                className="field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Categoría</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej: Senior"
                className="field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Sensaciones, incidencias..."
              className="field"
            />
          </div>

          {error && (
            <p className="text-sm text-error bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar resultado"}
          </button>
        </form>
      </div>
    </div>
  );
}
