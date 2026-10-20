"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bell, BellRing, Loader2, Check, X } from "lucide-react";

const EMAIL_KEY = "jp-alert-email";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "active"; email: string }
  | { status: "busy" }
  | { status: "done"; message: string }
  | { status: "error"; message: string };

export default function AlertSignup({ compact = false }: { compact?: boolean }) {
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>({ status: "idle" });
  const [email, setEmail] = useState("");
  const [unsubcribing, setUnsubcribing] = useState(false);

  const provincia = searchParams.get("provincia");
  const comunidad = searchParams.get("comunidad");
  const tipo = searchParams.get("tipo");
  const distancia = searchParams.get("distancia");

  const hasFilters = Boolean(provincia || comunidad || tipo || distancia);

  const rangeBounds =
    distancia === "corto"
      ? { minKm: 0, maxKm: 5 }
      : distancia === "medio"
      ? { minKm: 5, maxKm: 15 }
      : distancia === "largo"
      ? { minKm: 15, maxKm: 42 }
      : distancia === "ultra"
      ? { minKm: 42, maxKm: null }
      : {};

  async function restoreAlert(value: string) {
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/alerts?email=${encodeURIComponent(value)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setState(data.active ? { status: "active", email: value } : { status: "idle" });
    } catch {
      setState({ status: "idle" });
    }
  }

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState({ status: "busy" });

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          provincia: provincia || null,
          comunidad: comunidad || null,
          tipo: tipo || null,
          ...rangeBounds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: data.error || "No se pudo activar la alerta" });
        return;
      }

      localStorage.setItem(EMAIL_KEY, email.trim());
      setState({ status: "done", message: data.message });
    } catch {
      setState({ status: "error", message: "Error de conexión" });
    }
  }

  async function unsubscribe() {
    setUnsubcribing(true);
    try {
      await fetch(`/api/alerts?email=${encodeURIComponent(email.trim())}`, { method: "DELETE" });
      localStorage.removeItem(EMAIL_KEY);
      setState({ status: "done", message: "Alerta desactivada" });
    } catch {
      setState({ status: "error", message: "No se pudo desactivar" });
    } finally {
      setUnsubcribing(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      const stored = localStorage.getItem(EMAIL_KEY);
      if (stored) {
        setEmail(stored);
        void restoreAlert(stored);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.status === "done") {
    return (
      <div className={`rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 ${compact ? "" : ""}`}>
        <div className="flex items-start gap-2">
          <Check size={15} className="mt-0.5 shrink-0" />
          <span>{state.message}</span>
        </div>
        <button
          onClick={() => setState({ status: "idle" })}
          className="mt-2 text-xs underline hover:no-underline"
        >
          Configurar otra alerta
        </button>
      </div>
    );
  }

  if (state.status === "active") {
    return (
      <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
        <div className="flex items-start gap-2">
          <BellRing size={15} className="mt-0.5 shrink-0" />
          <span>
            Alerta activa para <strong>{email}</strong>. Te avisamos cuando publiquemos carreras nuevas.
          </span>
        </div>
        <button
          onClick={unsubscribe}
          disabled={unsubcribing}
          className="mt-2 inline-flex items-center gap-1 text-xs underline hover:no-underline disabled:opacity-50"
        >
          <X size={11} />
          Desactivar alerta
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={subscribe} className="rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 space-y-2">
      <div className="flex items-start gap-2">
        <Bell size={15} className="mt-0.5 shrink-0 text-orange-500" />
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {hasFilters ? "Avísame de carreras como estas" : "Avísame de nuevas carreras"}
          </p>
          <p className="text-xs text-gray-500">
            {hasFilters
              ? "Recibirás un email cuando haya carreras nuevas que encajen con tus filtros."
              : "Recibirás un email cuando publiquemos carreras nuevas."}
          </p>
        </div>
      </div>

      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        className="field"
      />

      {state.status === "error" && (
        <p className="text-xs text-red-600">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={state.status === "busy" || state.status === "loading"}
        className="btn-primary w-full justify-center text-xs py-2 disabled:opacity-60"
      >
        {state.status === "busy" || state.status === "loading" ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            Activando...
          </>
        ) : (
          "Activar alerta"
        )}
      </button>
    </form>
  );
}