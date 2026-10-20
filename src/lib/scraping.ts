import { prisma } from "./prisma";
import { getAutonomousCommunity, parseKmFromDistance } from "./utils";
import { geocodeUnlocatedRaces } from "./geocode";

export interface ScrapedRace {
  name: string;
  type: string;
  distance?: string;
  location: string;
  province: string;
  date: string;
  endDate?: string;
  time?: string;
  description?: string;
  url?: string;
  image?: string;
  price?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
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

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

// Lasterketak tags that describe the type of event, a series or a region
// rather than a specific town/city. They must be excluded when deriving
// the race location from the tag list (town tags usually come last).
const NON_LOCATION_TAGS = new Set([
  "san-silvestre", "mendi-lasterketa", "mendi-maratoia", "herri-krosa",
  "mistoa", "maraton", "maratoia", "goierri-kopa-trail", "emf-rankinga-2019",
  "txingudi", "nudista", "bertika", "bertikal", "km-bertikal", "kross",
  "krosa", "txapelketa", "lineal", "koop-social", "olimpiada-rural",
  "kilometrobertikal", "bailara", "zonako", "memoria", "cross", "carrera",
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

  if (lower.includes("trail") || lower.includes("txakurkros") || lower.includes("montaña") || lower.includes("montana") || lower.includes("carrera por mont") || lower.includes("mendi")) return "TRAIL";

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

const MONTH_NAME_MAP: Record<string, number> = {
  enero: 1, january: 1, janvier: 1, february: 2, febrero: 2, fevrier: 2,
  marco: 3, martxo: 3, marzo: 3, mars: 3, april: 4, abril: 4, apiril: 4,
  avril: 4, may: 5, mayo: 5, maiatz: 5, mai: 5, june: 6, junio: 6, ekain: 6,
  juin: 6, july: 7, julio: 7, uztail: 7, juillet: 7, august: 8, agosto: 8,
  abuztu: 8, aout: 8, août: 8, september: 9, septiembre: 9, setiembre: 9,
  septembre: 9, irail: 9, october: 10, octubre: 10, urri: 10, octobre: 10,
  november: 11, noviembre: 11, azaro: 11, novembre: 11, december: 12,
  diciembre: 12, abendu: 12, decembre: 12, décembre: 12,
};

function parseEventDateFromText(text: string): { date: string; time?: string } | null {
  const lower = text.toLowerCase();

  const MONTHS_EU = "(urtarril|otsail|martxo|apiril|maiatz|ekain|uztail|abuztu|irail|urri|azaro|abendu)";
  const MONTHS_ES = "(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|janvier|février|fevrier|mars|avril|juin|juillet|août|aout|octobre|novembre|décembre|decembre)";

  const patterns: Array<{ re: RegExp; date: (m: RegExpExecArray) => string }> = [
    {
      re: /(\d{4})\/(\d{1,2})\/(\d{1,2})/,
      date: (m) => `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`,
    },
    {
      re: /(\d{4})-(\d{1,2})-(\d{1,2})/,
      date: (m) => `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`,
    },
    {
      re: /(\d{4})\.(\d{1,2})\.(\d{1,2})/,
      date: (m) => `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`,
    },
    {
      re: /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      date: (m) => `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`,
    },
    {
      re: new RegExp(`(\\d{4})ko\\s+${MONTHS_EU}[a-z]*\\s+(\\d{1,2})`, "i"),
      date: (m) => {
        const month = MONTH_NAME_MAP[m[2]];
        return month ? `${m[1]}-${String(month).padStart(2, "0")}-${m[3].padStart(2, "0")}` : "";
      },
    },
    {
      re: new RegExp(`(\\d{1,2})\\s+${MONTHS_EU}[a-z]*[a-z]\\s+(\\d{4})`, "i"),
      date: (m) => {
        const month = MONTH_NAME_MAP[m[2]];
        return month ? `${m[3]}-${String(month).padStart(2, "0")}-${m[1].padStart(2, "0")}` : "";
      },
    },
    {
      re: new RegExp(`(\\d{1,2})\\s+${MONTHS_ES}[a-z]*\\s+(\\d{4})`, "i"),
      date: (m) => {
        const month = MONTH_NAME_MAP[m[2]];
        return month ? `${m[3]}-${String(month).padStart(2, "0")}-${m[1].padStart(2, "0")}` : "";
      },
    },
  ];

  for (const { re, date } of patterns) {
    const match = re.exec(lower);
    if (!match) continue;
    const dateStr = date(match);
    if (!dateStr) continue;
    return { date: dateStr };
  }

  return null;
}

function extractTimeFromText(text: string): string | undefined {
  const lower = text.toLowerCase();
  const timePatterns: RegExp[] = [
    /(?:horario|ordutegia|irteera|salida|ordua|goizeko|arratsaldeko|eguerdian):?\s*(\d{1,2}):(\d{2})/i,
    /(\d{1,2}):(\d{2})\s*(?:h|etan|tan|ean|atrekin|ak)?/i,
  ];

  for (const re of timePatterns) {
    const match = re.exec(lower);
    if (match) {
      const hour = parseInt(match[1], 10);
      const minute = parseInt(match[2], 10);
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      }
    }
  }

  return undefined;
}

export async function scrapeFromLasterketak(): Promise<ScrapedRace[]> {
  const races: ScrapedRace[] = [];

  try {
    let page = 1;
    let totalPages = 1;
    const maxPages = Math.min(20, Number(process.env.SCRAPER_MAX_PAGES) || 20);

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

        const dateTimeMatch = parseEventDateFromText(text);
        if (!dateTimeMatch) continue;

        const dateStr = dateTimeMatch.date;
        const timeStr = extractTimeFromText(text);

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

        const placeTags = eventTags.filter((tag) => !PROVINCE_TAGS.has(tag.slug) && !NON_LOCATION_TAGS.has(tag.slug));
        const locationTag = placeTags.length > 0 ? placeTags[placeTags.length - 1] : undefined;
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

      if (page <= totalPages && page <= maxPages) {
        await new Promise((r) => setTimeout(r, 300));
      }
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
    const pageSize = 50;

    while (page <= totalPages) {
      const res = await fetch(`${API_BASE}/api/event/list?pageNumber=${page}&pageSize=${pageSize}`, {
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

        const cityRaw = (item.city as string) || "";
        const location = cityRaw || "Por determinar";

        const subsports = (item.subsports as string[]) || [];
        let distance: string | undefined;
        const distEntry = subsports.find((s) => /km/i.test(s));
        if (distEntry) distance = normalizeDistanceLabel(distEntry);

        races.push({
          name,
          type,
          distance,
          location,
          province: normalizeProvince((item.province as string) || "") || detectProvince(name + " " + cityRaw),
          date: dateStr,
          url: slug ? `https://web.rockthesport.com/en/event/${slug}` : undefined,
          image: (item.urlImage as string) || undefined,
          city: cityRaw || undefined,
        });
      }

      page++;
    }
  } catch (error) {
    console.error("Error scraping RockTheSport:", error);
  }

  return races;
}

function normalizeDistanceLabel(value: string): string {
  const num = parseFloat(value.replace(",", "."));
  const m = value.match(/(\d+[.,]?\d*)\s*(km|m)/i);
  if (m) {
    const n = parseFloat(m[1].replace(",", "."));
    if (m[2].toLowerCase() === "m") {
      if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".", ",")} km`;
      return `${Math.round(n)} m`;
    }
    return `${n.toLocaleString("es-ES", { maximumFractionDigits: 1 })} km`;
  }
  return isNaN(num) ? value : `${num} km`;
}

export async function scrapeFromSportmaniacs(): Promise<ScrapedRace[]> {
  const races: ScrapedRace[] = [];
  const seen = new Set<string>();

  try {
    const pageSize = 100;
    let page = 1;
    const maxPages = Math.min(20, Number(process.env.SCRAPER_MAX_PAGES) || 20);

    while (page <= maxPages) {
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
        const city = (item.city as string) || "";
        const location = city || province || "Por determinar";

        const type = detectRaceType(name);

        const slug = (item.slug as string) || "";
        const url = slug ? `https://sportmaniacs.com/es/race/${slug}` : undefined;

        if (url) {
          if (seen.has(url)) continue;
          seen.add(url);
        }

        const latRaw = item.latitude;
        const lngRaw = item.longitude;
        const latitude = latRaw != null && latRaw !== "" ? parseFloat(String(latRaw)) : undefined;
        const longitude = lngRaw != null && lngRaw !== "" ? parseFloat(String(lngRaw)) : undefined;

        let distance: string | undefined;
        const distRaw = (item.distance as string) || "";
        if (distRaw) {
          distance = normalizeDistanceLabel(distRaw);
        } else if (item.subtitle) {
          const txt = String(item.subtitle);
          const kmMatch = txt.match(/(\d+[.,]?\d*)\s*km/i);
          if (kmMatch) distance = `${kmMatch[1].replace(",", ".")} km`;
        }

        races.push({
          name,
          type,
          distance,
          location,
          province: normalizeProvince(province),
          date: dateStr,
          endDate: (item.end_date as string) || undefined,
          url,
          latitude,
          longitude,
          city,
        });
      }

      page++;
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

    const now = new Date();
    const currentYear = now.getFullYear();
    const eventRegex = /<a\s+href="(\/evento\/\d+\/)"[^>]*>[\s\S]*?<span>(\d+)<\/span>\s*([A-Z]{3})[\s\S]*?item-calendar-data[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/a>/g;
    let match: RegExpExecArray | null;

    while ((match = eventRegex.exec(html)) !== null) {
      const [, href, day, monthAbbr, dataHtml] = match;
      const month = MONTHS[monthAbbr];
      if (!month) continue;

      const candidateYear = new Date(currentYear, parseInt(month, 10) - 1, parseInt(day, 10));
      const sixMonthsAhead = new Date(now);
      sixMonthsAhead.setMonth(sixMonthsAhead.getMonth() + 6);
      const year = candidateYear > sixMonthsAhead ? currentYear - 1 : currentYear;
      const dateStr = `${year}-${month}-${day.padStart(2, "0")}`;
      const text = dataHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

      const nameMatch = dataHtml.match(/<h[234][^>]*>(.*?)<\/h[234]>/);
      const name = nameMatch
        ? nameMatch[1].replace(/<[^>]+>/g, "").trim()
        : text.split("Ver más")[0]?.trim();
      if (!name || name.length < 3) continue;

      const distance = parseDistanceFromText(text);
      const type = detectRaceType(name, distance);

      const locationMatch = dataHtml.match(
        /item-calendar-data__location[\s\S]*?<span>([\s\S]*?)<\/span>(?:\s*\(([^)]*)\))?/
      );
      const city = locationMatch?.[1]?.replace(/<[^>]+>/g, "").trim();
      const locProvinceStr = locationMatch?.[2]?.trim();

      const location = city && city !== "Buscametas" ? city : "Por determinar";
      const scrapeProvince = locProvinceStr
        ? normalizeProvince(locProvinceStr)
        : detectProvince(location);

      races.push({
        name,
        type,
        distance,
        location,
        province: scrapeProvince,
        date: dateStr,
        url: `https://www.buscametas.com${href}`,
      });
    }
  } catch (error) {
    console.error("Error scraping Buscametas:", error);
  }

  return races;
}

const INE_PROVINCE_MAP: Record<string, string> = {
  "1": "Araba",
  "2": "Albacete",
  "3": "Alicante",
  "4": "Almería",
  "5": "Ávila",
  "6": "Badajoz",
  "7": "Baleares (Illes)",
  "8": "Barcelona",
  "9": "Burgos",
  "10": "Cáceres",
  "11": "Cádiz",
  "12": "Castellón",
  "13": "Ciudad Real",
  "14": "Córdoba",
  "15": "A Coruña",
  "16": "Cuenca",
  "17": "Girona",
  "18": "Granada",
  "19": "Guadalajara",
  "20": "Gipuzkoa",
  "21": "Huelva",
  "22": "Huesca",
  "23": "Jaén",
  "24": "León",
  "25": "Lleida",
  "26": "La Rioja",
  "27": "Lugo",
  "28": "Madrid",
  "29": "Málaga",
  "30": "Murcia",
  "31": "Navarra",
  "32": "Ourense",
  "33": "Asturias",
  "34": "Palencia",
  "35": "Las Palmas",
  "36": "Pontevedra",
  "37": "Salamanca",
  "38": "Santa Cruz de Tenerife",
  "39": "Cantabria",
  "40": "Segovia",
  "41": "Sevilla",
  "42": "Soria",
  "43": "Tarragona",
  "44": "Teruel",
  "45": "Toledo",
  "46": "Valencia",
  "47": "Valladolid",
  "48": "Bizkaia",
  "49": "Zamora",
  "50": "Zaragoza",
  "51": "Ceuta",
  "52": "Melilla",
};

export async function scrapeFromCarrerasPopulares(): Promise<ScrapedRace[]> {
  const races: ScrapedRace[] = [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    let response: Response;
    try {
      response = await fetch(
        "https://carreraspopulares.com/api/calendario_carreras/getCarreras/es",
        {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
            Accept: "application/json",
            Referer:
              "https://carreraspopulares.com/calendario_carreras/lista/CuVPow/carreras_espa%C3%B1a_proximos_30_dias",
          },
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      console.error(`CarrerasPopulares API error: ${response.status}`);
      return races;
    }

    const data = (await response.json()) as {
      data?: { ediciones?: Record<string, unknown>[] };
    };
    const ediciones = data.data?.ediciones || [];

    for (const ed of ediciones) {
      const name = decodeHtmlEntities(
        (ed.titulo as string || "").trim()
      );
      if (!name || name.length < 3) continue;

      const fechaRaw = (ed.fechaED as string) || "";
      const dateMatch = fechaRaw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!dateMatch) continue;
      const dateStr = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;

      const dateObj = new Date(`${dateStr}T12:00:00`);
      if (dateObj < new Date()) continue;

      const distance = parseDistanceFromText((ed.distanciaTxt as string) || "");
      const type = detectRaceType(name, distance);

      const poblacion = (ed.poblacion as string || "").trim();
      const city = poblacion
        .replace(/\s*\([^)]*\)\s*$/, "")
        .replace(/\s+/g, " ")
        .trim() || "Por determinar";

      const ineCode = String(ed.idProv ?? "");
      const province = INE_PROVINCE_MAP[ineCode] || detectProvince(poblacion);

      const organiza = (ed.organiza as string || "").trim();
      const descParts = ["Organiza: " + organiza].filter((p) => p.length > "Organiza: ".length);

      races.push({
        name,
        type,
        distance,
        location: city,
        province,
        date: dateStr,
        time: (ed.horaTxt as string)?.trim() || undefined,
        description: descParts.length > 0 ? descParts.join(". ") : undefined,
        url: (ed.url_amigable as string) || (ed.url_FC as string) || undefined,
        image: isValidImageUrl(ed.cartel as string),
        city: city !== "Por determinar" ? city : undefined,
      });
    }
  } catch (error) {
    console.error("Error scraping CarrerasPopulares:", error);
  }

  return races;
}

export function detectProvince(text: string): string {
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
    Ceuta: ["ceuta"],
    Melilla: ["melilla"],
  };

  const lower = stripAccents(text).toLowerCase();
  for (const [province, keywords] of Object.entries(provinceMap)) {
    if (
      keywords.some((kw) => {
        const needle = stripAccents(kw).toLowerCase();
        if (!needle) return false;
        // Límites de palabra: evita falsos positivos como "marcelona" -> "barcelona".
        const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(needle)}([^a-z0-9]|$)`, "i");
        return pattern.test(lower);
      })
    ) {
      return province;
    }
  }

  // Segundo intento: la tabla canónica de alias (PROVINCE_CANON). Cubre
  // topónimos que `provinceMap` no lista y que antes acababan en "Otra".
  const aliasHit = matchProvinceAlias(lower);
  if (aliasHit) return aliasHit;

  return "Otra";
}

/**
 * Busca la provincia en un texto usando la tabla canónica de alias.
 *
 * Usa limites de palabra: `includes()` a pelo daria falsos positivos (por
 * ejemplo el alias "illes" de Baleares dentro de cualquier palabra que lo
 * contenga). El texto debe venir ya normalizado (sin acentos, en minusculas).
 */
export function matchProvinceAlias(normalizedText: string): string | null {
  if (!normalizedText) return null;

  for (const { canonical, aliases } of PROVINCE_CANON) {
    for (const alias of aliases) {
      const needle = stripAccents(alias).toLowerCase().trim();
      if (!needle) continue;
      const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(needle)}([^a-z0-9]|$)`, "i");
      if (pattern.test(normalizedText)) return canonical;
    }
  }

  return null;
}

const PROVINCE_CANON: Array<{ canonical: string; aliases: string[] }> = [
  { canonical: "Araba", aliases: ["alava", "álava", "araba", "vitoria", "gasteiz"] },
  { canonical: "Albacete", aliases: ["albacete"] },
  { canonical: "Alicante", aliases: ["alicante", "alacant"] },
  { canonical: "Almería", aliases: ["almería", "almeria"] },
  { canonical: "Asturias", aliases: ["asturias"] },
  { canonical: "Ávila", aliases: ["ávila", "avila"] },
  { canonical: "Badajoz", aliases: ["badajoz"] },
  { canonical: "Baleares (Illes)", aliases: ["baleares", "baleares (illes)", "illes balears", "illes", "balears", "mallorca", "menorca", "ibiza", "palma de mallorca"] },
  { canonical: "Barcelona", aliases: ["barcelona"] },
  { canonical: "Burgos", aliases: ["burgos"] },
  { canonical: "Cáceres", aliases: ["cáceres", "caceres"] },
  { canonical: "Cádiz", aliases: ["cádiz", "cadiz"] },
  { canonical: "Cantabria", aliases: ["cantabria"] },
  { canonical: "Castellón", aliases: ["castellón", "castellon", "castelló"] },
  { canonical: "Ciudad Real", aliases: ["ciudad real"] },
  { canonical: "Córdoba", aliases: ["córdoba", "cordoba"] },
  { canonical: "A Coruña", aliases: ["coruña", "coruna", "a coruña", "la coruña", "a coruna"] },
  { canonical: "Cuenca", aliases: ["cuenca"] },
  { canonical: "Girona", aliases: ["girona", "gerona"] },
  { canonical: "Granada", aliases: ["granada"] },
  { canonical: "Guadalajara", aliases: ["guadalajara"] },
  { canonical: "Gipuzkoa", aliases: ["gipuzkoa", "guipúzcoa", "guipuzcoa"] },
  { canonical: "Huelva", aliases: ["huelva"] },
  { canonical: "Huesca", aliases: ["huesca"] },
  { canonical: "Jaén", aliases: ["jaén", "jaen"] },
  { canonical: "León", aliases: ["león", "leon"] },
  { canonical: "Lleida", aliases: ["lleida", "lérida", "lerida"] },
  { canonical: "Lugo", aliases: ["lugo"] },
  { canonical: "Madrid", aliases: ["madrid"] },
  { canonical: "Málaga", aliases: ["málaga", "malaga"] },
  { canonical: "Murcia", aliases: ["murcia"] },
  { canonical: "Navarra", aliases: ["navarra", "nafarroa"] },
  { canonical: "Ourense", aliases: ["ourense", "orense"] },
  { canonical: "Palencia", aliases: ["palencia"] },
  { canonical: "Las Palmas", aliases: ["las palmas", "gran canaria", "las palmas de gran canaria"] },
  { canonical: "Pontevedra", aliases: ["pontevedra"] },
  { canonical: "La Rioja", aliases: ["la rioja", "rioja", "logroño", "logrono"] },
  { canonical: "Salamanca", aliases: ["salamanca"] },
  { canonical: "Santa Cruz de Tenerife", aliases: ["santa cruz de tenerife", "tenerife"] },
  { canonical: "Segovia", aliases: ["segovia"] },
  { canonical: "Sevilla", aliases: ["sevilla"] },
  { canonical: "Soria", aliases: ["soria"] },
  { canonical: "Tarragona", aliases: ["tarragona"] },
  { canonical: "Teruel", aliases: ["teruel"] },
  { canonical: "Toledo", aliases: ["toledo"] },
  { canonical: "Valencia", aliases: ["valencia", "valència"] },
  { canonical: "Valladolid", aliases: ["valladolid"] },
  { canonical: "Bizkaia", aliases: ["bizkaia", "vizcaya"] },
  { canonical: "Zamora", aliases: ["zamora"] },
  { canonical: "Zaragoza", aliases: ["zaragoza"] },
  { canonical: "Ceuta", aliases: ["ceuta"] },
  { canonical: "Melilla", aliases: ["melilla"] },
];

export function normalizeProvince(value: string): string {
  if (!value) return "";
  const lower = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  for (const { canonical, aliases } of PROVINCE_CANON) {
    const canonLower = canonical.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (lower === canonLower) return canonical;
    for (const alias of aliases) {
      const a = alias.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (lower === a) return canonical;
      if (lower.includes(a)) return canonical;
    }
  }

  return value;
}

function normalizeNameKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(\d{4})\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidImageUrl(url?: string): string | undefined {
  if (!url || url.trim() === "") return undefined;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return undefined;
  return trimmed;
}

export async function importScrapedRaces(scrapedRaces: ScrapedRace[], source: string): Promise<{ imported: number; updated: number }> {
  let imported = 0;
  let updated = 0;

  const existingByUrl = new Map<string, string>();
  const existingByKey = new Map<string, { id: string; date: Date }>();

  const allExisting = await prisma.race.findMany({
    select: { id: true, url: true, name: true, date: true },
  });
  for (const race of allExisting) {
    if (race.url) existingByUrl.set(race.url, race.id);
    existingByKey.set(`${normalizeNameKey(race.name)}|${race.date.toISOString().split("T")[0]}`, {
      id: race.id,
      date: race.date,
    });
  }

  const usedUrls = new Set<string>();
  const usedSlugs = new Set<string>();

  const existingSlugs = new Set(
    (await prisma.race.findMany({ select: { slug: true } })).map((r) => r.slug)
  );

  for (const race of scrapedRaces) {
    let slug = race.name
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñü]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);

    if (existingSlugs.has(slug) || usedSlugs.has(slug)) {
      let suffix = 2;
      while (existingSlugs.has(`${slug}-${suffix}`) || usedSlugs.has(`${slug}-${suffix}`)) {
        suffix++;
      }
      slug = `${slug}-${suffix}`;
    }
    usedSlugs.add(slug);

    const dateStr = new Date(race.date).toISOString().split("T")[0];
    const nameKey = normalizeNameKey(race.name);

    let existingId: string | undefined;

    if (race.url && existingByUrl.has(race.url)) {
      existingId = existingByUrl.get(race.url);
    }

    if (!existingId) {
      const keyM = existingByKey.get(`${nameKey}|${dateStr}`);
      if (keyM) existingId = keyM.id;
    }

    const data = {
      name: race.name,
      type: race.type as "ASFALTO" | "MEDIA_MARATON" | "MARATON" | "TRAIL" | "MARCHA" | "ORIENTACION",
      distance: race.distance,
      distanceKm: parseKmFromDistance(race.distance),
      location: race.location,
      province: race.province,
      community: getAutonomousCommunity(race.province),
      city: race.city,
      date: new Date(race.date),
      time: race.time,
      description: race.description,
      url: race.url,
      image: isValidImageUrl(race.image),
      price: race.price,
      source,
      registrationUrl: race.url,
    };

    if (existingId) {
      if (usedUrls.has(existingId)) continue;
      await prisma.race.update({
        where: { id: existingId },
        data: {
          ...data,
          slug,
          endDate: race.endDate ? new Date(race.endDate) : undefined,
          latitude: race.latitude,
          longitude: race.longitude,
        },
      });
      usedUrls.add(existingId);
      updated++;
      continue;
    }

    if (race.url && usedUrls.has(race.url)) continue;

    try {
      await prisma.race.create({
        data: {
          ...data,
          slug,
          endDate: race.endDate ? new Date(race.endDate) : undefined,
          latitude: race.latitude,
          longitude: race.longitude,
        },
      });
      usedUrls.add(race.url || slug);
      imported++;
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
        const fallbackSlug = `${slug}-${Date.now()}`;
        await prisma.race.create({
          data: {
            ...data,
            slug: fallbackSlug,
            endDate: race.endDate ? new Date(race.endDate) : undefined,
            latitude: race.latitude,
            longitude: race.longitude,
          },
        });
        usedUrls.add(race.url || fallbackSlug);
        imported++;
      } else {
        throw err;
      }
    }
  }

  return { imported, updated };
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
  { key: "carreraspopulares", label: "CarrerasPopulares", scrape: scrapeFromCarrerasPopulares },
] as const;

export async function runAllScrapers(): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  for (const source of sources) {
    try {
      const scraped = await source.scrape();
      const { imported } = await importScrapedRaces(scraped as ScrapedRace[], source.key);

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
