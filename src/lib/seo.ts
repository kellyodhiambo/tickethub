export const SITE_URL = "https://tickets.tribedala.com";
export const SITE_NAME = "TicketHub by Tribedala";

type SeoOptions = {
  title: string;
  description: string;
  path: string;
  image?: string;
  robots?: string;
  type?: "website" | "article" | "event";
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
};

function setMeta(attribute: "name" | "property", key: string, value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = value;
}

export function setPageSeo({
  title,
  description,
  path,
  image = `${SITE_URL}/og-image.jpg`,
  robots = "index,follow",
  type = "website",
  structuredData,
}: SeoOptions) {
  const canonical = new URL(path, SITE_URL).href;
  document.title = title;

  setMeta("name", "description", description);
  setMeta("name", "robots", robots);
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", description);
  setMeta("name", "twitter:image", image);
  setMeta("property", "og:type", type);
  setMeta("property", "og:site_name", SITE_NAME);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:url", canonical);
  setMeta("property", "og:image", image);

  let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement("link");
    canonicalLink.rel = "canonical";
    document.head.append(canonicalLink);
  }
  canonicalLink.href = canonical;

  let schema = document.head.querySelector<HTMLScriptElement>('script[data-seo-schema="true"]');
  if (!schema) {
    schema = document.createElement("script");
    schema.type = "application/ld+json";
    schema.dataset.seoSchema = "true";
    document.head.append(schema);
  }
  schema.textContent = JSON.stringify(
    structuredData ?? {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      url: canonical,
    }
  );
}

export const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TicketHub by Tribedala",
  url: SITE_URL,
  description: "Discover events and book tickets across Kenya with TicketHub by Tribedala.",
  areaServed: { "@type": "Country", name: "Kenya" },
};