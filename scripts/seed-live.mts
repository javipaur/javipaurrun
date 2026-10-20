import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { generateRunnerToken, hashRunnerToken } from "../src/lib/live";

const ORG_SLUG = "lab-festival";

async function ensureUser() {
  const email = process.env.SEED_ORGANIZER_EMAIL || "organizador@example.com";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { name: "Organizador Demo", email, role: "ORGANIZADOR" },
    });
    console.log(`Usuario organizador creado: ${email}`);
  }
  return user;
}

async function ensureOrganization(userId: string) {
  const org = await prisma.organization.upsert({
    where: { slug: ORG_SLUG },
    update: {},
    create: { name: "Lab Festival", slug: ORG_SLUG },
  });

  await prisma.organizerMembership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId } },
    update: {},
    create: { organizationId: org.id, userId, role: "ADMIN" },
  });
  return org;
}

async function ensureEvent(orgId: string) {
  const slug = "lab-trail-demo";
  const date = new Date();
  date.setDate(date.getDate() + 14);

  // Un circuito sencillo de ejemplo (coord ~ Madrid)
  const route = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [-3.7038, 40.4168],
            [-3.69, 40.41],
            [-3.68, 40.42],
            [-3.7038, 40.4168],
          ],
        },
      },
    ],
  };

  const event = await prisma.event.upsert({
    where: { slug },
    update: { organizationId: orgId, date },
    create: {
      organizationId: orgId,
      name: "Lab Trail Demo",
      slug,
      description: "Evento de prueba del seguimiento en vivo.",
      date,
      status: "PUBLISHED",
      liveOpen: true,
      route,
    },
  });

  const checkpoints = [
    { order: 1, name: "Salida", km: 0, lat: 40.4168, lng: -3.7038, radius: 80 },
    { order: 2, name: "Km 5", km: 5, lat: 40.41, lng: -3.69, radius: 80 },
    { order: 3, name: "Meta", km: 10, lat: 40.42, lng: -3.68, radius: 80 },
  ];

  for (const c of checkpoints) {
    await prisma.checkpoint.upsert({
      where: { eventId_order: { eventId: event.id, order: c.order } },
      update: { name: c.name, km: c.km, lat: c.lat, lng: c.lng, radius: c.radius },
      create: { ...c, eventId: event.id },
    });
  }

  return event;
}

async function ensureRunners(eventId: string) {
  const names = [
    { bib: 1, name: "Ana Ruiz", category: "FEMENINO" },
    { bib: 2, name: "Carlos Gil", category: "MASCULINO" },
    { bib: 3, name: "Marta López", category: "FEMENINO" },
    { bib: 4, name: "Javi Orbe", category: "MASCULINO" },
  ];

  for (const n of names) {
    const token = generateRunnerToken();
    const existing = await prisma.eventRunner.findUnique({
      where: { eventId_bib: { eventId, bib: n.bib } },
    });
    if (existing) {
      console.log(`Dorsal ${n.bib} ya existe (${n.name})`);
      continue;
    }
    await prisma.eventRunner.create({
      data: {
        eventId,
        bib: n.bib,
        name: n.name,
        category: n.category,
        token: hashRunnerToken(token),
        status: "REGISTRADO",
      },
    });
    console.log(`Dorsal ${n.bib} (${n.name}) token: ${token}`);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Falta DATABASE_URL en .env");
    process.exit(1);
  }

  const user = await ensureUser();
  const org = await ensureOrganization(user.id);
  const event = await ensureEvent(org.id);
  await ensureRunners(event.id);

  console.log("\n=== SEED FASE 1 LISTO ===");
  console.log(`Organización: ${org.name} (${org.slug})`);
  console.log(`Evento: ${event.name} (${event.slug})`);
  console.log(`URL live: /live/${event.slug}`);
  console.log(
    "Tokens de dorsal generados solo la primera vez; guardarlos si haces pruebas de ingesta."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());