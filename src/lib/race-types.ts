import type { Prisma, RaceType } from "@/generated/prisma/client";

/**
 * Landings indexables por disciplina.
 *
 * Antes solo existían `?tipo=...`: URLs con parámetros, no indexables como
 * páginas propias y compitiendo entre sí. Cada entrada genera una ruta estática
 * en `/carreras/tipo/[tipo]` con canonical, H1 y copy propios.
 */
export interface RaceTypeLanding {
  slug: string;
  /** Tipo de `Race.type`. */
  type?: RaceType;
  /** Rango opcional de distancia para landings tipo "10K". */
  distanceKm?: { gte?: number; lte?: number };
  /** Etiqueta corta para menús y chips. */
  label: string;
  /** Título de la página (sin el sufijo de marca). */
  title: string;
  /** H1. */
  heading: string;
  description: string;
  /** Párrafo introductorio, único por landing. */
  intro: string;
}

export const RACE_TYPE_LANDINGS: RaceTypeLanding[] = [
  {
    slug: "running",
    type: "ASFALTO",
    label: "Running",
    title: "Carreras de running y asfalto en España",
    heading: "Carreras de running y asfalto",
    description:
      "Calendario de carreras populares de asfalto en España: 5K, 10K y más. Fechas, provincias, distancias e inscripciones.",
    intro:
      "Carreras urbanas y populares de asfalto en toda España. Encuentra tu próxima 5K, 10K o prueba de ruta y accede a la inscripción oficial.",
  },
  {
    slug: "trail",
    type: "TRAIL",
    label: "Trail",
    title: "Carreras de trail y montaña en España",
    heading: "Carreras de trail y montaña",
    description:
      "Calendario de trail running en España: iniciación, media montaña y ultras, con fechas y provincias.",
    intro:
      "Senderos, pistas y montaña en todas las comunidades. Aquí tienes las próximas carreras de trail para planificar tu temporada.",
  },
  {
    slug: "media-maraton",
    type: "MEDIA_MARATON",
    label: "Media Maratón",
    title: "Medias maratones en España | Calendario",
    heading: "Medias maratones en España",
    description:
      "Calendario de medias maratones (21,097 km) en España con fechas, provincias e inscripciones.",
    intro:
      "La distancia ideal antes del maratón. Consulta las próximas 21K del calendario por fecha y ubicación.",
  },
  {
    slug: "maraton",
    type: "MARATON",
    label: "Maratón",
    title: "Maratones en España | Calendario",
    heading: "Maratones en España",
    description:
      "Calendario de maratones en España: fechas, ciudades y enlaces de inscripción para tu próximo 42K.",
    intro:
      "Todos los maratones del calendario en España, con la información clave para preparar tu objetivo.",
  },
  {
    slug: "ciclismo",
    type: "CICLISMO",
    label: "Ciclismo",
    title: "Marchas y carreras ciclistas en España",
    heading: "Ciclismo en España",
    description:
      "Calendario de eventos ciclistas en España: carretera, BTT, gravel y marchas cicloturistas.",
    intro:
      "Pruebas y marchas ciclistas por toda España, de carretera, montaña o gravel, para todos los niveles.",
  },
  {
    slug: "triatlon",
    type: "TRIATLON",
    label: "Triatlón",
    title: "Triatlones y duatlones en España",
    heading: "Triatlón en España",
    description:
      "Calendario de triatlones y duatlones en España con fechas, sedes y distancias.",
    intro:
      "Natación, ciclismo y carrera en un mismo evento. Descubre los próximos triatlones y duatlones del calendario.",
  },
  {
    slug: "natacion",
    type: "NATACION",
    label: "Natación",
    title: "Travesías y pruebas de natación en España",
    heading: "Natación en aguas abiertas",
    description:
      "Calendario de travesías y eventos de natación en España, en mar, pantanos y ríos.",
    intro:
      "Travesías y pruebas de natación en aguas abiertas por toda España, para nadadores populares y federados.",
  },
  {
    slug: "hibridos",
    type: "HIBRIDO",
    label: "Híbridos",
    title: "Carreras híbridas y OCR en España (HYROX, OCR…)",
    heading: "Carreras híbridas y OCR",
    description:
      "Calendario de eventos híbridos y OCR en España: HYROX, carreras de obstáculos y fitness funcional.",
    intro:
      "Eventos que combinan carrera con fuerza y habilidades: HYROX, OCR y retos híbridos en toda España.",
  },
  {
    slug: "marcha",
    type: "MARCHA",
    label: "Marcha",
    title: "Marchas y caminatas populares en España",
    heading: "Marchas y caminatas populares",
    description:
      "Calendario de marchas y caminatas populares en España para todos los niveles.",
    intro:
      "Pruebas no competitivas para disfrutar caminando, en familia o como iniciación. Estas son las próximas marchas.",
  },
  {
    slug: "orientacion",
    type: "ORIENTACION",
    label: "Orientación",
    title: "Carreras de orientación en España",
    heading: "Carreras de orientación",
    description:
      "Calendario de carreras de orientación en España con mapa y brújula.",
    intro:
      "Carreras donde la navegación es clave. Encuentra pruebas de orientación por toda España.",
  },
  {
    slug: "10k",
    type: "ASFALTO",
    distanceKm: { gte: 9.5, lte: 10.5 },
    label: "10K",
    title: "Carreras de 10K en España | Calendario",
    heading: "Carreras de 10K en España",
    description:
      "Calendario de carreras de 10 kilómetros en España: fechas, provincias e inscripciones.",
    intro:
      "Los 10K son una de las distancias más populares. Aquí tienes las próximas carreras de 10 kilómetros registradas.",
  },
];

export function raceTypeLanding(slug: string): RaceTypeLanding | undefined {
  return RACE_TYPE_LANDINGS.find((landing) => landing.slug === slug);
}

/** Filtro de Prisma para una landing de disciplina. */
export function raceTypeLandingWhere(landing: RaceTypeLanding): Prisma.RaceWhereInput {
  const where: Prisma.RaceWhereInput = {};
  if (landing.type) where.type = landing.type;
  if (landing.distanceKm) where.distanceKm = landing.distanceKm;
  return where;
}
