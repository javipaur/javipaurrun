export function OrganizationJsonLd() {
  const json = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: "JavipaurRun",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://javipaurrun.com",
    description:
      "Calendario de carreras populares en Euskadi, Cantabria, Burgos, La Rioja, Navarra y Zamora",
    sport: "Running",
    knowsAbout: ["Atletismo", "Trail running", "Carreras populares", "Maratones"],
    areaServed: [
      "Euskadi",
      "Cantabria",
      "Burgos",
      "La Rioja",
      "Navarra",
      "Zamora",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

export function WebSiteJsonLd() {
  const json = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "JavipaurRun",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://javipaurrun.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${
          process.env.NEXT_PUBLIC_APP_URL || "https://javipaurrun.com"
        }/calendario?buscar={search_term_string}`,
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

export function EventJsonLd({
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
  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name,
    startDate: date,
    location: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: location,
        addressRegion: province,
        addressCountry: "ES",
      },
    },
    sport: "Running",
  };

  if (url) json.url = url;
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
