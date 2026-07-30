"use client";

import { useState } from "react";
import { Timer, Ruler, Gauge } from "lucide-react";

type Mode = "pace" | "time" | "distance";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function parseTimeToSeconds(val: string): number {
  const parts = val.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

const distances = [
  { label: "1 km", km: 1 },
  { label: "5 km", km: 5 },
  { label: "10 km", km: 10 },
  { label: "Media maratón", km: 21.0975 },
  { label: "Maratón", km: 42.195 },
];

export default function PaceCalculator() {
  const [mode, setMode] = useState<Mode>("pace");
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("30");
  const [seconds, setSeconds] = useState("0");
  const [distanceKm, setDistanceKm] = useState("10");

  const totalSeconds =
    parseInt(hours || "0") * 3600 +
    parseInt(minutes || "0") * 60 +
    parseInt(seconds || "0");

  const dist = parseFloat(distanceKm) || 0;

  const pacePerKm = dist > 0 ? totalSeconds / dist : 0;
  const speedKmh = pacePerKm > 0 ? 3600 / pacePerKm : 0;

  const predictions = dist > 0
    ? distances.map((d) => ({
        label: d.label,
        time: formatTime((totalSeconds / dist) * d.km),
        pace: formatTime(pacePerKm),
        speed: speedKmh,
      }))
    : [];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8">
      {/* Mode selector */}
      <div className="flex gap-2 mb-6">
        {[
          { value: "pace", label: "Ritmo", icon: Timer },
          { value: "time", label: "Tiempo", icon: Gauge },
          { value: "distance", label: "Distancia", icon: Ruler },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.value}
              onClick={() => setMode(m.value as Mode)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                mode === m.value
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <Icon size={14} />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Tiempo total (hh:mm:ss)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="hh"
                className="w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              <span className="flex items-center text-gray-400 text-sm">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="mm"
                className="w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              <span className="flex items-center text-gray-400 text-sm">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                placeholder="ss"
                className="w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Distancia (km)
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              placeholder="10"
              className="w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Resultados
          </h3>
          <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Ritmo por km</span>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100 font-mono">
              {pacePerKm > 0 ? formatTime(pacePerKm) + " /km" : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Velocidad media</span>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100 font-mono">
              {speedKmh > 0 ? `${speedKmh.toFixed(1)} km/h` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Tiempo total</span>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100 font-mono">
              {totalSeconds > 0 ? formatTime(totalSeconds) : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Predictions */}
      {dist > 0 && totalSeconds > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
            Predicciones para otras distancias
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">Distancia</th>
                  <th className="text-right py-2 px-4 text-gray-500 dark:text-gray-400 font-medium">Tiempo estimado</th>
                  <th className="text-right py-2 px-4 text-gray-500 dark:text-gray-400 font-medium">Ritmo</th>
                  <th className="text-right py-2 pl-4 text-gray-500 dark:text-gray-400 font-medium">Velocidad</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p) => (
                  <tr key={p.label} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">{p.label}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900 dark:text-gray-100">
                      {p.time}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-gray-600 dark:text-gray-400">
                      {p.pace}
                    </td>
                    <td className="py-2.5 pl-4 text-right font-mono text-gray-600 dark:text-gray-400">
                      {p.speed.toFixed(1)} km/h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalSeconds === 0 && (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">
          Introduce un tiempo y una distancia para ver los resultados
        </p>
      )}
    </div>
  );
}
