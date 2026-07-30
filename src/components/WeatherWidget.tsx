"use client";

import { useEffect, useState } from "react";
import { Cloud, Sun, CloudRain, Snowflake, CloudLightning, CloudDrizzle, CloudFog, Thermometer, Droplets, Wind } from "lucide-react";

interface WeatherData {
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windSpeed: number;
  code: number;
}

function getWeatherIcon(code: number, size: number = 16) {
  if (code <= 1) return <Sun size={size} className="text-yellow-500" />;
  if (code <= 3) return <Cloud size={size} className="text-gray-400" />;
  if (code <= 29) return <CloudDrizzle size={size} className="text-blue-400" />;
  if (code <= 49) return <CloudFog size={size} className="text-gray-400" />;
  if (code <= 59) return <CloudDrizzle size={size} className="text-blue-500" />;
  if (code <= 69) return <CloudRain size={size} className="text-blue-600" />;
  if (code <= 79) return <Snowflake size={size} className="text-blue-300" />;
  if (code <= 84) return <CloudRain size={size} className="text-blue-600" />;
  return <CloudLightning size={size} className="text-purple-500" />;
}

function getWeatherLabel(code: number): string {
  if (code <= 1) return "Despejado";
  if (code <= 3) return "Nublado";
  if (code <= 29) return "Lluvia ligera";
  if (code <= 49) return "Niebla";
  if (code <= 59) return "Llovizna";
  if (code <= 69) return "Lluvia";
  if (code <= 79) return "Nieve";
  if (code <= 84) return "Lluvia";
  return "Tormenta";
}

export default function WeatherWidget({
  latitude,
  longitude,
  date,
  raceLocation,
}: {
  latitude: number;
  longitude: number;
  date: string;
  raceLocation: string;
}) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raceDate = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((raceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0 || diffDays > 16) {
      setLoading(false);
      return;
    }

    const targetDate = raceDate.toISOString().split("T")[0];

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weathercode&timezone=Europe/Madrid&forecast_days=16`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.daily) {
          const idx = data.daily.time.indexOf(targetDate);
          if (idx !== -1) {
            setWeather({
              tempMax: data.daily.temperature_2m_max[idx],
              tempMin: data.daily.temperature_2m_min[idx],
              precipitation: data.daily.precipitation_sum[idx],
              windSpeed: data.daily.wind_speed_10m_max[idx],
              code: data.daily.weathercode[idx],
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [latitude, longitude, date]);

  if (loading) return null;
  if (!weather) return null;

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm">
      <div className="flex items-center gap-2">
        {getWeatherIcon(weather.code)}
        <span className="text-gray-900 dark:text-gray-100 font-medium text-sm">
          {getWeatherLabel(weather.code)}
        </span>
      </div>
      <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1" title="Temperatura">
          <Thermometer size={13} />
          {weather.tempMax.toFixed(0)}° / {weather.tempMin.toFixed(0)}°
        </span>
        <span className="flex items-center gap-1" title="Precipitación">
          <Droplets size={13} />
          {weather.precipitation.toFixed(0)} mm
        </span>
        <span className="flex items-center gap-1" title="Viento">
          <Wind size={13} />
          {weather.windSpeed.toFixed(0)} km/h
        </span>
      </div>
    </div>
  );
}
