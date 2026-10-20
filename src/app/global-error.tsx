"use client";

import { useEffect } from "react";

/**
 * Ultima frontera: sustituye el layout raiz completo.
 *
 * Solo se dispara si falla el propio layout (o app/error.tsx). A diferencia de
 * error.tsx, aqui hay que aportar <html> y <body> porque no hay nada que los
 * envuelva.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global] fallo en el layout raiz:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen flex items-center justify-center bg-white text-gray-900 px-4">
        <div className="max-w-lg text-center">
          <h1 className="text-2xl font-bold mb-3">No hemos podido cargar el sitio</h1>
          <p className="text-gray-600 leading-relaxed mb-6">
            Ha ocurrido un error grave. Inténtalo de nuevo en unos minutos.
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
