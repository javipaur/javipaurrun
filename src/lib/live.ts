import { createHash, randomBytes } from "crypto";

export function generateRunnerToken(): string {
  return randomBytes(24).toString("hex");
}

export function hashRunnerToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export interface CheckpointGeo {
  id: string;
  eventId: string;
  order: number;
  name: string;
  km: number;
  lat?: number | null;
  lng?: number | null;
  radius: number;
}

export function findCheckpointPasses(
  lat: number,
  lng: number,
  checkpoints: CheckpointGeo[],
  passedCheckpointIds: Set<string>
): { checkpoint: CheckpointGeo; distance: number }[] {
  const passes: { checkpoint: CheckpointGeo; distance: number }[] = [];

  for (const cp of checkpoints) {
    if (passedCheckpointIds.has(cp.id)) continue;
    if (cp.lat == null || cp.lng == null) continue;

    const distance = haversineMeters(lat, lng, cp.lat, cp.lng);
    if (distance <= cp.radius) {
      passes.push({ checkpoint: cp, distance });
    }
  }

  return passes;
}

export interface PositionProjection {
  km: number | null;
  speed: number | null;
  heading: number | null;
  etaSecondsToFinish: number | null;
}

export function projectPosition(input: {
  km?: number | null;
  speed?: number | null;
  heading?: number | null;
  totalDistance: number;
}): PositionProjection {
  const km = input.km != null && !isNaN(input.km) && input.km >= 0 ? input.km : null;
  const speed = input.speed != null && !isNaN(input.speed) && input.speed >= 0 ? input.speed : null;
  const heading = input.heading != null && !isNaN(input.heading) ? input.heading : null;

  let etaSecondsToFinish: number | null = null;
  if (km != null && speed != null && speed > 0 && input.totalDistance > 0) {
    const remaining = Math.max(0, input.totalDistance - km);
    etaSecondsToFinish = Math.round((remaining / speed) * 3600);
  }

  return { km, speed, heading, etaSecondsToFinish };
}

export function totalDistanceFromRoute(route: unknown): number {
  if (route == null) return 0;
  let count = 0;
  try {
    const features = (route as { features?: unknown[] }).features || [];
    for (const f of features) {
      const coords = (f as { geometry?: { coordinates?: unknown } }).geometry?.coordinates;
      if (Array.isArray(coords)) {
        for (let i = 1; i < coords.length; i++) {
          const a = coords[i - 1] as [number, number];
          const b = coords[i] as [number, number];
          if (Array.isArray(a) && Array.isArray(b)) {
            count += haversineMeters(a[1], a[0], b[1], b[0]);
          }
        }
      }
    }
  } catch {
    return 0;
  }
  return Math.round(count);
}

export function formatEta(seconds: number | null): string | null {
  if (seconds == null) return null;
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m${Math.round(seconds % 60)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function formatPace(speedKmh: number | null): string | null {
  if (speedKmh == null || speedKmh <= 0) return null;
  const secondsPerKm = 3600 / speedKmh;
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.round(secondsPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")} min/km`;
}