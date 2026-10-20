"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Frontera de error raiz.
 *
 * Se renderiza DENTRO del layout raiz, asi que el usuario conserva cabecera,
 * menu y pie: solo se pierde el contenido de la pagina. Un 500 en blanco deja
 * al visitante sin ninguna salida, y una web de calendario es justo lo que
 * no puede caerse.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] error no controlado:", error);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-text-primary mb-3">Algo ha ido mal</h1>

      <p className="text-text-secondary leading-relaxed mb-6">
        Ha ocurrido un error inesperado al cargar esta página. Puedes reintentarlo o volver
        al inicio.
      </p>

      {error.digest && (
        <p className="text-xs text-text-tertiary mb-6">
          Referencia: <code className="font-mono">{error.digest}</code>
        </p>
      )}

      <div className="flex flex-wrap gap-3 justify-center">
        <button onClick={reset} className="btn-primary">
          Reintentar
        </button>
        <Link href="/calendario" className="btn-secondary">
          Ver el calendario
        </Link>
      </div>
    </div>
  );
}
