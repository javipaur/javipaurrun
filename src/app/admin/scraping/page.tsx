"use client";

import { useEffect, useState } from "react";

interface LogEntry {
  id: string;
  source: string;
  count: number;
  status: string;
  error: string | null;
  createdAt: string;
}

const sources = [
  { id: "lasterketak", name: "Lasterketak.eus", desc: "API REST de WordPress +8500 carreras", icon: "🏃" },
  { id: "rockthesport", name: "RockTheSport", desc: "Scraping HTML (Cloudflare)", icon: "🎽" },
  { id: "buscametas", name: "Buscametas", desc: "Scraping HTML (anti-bot)", icon: "🔍" },
];

const sourceLabels: Record<string, string> = {
  lasterketak: "Lasterketak.eus",
  rockthesport: "RockTheSport",
  buscametas: "Buscametas",
};

export default function ScrapingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);
  const [results, setResults] = useState<Record<string, any>>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState<number | null>(null);

  async function fetchLogs() {
    try {
      const res = await fetch("/api/scraping/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  async function handleScrape(sourceId: string) {
    setLoading(sourceId);
    try {
      const res = await fetch("/api/scraping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: sourceId }),
      });
      const data = await res.json();
      setResults((prev) => ({ ...prev, [sourceId]: data }));
      await fetchLogs();
    } catch {
      setResults((prev) => ({
        ...prev,
        [sourceId]: { error: "Error al conectar con el servidor" },
      }));
    } finally {
      setLoading(null);
    }
  }

  async function handleScrapeAll() {
    setLoadingAll(true);
    try {
      const res = await fetch("/api/scraping/all", { method: "POST" });
      const data = await res.json();
      if (data.results) {
        for (const r of data.results) {
          setResults((prev) => ({ ...prev, [r.source]: r }));
        }
      }
      await fetchLogs();
    } catch {
      setResults((prev) => ({
        ...prev,
        all: { error: "Error al ejecutar scraping completo" },
      }));
    } finally {
      setLoadingAll(false);
    }
  }

  async function handleGeocode() {
    setGeocoding(true);
    setGeocodeResult(null);
    try {
      const res = await fetch("/api/scraping/geocode", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setGeocodeResult(data.geocoded || 0);
      }
    } catch {
      setGeocodeResult(0);
    } finally {
      setGeocoding(false);
    }
  }

  const lastLog = logs[0];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Scraping de carreras</h1>
      <p className="text-gray-600 mb-8">
        Importa carreras automáticamente desde fuentes externas.
      </p>

      {lastLog && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-sm text-blue-800">
          <strong>Último scraping:</strong>{" "}
          {new Date(lastLog.createdAt).toLocaleString("es-ES")}
          {" — "}
          {lastLog.status === "SUCCESS" ? "✅" : "❌"}{" "}
          {sourceLabels[lastLog.source] || lastLog.source}:{" "}
          {lastLog.count} carreras importadas
          {lastLog.error && ` (${lastLog.error})`}
        </div>
      )}

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-8">
        <h3 className="font-semibold text-orange-900 text-sm mb-1">⏰ Scraping automático</h3>
        <p className="text-orange-800 text-sm mb-2">
          Usa un servicio externo como{" "}
          <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer"
             className="underline font-medium">cron-job.org</a>{" "}
          (gratuito) para llamar a esta URL cada 6-12h:
        </p>
        <div className="bg-white rounded-lg p-3 text-xs font-mono break-all border border-orange-200">
          GET {window.location.origin}/api/cron/scrape?key=CRON_SECRET
        </div>
        <p className="text-orange-700 text-xs mt-2">
          Añade <code className="bg-orange-100 px-1 rounded">CRON_SECRET</code> a tu .env.
          Ejecuta:{" "}
          <code className="bg-orange-100 px-1 rounded">node -e &quot;console.log(require(&apos;crypto&apos;).randomBytes(32).toString(&apos;hex&apos;))&quot;</code>
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8">
        <h3 className="font-semibold text-green-900 text-sm mb-1">📍 Geolocalización</h3>
        <p className="text-green-800 text-sm mb-2">
          Asigna coordenadas a carreras que no tienen ubicación en el mapa.
        </p>
        <button
          onClick={handleGeocode}
          disabled={geocoding}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {geocoding ? "Geocodificando..." : "Geocodificar carreras sin ubicación"}
        </button>
        {geocodeResult !== null && (
          <p className="text-green-700 text-xs mt-2">✅ {geocodeResult} carreras geocodificadas</p>
        )}
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Fuentes</h2>
        <button
          onClick={handleScrapeAll}
          disabled={loadingAll}
          className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loadingAll ? "Scrapeando todas..." : "Scrapear todas"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((source) => (
          <div
            key={source.id}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="text-3xl mb-3">{source.icon}</div>
            <h2 className="font-semibold text-gray-900 text-lg mb-1">
              {source.name}
            </h2>
            <p className="text-sm text-gray-500 mb-4">{source.desc}</p>

            <button
              onClick={() => handleScrape(source.id)}
              disabled={loading === source.id}
              className="w-full bg-orange-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading === source.id ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Scrapeando...
                </span>
              ) : (
                `Importar desde ${source.name}`
              )}
            </button>

            {results[source.id] && (
              <div
                className={`mt-4 rounded-lg p-4 text-sm ${
                  results[source.id].error
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-green-50 text-green-700 border border-green-200"
                }`}
              >
                {results[source.id].error ? (
                  <p>{results[source.id].error}</p>
                ) : (
                  <div>
                    <p className="font-medium">✅ Scraping completado</p>
                    <p className="mt-1">
                      Encontradas: <strong>{results[source.id].found}</strong> |
                      Nuevas: <strong>{results[source.id].imported}</strong>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial</h2>
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay scraping ejecutado aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 pr-4">Fecha</th>
                  <th className="pb-2 pr-4">Fuente</th>
                  <th className="pb-2 pr-4">Estado</th>
                  <th className="pb-2">Importadas</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-600">
                      {new Date(log.createdAt).toLocaleString("es-ES")}
                    </td>
                    <td className="py-2 pr-4 font-medium text-gray-900">
                      {sourceLabels[log.source] || log.source}
                    </td>
                    <td className="py-2 pr-4">
                      {log.status === "SUCCESS" ? (
                        <span className="text-green-600">✅ Éxito</span>
                      ) : (
                        <span className="text-red-600" title={log.error || ""}>❌ Error</span>
                      )}
                    </td>
                    <td className="py-2">{log.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
