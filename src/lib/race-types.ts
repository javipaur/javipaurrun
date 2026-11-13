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
    slug: "asfalto",
    type: "ASFALTO",
    label: "Running",
    title: "Carreras de asfalto y running en España",
    heading: "Carreras de asfalto y running",
    description:
      "Calendario de carreras populares de asfalto en España: 5K, 10K, medias y maratones. Fechas, provincias, distancias e inscripciones actualizadas.",
    intro:
      "Las carreras de asfalto son la puerta de entrada al running popular: distancias cortas, circuitos urbanos y ambientazo en la calle. Aquí tienes todas las pruebas de asfalto del calendario, ordenadas por fecha y con el enlace de inscripción cuando está disponible.",
  },
  {
    slug: "trail",
    type: "TRAIL",
    label: "Trail",
    title: "Carreras de trail running en España",
    heading: "Carreras de trail running",
    description:
      "Calendario de carreras de trail y montaña en España: desde iniciación hasta ultras. Fechas, desnivel cuando está disponible y enlaces de inscripción.",
    intro:
      "El trail cambia el asfalto por senderos, pistas y montaña. Encontrarás pruebas de iniciación de pocos kilómetros y carreras de ultradistancia, con la fecha y la provincia de cada una para planificar la temporada.",
  },
  {
    slug: "media-maraton",
    type: "MEDIA_MARATON",
    label: "Media Maratón",
    title: "Medias maratones en España | Calendario",
    heading: "Medias maratones en España",
    description:
      "Calendario de medias maratones en España (21,097 km). Consulta fechas, provincias e inscripciones abiertas de las próximas 21K.",
    intro:
      "La media maratón es el salto natural antes del maratón: 21,097 km que exigen preparación pero se disfrutan. Estas son las próximas medias maratones del calendario, con su fecha, provincia e información de inscripción.",
  },
  {
    slug: "maraton",
    type: "MARATON",
    label: "Maratón",
    title: "Maratones en España | Calendario 2026",
    heading: "Maratones en España",
    description:
      "Calendario de maratones en España: fechas, ciudades, plazos de inscripción y estado de cada 42K. Planifica tu próximo maratón.",
    intro:
      "Cuarenta y dos kilómetros y ciento noventa y cinco metros. Aquí están los maratones que se celebran en España, con la fecha, la ciudad y el enlace a la inscripción oficial para que no se te escape el plazo.",
  },
  {
    slug: "marcha",
    type: "MARCHA",
    label: "Marcha",
    title: "Marchas y caminatas populares en España",
    heading: "Marchas y caminatas populares",
    description:
      "Calendario de marchas y caminatas populares en España. Pruebas no competitivas para todos los niveles, con fecha y provincia.",
    intro:
      "No todo el calendario es competitivo. Las marchas y caminatas populares permiten disfrutar del deporte sin cronómetro, en familia o como primera toma de contacto. Estas son las próximas.",
  },
  {
    slug: "orientacion",
    type: "ORIENTACION",
    label: "Orientación",
    title: "Carreras de orientación en España",
    heading: "Carreras de orientación",
    description:
      "Calendario de carreras de orientación en España: pruebas con mapa y brújula para todos los niveles, con fecha y provincia.",
    intro:
      "La orientación combina carrera y navegación: hay que encontrar los controles con mapa y brújula en el menor tiempo posible. Un deporte con menos pruebas que el asfalto, pero con un calendario activo en toda España.",
  },
  {
    slug: "10k",
    type: "ASFALTO",
    distanceKm: { gte: 9.5, lte: 10.5 },
    label: "10K",
    title: "Carreras de 10K en España | Calendario",
    heading: "Carreras de 10K en España",
    description:
      "Calendario de carreras de 10 kilómetros en España: fechas, provincias e inscripciones. La distancia más popular del running.",
    intro:
      "Los 10K son la distancia más popular del calendario: exigentes pero asequibles, y con pruebas casi todos los fines de semana. Aquí tienes las carreras de 10 kilómetros registradas, ordenadas por fecha.",
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
