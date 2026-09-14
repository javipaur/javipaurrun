const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function geocodeLocation(
  location: string,
  province: string
): Promise<{ lat: number; lng: number } | null> {
  const parts = [location.trim(), province.trim().replace(/^Otra$/i, ""), "Spain"].filter(Boolean);
  const query = parts.join(", ");

  try {
    const response = await fetch(
      `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      {
        headers: { "User-Agent": "javipaurrun-app/1.0" },
      }
    );

    if (!response.ok) return null;

    const data = (await response.json()) as { lat: string; lon: string }[];

    if (data.length === 0) {
      const fallbackParts = [province.trim().replace(/^Otra$/i, ""), "Spain"].filter(Boolean);
      if (fallbackParts.length === 0) return null;
      const fallback = await fetch(
        `${NOMINATIM_BASE}/search?q=${encodeURIComponent(fallbackParts.join(", "))}&format=json&limit=1`,
        {
          headers: { "User-Agent": "javipaurrun-app/1.0" },
        }
      );
      const fallbackData = (await fallback.json()) as { lat: string; lon: string }[];

      if (fallbackData.length === 0) return null;
      return {
        lat: parseFloat(fallbackData[0].lat),
        lng: parseFloat(fallbackData[0].lon),
      };
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch {
    return null;
  }
}

export async function geocodeUnlocatedRaces(): Promise<number> {
  const { prisma } = await import("./prisma");

  const races = await prisma.race.findMany({
    where: {
      latitude: null,
      location: { not: "Por determinar" },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    take: 300,
  });

  let geocoded = 0;

  for (const race of races) {
    const result = await geocodeLocation(race.location, race.province);
    if (result) {
      await prisma.race.update({
        where: { id: race.id },
        data: { latitude: result.lat, longitude: result.lng },
      });
      geocoded++;
    }

    await delay(1100);
  }

  return geocoded;
}
