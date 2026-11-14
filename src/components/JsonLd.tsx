import { envSiteUrl } from "@/lib/site-url";

export function OrganizationJsonLd() {
  const SITE_URL = envSiteUrl();
  const json = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "RunHub",
    alternateName: "RunHub",
    url: SITE_URL,
    description:
      "Directorio y calendario de carreras populares en toda España: running, trail, media maratón, maratón, marcha y orientación.",
    inLanguage: "es-ES",
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/icons/icon-512.png`,
      width: 512,
      height: 512,
    },
    image: `${SITE_URL}/icons/icon-512.png`,
    knowsAbout: [
      "Atletismo",
      "Trail running",
      "Carreras populares",
      "Medias maratones",
      "Maratones",
      "Marchas atléticas",
      "Orientación",
    ],
    areaServed: {
      "@type": "Country",
      name: "España",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/calendario?buscar={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

export function WebSiteJsonLd() {
  const SITE_URL = envSiteUrl();
  const json = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "RunHub",
    url: SITE_URL,
    inLanguage: "es-ES",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

/** Listado de elementos de un ItemList (usado en home y calendario). */
export function ItemListJsonLd({
  items,
  name,
}: {
  items: { name: string; url: string }[];
  name: string;
}) {
  if (items.length === 0) return null;

  const json = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: item.url,
      name: item.name,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

/**
 * Precio declarado en la ficha. Devuelve null cuando no hay un numero fiable:
 * inventar `price: "0"` hacia que Google mostrase carreras de pago como gratis.
 */
function parsePrice(price?: string | null): number | null {
  if (!price) return null;
  const normalized = price.toLowerCase().trim();
  if (/gratis|gratuit|free|0\s*€/.test(normalized)) return 0;
  const match = normalized.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

export function EventJsonLd({
  name,
  date,
  endDate,
  location,
  province,
  url,
  description,
  image,
  status,
  price,
}: {
  name: string;
  date: string;
  endDate?: string | null;
  location: string;
  province: string;
  url?: string | null;
  description?: string | null;
  image?: string | null;
  status?: string | null;
  price?: string | null;
}) {
  const SITE_URL = envSiteUrl();
  const isCancelled = status === "CANCELADA";

  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name,
    startDate: date,
    eventStatus: isCancelled
      ? "https://schema.org/EventCancelled"
      : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: location,
      address: {
        "@type": "PostalAddress",
        addressLocality: location,
        addressRegion: province,
        addressCountry: "ES",
      },
    },
    sport: "Running",
    organizer: { "@id": `${SITE_URL}/#organization` },
  };

  if (endDate) json.endDate = endDate;

  const priceValue = parsePrice(price);
  const isOpen = status === "INSCRIPCIONES_ABIERTAS";
  const isSoldOut = status === "COMPLETADA" || isCancelled;

  if (url) json.url = url;

  // Solo se declara oferta si hay precio real o la inscripcion esta abierta.
  // Si no, es preferible no emitir `offers` a emitir datos falsos.
  if (url && (priceValue !== null || isOpen)) {
    const offer: Record<string, unknown> = {
      "@type": "Offer",
      url,
      availability: isSoldOut
        ? "https://schema.org/SoldOut"
        : isOpen
          ? "https://schema.org/InStock"
          : "https://schema.org/PreOrder",
      validFrom: new Date().toISOString(),
    };
    if (priceValue !== null) {
      offer.price = String(priceValue);
      offer.priceCurrency = "EUR";
    }
    json.offers = offer;
  }

  if (description) json.description = description;
  if (image) json.image = image;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

export function BlogPostJsonLd({
  title,
  description,
  datePublished,
  author,
  image,
}: {
  title: string;
  description?: string | null;
  datePublished: Date;
  author?: string | null;
  image?: string | null;
}) {
  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    datePublished: datePublished.toISOString(),
    author: {
      "@type": "Person",
      name: author || "RunHub",
    },
  };

  if (description) json.description = description;
  if (image) json.image = image;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
