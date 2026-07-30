import { prisma } from "./prisma";
import { geocodeUnlocatedRaces } from "./geocode";

export interface ScrapedRace {
  name: string;
  type: string;
  distance?: string;
  location: string;
  province: string;
  date: string;
  time?: string;
  description?: string;
  url?: string;
  image?: string;
  price?: string;
}

async function fetchWithTimeout(url: string, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "'")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&(\w+);/g, (entity) => {
      const entities: Record<string, string> = {
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&apos;": "'",
        "&nbsp;": " ",
      };
      return entities[entity] || entity;
    });
}

const PROVINCE_TAGS = new Set([
  "nafarroa", "araba", "bizkaia", "gipuzkoa",
  "cantabria", "burgos", "rioja", "zamora",
]);

function getProvinceFromTag(tagSlug: string): string {
  const map: Record<string, string> = {
    nafarroa: "Navarra",
    araba: "Araba",
    bizkaia: "Bizkaia",
    gipuzkoa: "Gipuzkoa",
    cantabria: "Cantabria",
    burgos: "Burgos",
    rioja: "La Rioja",
    zamora: "Zamora",
  };
  return map[tagSlug] || "";
}

function detectRaceType(name: string, distance?: string, sport?: string): string {
  const lower = name.toLowerCase();

  if (sport === "trail" || sport === "ultra-trail") return "TRAIL";

  if (lower.includes("orientación") || lower.includes("orientacion")) return "ORIENTACION";

  if (lower.includes("marcha") && !lower.includes("media maratón") && !lower.includes("media maraton")) return "MARCHA";

  if (lower.includes("trail") || lower.includes("txakurkros")) return "TRAIL";

  if (
    lower.includes("maratón") || lower.includes("marathon") ||
    lower.startsWith("maratón") || lower.startsWith("marathon")
  ) return "MARATON";

  if (
    lower.includes("media maratón") || lower.includes("media maraton") ||
    lower.includes("medio maratón") || lower.includes("medio maraton") ||
    lower.startsWith("media maratón") || lower.startsWith("media maraton")
  ) return "MEDIA_MARATON";

  if (distance) {
    const distNum = parseFloat(distance.replace(",", ".").split(" ")[0]);
    if (!isNaN(distNum)) {
      if (distNum >= 42) return "MARATON";
      if (distNum >= 21) return "MEDIA_MARATON";
    }
  }

  return "ASFALTO";
}

function parseDistanceFromText(text: string): string | undefined {
  const kmMatch = text.match(/(\d+[.,]\d+)\s*km/i);
  if (kmMatch) return `${kmMatch[1].replace(",", ".")} km`;

  const mShort = text.match(/(?:circuito\s+de\s+)?(\d+)\.(\d{3})\s*m/i);
  if (mShort) {
    const total = parseInt(mShort[1] + mShort[2], 10);
    return `${(total / 1000).toFixed(1).replace(".", ",")} km`;
  }

  const mLong = text.match(/(\d+[.,]?\d*)\s*metr/i);
  if (mLong) {
    const dist = parseFloat(mLong[1].replace(",", "."));
    if (dist >= 1000) return `${(dist / 1000).toFixed(1).replace(".", ",")} km`;
    return `${dist.toFixed(0)} m`;
  }

  return undefined;
}

export async function scrapeFromLasterketak(): Promise<ScrapedRace[]> {
  const races: ScrapedRace[] = [];

  try {
    let page = 1;
    let totalPages = 1;
    const maxPages = 1;

    while (page <= totalPages && page <= maxPages) {
      const response = await fetchWithTimeout(
        `https://lasterketak.eus/eu/wp-json/wp/v2/event?per_page=100&page=${page}&_embed=1`,
        60000
      );

      const events = await response.json() as Record<string, unknown>[];

      if (page === 1) {
        totalPages = parseInt(response.headers.get("X-WP-TotalPages") || "1", 10);
      }

      for (const event of events) {
        const content = (event.content as { rendered: string })?.rendered || "";
        const text = decodeHtmlEntities(content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());

        const dateTimeMatch = text.match(
          /(\d{4})\/(\d{2})\/(\d{2})\s*[-–]\s*(\d{2}):(\d{2})/
        );
        if (!dateTimeMatch) continue;

        const dateStr = `${dateTimeMatch[1]}-${dateTimeMatch[2]}-${dateTimeMatch[3]}`;
        const timeStr = `${dateTimeMatch[4]}:${dateTimeMatch[5]}`;

        const distance = parseDistanceFromText(text);

        const embedded = (event._embedded as Record<string, unknown>) || {};
        const termGroups = (embedded["wp:term"] as unknown[][]) || [];

        const eventcats = (termGroups[0] || []) as { slug: string }[];
        const eventTags = (termGroups[2] || []) as { name: string; slug: string }[];

        const name = decodeHtmlEntities(
          ((event.title as { rendered?: string })?.rendered || "").trim()
        );
        if (!name) continue;

        const isTrail = eventcats.some((cat) => cat.slug === "trail");
        const isTxakurkros = eventcats.some((cat) => cat.slug === "txakurkros");

        const type = detectRaceType(
          name,
          distance,
          isTrail || isTxakurkros ? "trail" : undefined
        );

        const locationTag = eventTags.find((tag) => !PROVINCE_TAGS.has(tag.slug));
        const provinceTag = eventTags.find((tag) => PROVINCE_TAGS.has(tag.slug));

        const location = locationTag?.name || "Por determinar";
        const provinceRaw = provinceTag?.slug || "";
        const province = provinceRaw ? getProvinceFromTag(provinceRaw) : detectProvince(location);

        const media = (embedded["wp:featuredmedia"] as Record<string, unknown>[])?.[0];
        const image = (media?.source_url as string) || undefined;

        const excerptRaw = (event.excerpt as { rendered?: string })?.rendered || "";
        const description = excerptRaw
          ? decodeHtmlEntities(excerptRaw.replace(/<[^>]+>/g, "").trim())
          : undefined;

        races.push({
          name,
          type,
          distance,
          location,
          province,
          date: dateStr,
          time: timeStr,
          description,
          url: (event.link as string) || undefined,
          image,
        });
      }

      page++;
    }
  } catch (error) {
    console.error("Error scraping Lasterketak via WP API:", error);
  }

  return races;
}

export async function scrapeFromRockTheSport(): Promise<ScrapedRace[]> {
  const races: ScrapedRace[] = [];
  const API_BASE = "https://publicservice.rockthesport.com";
  const API_KEY = "rts_public_web_2024_a8f3d9e1c4b7";

  try {
    const now = Date.now();
    const sports = ["trail", "running", "ultra-trail"];
    let page = 1;
    let totalPages = 1;
    const maxPages = 10;

    while (page <= totalPages && page <= maxPages) {
      const res = await fetch(`${API_BASE}/api/event/list?pageNumber=${page}&pageSize=20`, {
        method: "POST",
        headers: {
          "X-API-Key": API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          kind: "country:65",
          "data.sport(s)": sports,
          "(ge) data.dates.startedDateTimestamp": now,
        }),
      });

      if (!res.ok) {
        console.error(`RockTheSport API error: ${res.status}`);
        break;
      }

      const data = (await res.json()) as Record<string, unknown>;
      const responseData = data.data as Record<string, unknown> | undefined;
      const items = (responseData?.items as Record<string, unknown>[]) || [];
      const pagination = responseData?.pagination as Record<string, unknown> | undefined;

      if (page === 1 && pagination) {
        totalPages = (pagination.totalPages as number) || 1;
      }

      for (const item of items) {
        const name = (item.title as string || "").trim();
        if (!name || name.length < 3) continue;

        const sport = (item.sport as string) || "";
        const type = detectRaceType(name, undefined, sport);

        const dateIso = (item.startedDateIso as string) || "";
        const dateStr = dateIso.split("T")[0];

        const slug = (item.slug as string) || "";

        races.push({
          name,
          type,
          location: "Por determinar",
          province: detectProvince(name),
          date: dateStr,
          url: slug ? `https://web.rockthesport.com/en/event/${slug}` : undefined,
          image: (item.urlImage as string) || undefined,
        });
      }

      page++;
    }
  } catch (error) {
    console.error("Error scraping RockTheSport:", error);
  }

  return races;
}

export async function scrapeFromSportmaniacs(): Promise<ScrapedRace[]> {
  const races: ScrapedRace[] = [];

  try {
    const maxPages = 5;
    const pageSize = 25;

    for (let page = 1; page <= maxPages; page++) {
      const res = await fetchWithTimeout(
        `https://sportmaniacs.com/api/races?page=${page}&limit=${pageSize}&raceType=1`,
        30000
      );

      if (!res.ok) {
        console.error(`Sportmaniacs API error: ${res.status}`);
        break;
      }

      const data = (await res.json()) as Record<string, unknown>;
      const items = (data.data as Record<string, unknown>[]) || [];

      if (items.length === 0) break;

      for (const item of items) {
        const country = (item.country as string) || "";
        if (country !== "España" && item.country_id !== "ESP") continue;

        const name = (item.name as string || "").trim();
        if (!name || name.length < 3) continue;

        const dateStr = (item.date as string) || "";
        if (!dateStr) continue;

        const dateObj = new Date(dateStr);
        if (dateObj < new Date()) continue;

        const province = (item.province as string) || "";
        const location = (item.city as string) || province || "Por determinar";

        const type = detectRaceType(name);

        const slug = (item.slug as string) || "";

        races.push({
          name,
          type,
          location,
          province,
          date: dateStr,
          url: slug ? `https://sportmaniacs.com/es/race/${slug}` : undefined,
        });
      }
    }
  } catch (error) {
    console.error("Error scraping Sportmaniacs:", error);
  }

  return races;
}

export async function scrapeFromBuscametas(): Promise<ScrapedRace[]> {
  const races: ScrapedRace[] = [];

  try {
    const res = await fetchWithTimeout(
      "https://www.buscametas.com/modulos/calendario/fuentes/get_eventos.php",
      30000
    );
    const data = await res.json() as Record<string, unknown>;
    const html = (data.html_eventos || "") as string;

    const MONTHS: Record<string, string> = {
      ENE: "01", FEB: "02", MAR: "03", ABR: "04", MAY: "05", JUN: "06",
      JUL: "07", AGO: "08", SEP: "09", OCT: "10", NOV: "11", DIC: "12",
    };

    const currentYear = new Date().getFullYear().toString();
    const eventRegex = /<a\s+href="(\/evento\/\d+\/)"[^>]*>[\s\S]*?<span>(\d+)<\/span>\s*([A-Z]{3})[\s\S]*?item-calendar-data[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/a>/g;
    let match: RegExpExecArray | null;

    while ((match = eventRegex.exec(html)) !== null) {
      const [, href, day, monthAbbr, dataHtml] = match;
      const month = MONTHS[monthAbbr];
      if (!month) continue;

      const dateStr = `${currentYear}-${month}-${day.padStart(2, "0")}`;
      const text = dataHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

      const nameMatch = dataHtml.match(/<h[234][^>]*>(.*?)<\/h[234]>/);
      const name = nameMatch
        ? nameMatch[1].replace(/<[^>]+>/g, "").trim()
        : text.split("Ver más")[0]?.trim();
      if (!name || name.length < 3) continue;

      const distance = parseDistanceFromText(text);
      const type = detectRaceType(name, distance);

      races.push({
        name,
        type,
        distance,
        location: "Buscametas",
        province: detectProvince(text),
        date: dateStr,
        url: `https://www.buscametas.com${href}`,
      });
    }
  } catch (error) {
    console.error("Error scraping Buscametas:", error);
  }

  return races;
}

function detectProvince(text: string): string {
  const provinceMap: Record<string, string[]> = {
    Araba: ["álava", "araba", "vitoria", "gasteiz", "llodio", "amurrio", "laudio"],
    Bizkaia: ["bizkaia", "vizcaya", "bilbao", "bilbo", "barakaldo", "getxo", "portugalete", "durango", "gernika", "leioa", "basauri", "mungia"],
    Gipuzkoa: ["gipuzkoa", "guipúzcoa", "donostia", "san sebastián", "irun", "errenteria", "eibar", "zarautz", "andoadin", "tolosa", "arrasate", "mondragón", "oñati", "bergara", "lasarte", "hernani"],
    Cantabria: ["cantabria", "santander", "torrelavega", "castro urdiales", "laredo", "santoña"],
    Burgos: ["burgos", "miranda de ebro", "aranda de duero"],
    "La Rioja": ["rioja", "logroño", "calahorra", "haro"],
    Navarra: ["navarra", "nafarroa", "pamplona", "iruña", "tudela", "estella", "tafalla", "lizarra", "aoiz", "murchante", "valtierra", "falces", "sartaguda", "ribaforada", "fustiñana"],
    Zamora: ["zamora", "benavente"],
    Madrid: ["madrid"],
    Barcelona: ["barcelona"],
    Valencia: ["valencia"],
    Sevilla: ["sevilla"],
    Málaga: ["málaga", "malaga"],
    Alicante: ["alicante", "alacant"],
    "A Coruña": ["coruña", "coruna", "la coruña"],
    Murcia: ["murcia"],
    Asturias: ["asturias", "gijón", "oviedo"],
    "Las Palmas": ["las palmas", "gran canaria"],
    "Santa Cruz de Tenerife": ["tenerife", "santa cruz de tenerife"],
    Zaragoza: ["zaragoza"],
    Valladolid: ["valladolid"],
    Cádiz: ["cádiz", "cadiz"],
    Granada: ["granada"],
    Tarragona: ["tarragona"],
    Lleida: ["lleida", "lérida"],
    Girona: ["girona", "gerona"],
    Albacete: ["albacete"],
    Salamanca: ["salamanca"],
    Huelva: ["huelva"],
    León: ["león", "leon"],
    Córdoba: ["córdoba", "cordoba"],
    Almería: ["almería", "almeria"],
    Castellón: ["castellón", "castellon", "castelló"],
    Badajoz: ["badajoz"],
    "Ciudad Real": ["ciudad real"],
    Huesca: ["huesca"],
    Jaén: ["jaén", "jaen"],
    Ourense: ["ourense", "orense"],
    "Baleares (Illes)": ["baleares", "mallorca", "menorca", "ibiza", "palma"],
    Pontevedra: ["pontevedra", "vigo"],
    Lugo: ["lugo"],
    Palencia: ["palencia"],
    Segovia: ["segovia"],
    Soria: ["soria"],
    Teruel: ["teruel"],
    Toledo: ["toledo"],
    Cuenca: ["cuenca"],
    Guadalajara: ["guadalajara"],
    Ávila: ["ávila", "avila"],
    Cáceres: ["cáceres", "caceres"],
  };

  const lower = text.toLowerCase();
  for (const [province, keywords] of Object.entries(provinceMap)) {
    if (keywords.some((kw) => lower.includes(kw))) return province;
  }

  return "Otra";
}

export async function importScrapedRaces(scrapedRaces: ScrapedRace[], source: string): Promise<number> {
  let imported = 0;

  for (const race of scrapedRaces) {
    const slug = race.name
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñü]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);

    const exists = await prisma.race.findUnique({ where: { slug } });
    if (exists) continue;

    await prisma.race.create({
      data: {
        name: race.name,
        slug,
        type: race.type as "ASFALTO" | "MEDIA_MARATON" | "MARATON" | "TRAIL" | "MARCHA" | "ORIENTACION",
        distance: race.distance,
        location: race.location,
        province: race.province,
        date: new Date(race.date),
        time: race.time,
        description: race.description,
        url: race.url,
        image: race.image,
        price: race.price,
        source,
      },
    });
    imported++;
  }

  return imported;
}

export interface ScrapeResult {
  source: string;
  label: string;
  found: number;
  imported: number;
  error?: string;
}

const sources = [
  { key: "lasterketak", label: "Lasterketak.eus", scrape: scrapeFromLasterketak },
  { key: "rockthesport", label: "RockTheSport", scrape: scrapeFromRockTheSport },
  { key: "sportmaniacs", label: "Sportmaniacs", scrape: scrapeFromSportmaniacs },
  { key: "buscametas", label: "Buscametas", scrape: scrapeFromBuscametas },
] as const;

export async function runAllScrapers(): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  for (const source of sources) {
    try {
      const scraped = await source.scrape();
      const imported = await importScrapedRaces(scraped as ScrapedRace[], source.key);

      await prisma.scrapeLog.create({
        data: { source: source.key, count: imported, status: "SUCCESS" },
      });

      results.push({
        source: source.key,
        label: source.label,
        found: scraped.length,
        imported,
      });
    } catch (error) {
      await prisma.scrapeLog.create({
        data: {
          source: source.key,
          count: 0,
          status: "ERROR",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      results.push({
        source: source.key,
        label: source.label,
        found: 0,
        imported: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  try {
    const geocoded = await geocodeUnlocatedRaces();
    if (geocoded > 0) {
      console.log(`Geocoded ${geocoded} races`);
    }
  } catch {
    console.error("Geocoding error (non-fatal)");
  }

  return results;
}
