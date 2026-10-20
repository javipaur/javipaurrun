import { siteUrl } from "@/lib/site-url-server";

export async function OrganizationJsonLd() {
  const SITE_URL = await siteUrl();
  const json = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "JavipaurRun",
    alternateName: "Javipaur Run",
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

export async function WebSiteJsonLd() {
  const SITE_URL = await siteUrl();
  const json = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "JavipaurRun",
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

export async function EventJsonLd({
  name,
  date,
  location,
  province,
  url,
  description,
  image,
}: {
  name: string;
  date: string;
  location: string;
  province: string;
  url?: string | null;
  description?: string | null;
  image?: string | null;
}) {
  const SITE_URL = await siteUrl();
  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name,
    startDate: date,
    eventStatus: "https://schema.org/EventScheduled",
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

  if (url) {
    json.url = url;
    json.offers = {
      "@type": "Offer",
      url,
      availability: "https://schema.org/InStock",
      price: "0",
      priceCurrency: "EUR",
      validFrom: date,
    };
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
      name: author || "JavipaurRun",
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
