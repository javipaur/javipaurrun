import { z, ZodError } from "zod";

export function getZodErrorMessage(error: ZodError): string {
  const issue = error.issues[0];
  if (issue.path.length > 0) {
    return `${issue.path.join(".")}: ${issue.message}`;
  }
  return issue.message;
}

const RaceTypeEnum = z.enum(["ASFALTO", "MEDIA_MARATON", "MARATON", "TRAIL", "MARCHA", "ORIENTACION"]);
const RaceStatusEnum = z.enum(["PROXIMAMENTE", "INSCRIPCIONES_ABIERTAS", "COMPLETADA", "CANCELADA"]);

export const registerSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email("Email inválido").max(255),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128)
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export const raceCreateSchema = z.object({
  name: z.string().min(1).max(200),
  type: RaceTypeEnum,
  distance: z.string().max(50).optional(),
  location: z.string().min(1).max(200),
  province: z.string().min(1).max(100),
  date: z.string().refine((v) => !isNaN(Date.parse(v)), "Fecha inválida"),
  endDate: z.string().optional(),
  time: z.string().max(10).optional(),
  description: z.string().max(5000).optional(),
  url: z.string().url().max(500).optional().or(z.literal("")),
  image: z.string().max(500).optional(),
  price: z.string().max(50).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  status: RaceStatusEnum.optional(),
  featured: z.boolean().optional(),
});

export const raceUpdateSchema = raceCreateSchema.partial();

/**
 * Formulario público de alta de carreras.
 * Campos pensados para que un organizadorrellene en 1 minuto.
 * `location` es opcional: si no viene, se deriva de `city` o `province`.
 */
export const raceAlertSchema = z.object({
  email: z.string().email("Email inválido").max(255),
  province: z.string().max(100).optional().nullable(),
  community: z.string().max(50).optional().nullable(),
  type: RaceTypeEnum.optional().nullable(),
  minKm: z.coerce.number().min(0).max(300).optional().nullable(),
  maxKm: z.coerce.number().min(0).max(300).optional().nullable(),
}).refine(
  (v) => v.minKm == null || v.maxKm == null || v.minKm <= v.maxKm,
  { message: "La distancia mínima no puede ser mayor que la máxima", path: ["minKm"] }
);

export const raceSubmissionSchema = z.object({
  name: z.string().min(4, "El nombre debe tener al menos 4 caracteres").max(200),
  type: RaceTypeEnum,
  distance: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  province: z.string().min(2, "Indica la provincia").max(100),
  date: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "Fecha inválida")
    .refine((v) => new Date(v).getTime() >= Date.now() - 86_400_000, "La fecha no puede estar en el pasado"),
  time: z.string().max(10).optional(),
  description: z.string().max(2000).optional(),
  url: z.string().url("URL oficial inválida").max(500).optional().or(z.literal("")),
  registrationUrl: z.string().url("URL de inscripción inválida").max(500).optional().or(z.literal("")),
  image: z.string().url("URL de imagen inválida").max(500).optional().or(z.literal("")),
  price: z.string().max(50).optional(),
  contactEmail: z.string().email("Email de contacto inválido").max(255).optional().or(z.literal("")),
});

export const blogCreateSchema = z.object({
  title: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1).max(50000),
  image: z.string().url().max(500).optional().or(z.literal("")),
  published: z.boolean().optional(),
});

export const blogUpdateSchema = blogCreateSchema.partial();

export const newsletterSchema = z.object({
  email: z.string().email("Email inválido").max(255),
});

export const scrapingSchema = z.object({
  source: z.enum(["lasterketak", "rockthesport", "sportmaniacs", "buscametas", "carreraspopulares"]),
});

export const livePositionSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  km: z.coerce.number().min(0).max(2000).optional(),
  speed: z.coerce.number().min(0).max(100).optional(),
  heading: z.coerce.number().min(0).max(360).optional(),
  timestamp: z.coerce.number().int().optional(),
});

export const checkpointPassSchema = z.object({
  bib: z.coerce.number().int().min(1),
  source: z.enum(["QR", "MANUAL"]).default("MANUAL"),
});
