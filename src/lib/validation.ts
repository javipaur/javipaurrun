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
  source: z.enum(["lasterketak", "rockthesport", "buscametas"]),
});
