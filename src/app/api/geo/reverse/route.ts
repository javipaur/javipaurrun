import { envSiteUrl } from "@/lib/site-url";
import { NextResponse } from "next/server";
import { locationFromNominatim } from "@/lib/visitor-location";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/auth-helpers";

const geoLimiter = rateLimit({ interval: 60_000, max: 20 });

/**
 * Proxy de Nominatim reverse-geocode.
 *
 * Se hace desde el servidor a propósito:
 * - Nominatim exige un User-Agent válido y los navegadores no lo permiten.
 * - Evita exponer la IP del visitante a un tercero.
 * - Permite cachear y aplicar rate limiting con la IP del servidor.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Coordenadas fuera de rango" }, { status: 400 });
  }

  const { allowed } = geoLimiter.check(`geo:${getClientIp(req)}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiadas consultas de geolocalización" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("accept-language", "es");
  url.searchParams.set("addressdetails", "1");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": `JavipaurRun/1.0 (+${envSiteUrl()})` },
      next: { revalidate: 86_400 },
    });

    if (!res.ok) {
      console.error(`Nominatim error: ${res.status}`);
      return NextResponse.json({ error: "No se pudo resolver la ubicación" }, { status: 502 });
    }

    const data = await res.json();
    const location = locationFromNominatim(data, lat, lng);

    return NextResponse.json(location, {
      headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
    });
  } catch (error) {
    console.error("Error en geo/reverse:", error);
    return NextResponse.json({ error: "Error de red" }, { status: 502 });
  }
}