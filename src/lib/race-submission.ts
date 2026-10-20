import { getAutonomousCommunity, parseKmFromDistance, slugify } from "@/lib/utils";
import type { z } from "zod";
import type { raceSubmissionSchema } from "@/lib/validation";

export type RaceSubmissionInput = z.infer<typeof raceSubmissionSchema>;

export interface NormalizedSubmission {
  name: string;
  slug: string;
  type: "ASFALTO" | "MEDIA_MARATON" | "MARATON" | "TRAIL" | "MARCHA" | "ORIENTACION";
  distance?: string;
  distanceKm: number | null;
  location: string;
  city: string | null;
  province: string;
  community: string;
  date: Date;
  time?: string;
  description?: string;
  url?: string;
  image?: string;
  registrationUrl?: string;
  price?: string;
  source: string;
  pendingReview: boolean;
}

function emptyToUndefined(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Normaliza una propuesta de carrera enviada por el público para poder
 * insertarla en la tabla `Race` con los mismos campos que usan los scrapers.
 */
export function normalizeRaceSubmission(input: RaceSubmissionInput): NormalizedSubmission {
  const province = input.province.trim();
  const city = emptyToUndefined(input.city);

  const location = city ?? province;
  const date = new Date(input.date);
  date.setHours(12, 0, 0, 0);

  return {
    name: input.name.trim(),
    slug: slugify(input.name).slice(0, 100),
    type: input.type,
    distance: emptyToUndefined(input.distance),
    distanceKm: parseKmFromDistance(input.distance),
    location,
    city: city ?? null,
    province,
    community: getAutonomousCommunity(province),
    date,
    time: emptyToUndefined(input.time),
    description: emptyToUndefined(input.description),
    url: emptyToUndefined(input.url),
    image: emptyToUndefined(input.image),
    registrationUrl: emptyToUndefined(input.registrationUrl),
    price: emptyToUndefined(input.price),
    source: "manual",
    pendingReview: true,
  };
}