"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";

/**
 * Frontera de error del calendario.
 *
 * Sin esto, cualquier excepcion en la pagina devolvia un 500 en blanco: sin
 * mensaje, sin reintento y sin rastro. Ahora el usuario puede reintentar y el
 * error llega a la consola del servidor con su mensaje real.
 */
export default function CalendarioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[calendario] error al renderizar:", error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 md:py-24 text-center">
      <AlertTriangle size={28} className="text-amber-500 mx-auto mb-4" />

      <h1 className="text-2xl font-bold text-text-primary mb-2">
        No hemos podido cargar el calendario
      </h1>

      <p className="text-text-secondary leading-relaxed mb-2">
        Ha ocurrido un error al preparar la lista de carreras. Puedes reintentarlo o
        consultar el mapa, que sigue funcionando.
      </p>

      {error.digest && (
        <p className="text-xs text-text-tertiary mb-6">
          Referencia del error: <code className="font-mono">{error.digest}</code>
        </p>
      )}

      <div className="flex flex-wrap gap-3 justify-center">
        <button onClick={reset} className="btn-primary">
          <RotateCw size={15} />
          Reintentar
        </button>
        <Link href="/mapa" className="btn-secondary">
          Ver el mapa
        </Link>
        <Link href="/" className="btn-secondary">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
