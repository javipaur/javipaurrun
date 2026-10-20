"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { raceTypes, provinces } from "@/lib/utils";

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export default function SubmitRacePage() {
  const [state, setState] = useState<FormState>({ status: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ status: "submitting" });

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/races/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setState({ status: "error", message: json.error || "No se pudo enviar la propuesta" });
        return;
      }

      setState({ status: "success", message: json.message });
      form.reset();
    } catch {
      setState({ status: "error", message: "Error de conexión. Inténtalo de nuevo." });
    }
  }

  if (state.status === "success") {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-fade-in">
        <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
        <h1 className="section-title mb-2">¡Gracias!</h1>
        <p className="text-text-secondary text-sm mb-8">{state.message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => setState({ status: "idle" })} className="btn-primary">
            <Plus size={15} />
            Enviar otra carrera
          </button>
          <Link href="/calendario" className="btn-secondary">
            Ver el calendario
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div className="mb-8">
        <p className="section-eyebrow mb-1.5">Colabora</p>
        <h1 className="section-title mb-2">Añadir una carrera</h1>
        <p className="text-text-secondary text-sm">
          ¿Organizas una carrera popular? Envíanos los datos y la revisamos para publicarla en el
          directorio. Las propuestas se revisan manualmente antes de aparecer.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card-premium p-5 sm:p-7 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Nombre de la carrera *
          </label>
          <input name="name" required minLength={4} placeholder="Ej. XX Carrera Popular de Ciudad" className="field" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Tipo *
            </label>
            <select name="type" required className="field" defaultValue="">
              <option value="" disabled>
                Selecciona
              </option>
              {raceTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Distancia
            </label>
            <input name="distance" placeholder="Ej. 10 km" className="field" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Provincia *
            </label>
            <select name="province" required className="field" defaultValue="">
              <option value="" disabled>
                Selecciona
              </option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Ciudad
            </label>
            <input name="city" placeholder="Ej. Vitoria" className="field" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Fecha *
            </label>
            <input type="date" name="date" required className="field" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Hora
            </label>
            <input type="time" name="time" className="field" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Descripción
          </label>
          <textarea
            name="description"
            rows={4}
            placeholder="Cuenta los detalles de la carrera: recorrido, avituallamiento, servicios..."
            className="field resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Web oficial
            </label>
            <input type="url" name="url" placeholder="https://..." className="field" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Inscripciones
            </label>
            <input type="url" name="registrationUrl" placeholder="https://..." className="field" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Precio
            </label>
            <input name="price" placeholder="Ej. 25€" className="field" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Email de contacto
            </label>
            <input type="email" name="contactEmail" placeholder="contacto@..." className="field" />
          </div>
        </div>

        {state.status === "error" && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{state.message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={state.status === "submitting"}
          className="btn-primary w-full justify-center disabled:opacity-60"
        >
          {state.status === "submitting" ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar propuesta"
          )}
        </button>

        <p className="text-xs text-text-secondary text-center">
          Máximo 5 propuestas por hora. Los datos se revisan antes de publicarse.
        </p>
      </form>
    </div>
  );
}