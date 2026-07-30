import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sin conexión - JavipaurRun",
};

export default function OfflinePage() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">📡</div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Sin conexión
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        Parece que no tienes internet. Las páginas que visitaste antes siguen disponibles.
      </p>
      <a
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium"
      >
        Volver al inicio
      </a>
    </div>
  );
}
