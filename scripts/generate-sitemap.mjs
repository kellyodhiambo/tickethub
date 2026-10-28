import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(root, "dist");
const siteUrl = "https://tickets.tribedala.com";
const sitemapLimit = 45_000;
const today = new Date().toISOString().slice(0, 10);
const sharedEnv = loadEnv("production", path.dirname(root), "VITE_PUBLIC_");
const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL ?? sharedEnv.VITE_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY ?? sharedEnv.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Set VITE_PUBLIC_SUPABASE_URL and VITE_PUBLIC_SUPABASE_ANON_KEY in Vercel to build the event sitemap.");
}

const counties = JSON.parse(await readFile(path.join(root, "src/data/kenya-counties.json"), "utf8"));
const indexTemplate = await readFile(path.join(outputDirectory, "index.html"), "utf8");
const query = new URLSearchParams({
  select: "slug,title,description,cover_image,date,end_date,start_time,end_time,venue,address,city,county,category,organizer_name,price_from,is_free,sold_out,ticket_tiers,updated_at,status",
  status: "eq.upcoming",
  date: `gte.${today}`,
  slug: "not.is.null",
  order: "date.asc",
  limit: String(sitemapLimit),
});

const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/events?${query}`, {
  headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
});
if (!response.ok) {
  throw new Error(`Could not load upcoming events for SEO pages: ${response.status} ${response.statusText}`);
}

const events = (await response.json()).filter((event) =>
  event.slug &&
  /^[a-z0-9][a-z0-9-]*$/i.test(event.slug) &&
  !/^(test|demo)(-|$)/i.test(event.slug) &&
  !/\b(test event|demo event)\b/i.test(event.title ?? "")
);

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const canonicalUrl = (route) => new URL(route, siteUrl).href;
const urls = new Map();
const addUrl = (route, lastmod = today) => urls.set(canonicalUrl(route), lastmod?.slice(0, 10) || today);

function metadataHtml({ title, description, route, image, schema, robots = "index,follow" }) {
  const canonical = canonicalUrl(route);
  const meta = [
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="robots" content="${escapeHtml(robots)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : "",
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="TicketHub by Tribedala" />',
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : "",
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<script type="application/ld+json">${JSON.stringify(schema).replaceAll("<", "\\u003c")}</script>`,
  ].filter(Boolean).join("\n    ");

  return indexTemplate
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description"[^>]*\/>/, "")
    .replace("</head>", `    ${meta}\n  </head>`);
}

async function writeSnapshot(route, title, description, content, schema, image, robots = "index,follow") {
  const relativePath = route === "/" ? "index.html" : `${route.slice(1)}.html`;
  const destination = path.join(outputDirectory, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  const html = metadataHtml({ title, description, route, image, schema, robots })
    // Keep SEO fallback content available when JavaScript is disabled, but
    // never put it in React's mount node: createRoot replaces that node's
    // contents after the browser has already painted them.
    .replace('<div id="root"></div>', `<div id="root"></div><noscript>${content}</noscript>`);
  await writeFile(destination, html, "utf8");
}

for (const route of ["/", "/discover", "/how-it-works", "/events-in-kenya"]) addUrl(route);

const countyEvents = new Map();
const categoryEvents = new Map();
for (const event of events) {
  const route = `/events/${encodeURIComponent(event.slug)}`;
  const eventUrl = canonicalUrl(route);
  const tiers = Array.isArray(event.ticket_tiers) ? event.ticket_tiers : [];
  const price = event.price_from ?? Math.min(...tiers.map((tier) => Number(tier.price) || 0), 0);
  const description = String(event.description ?? `Book tickets for ${event.title} in ${event.city}, Kenya.`).replace(/\s+/g, " ").trim().slice(0, 250);
  const image = event.cover_image || undefined;
  const endDate = event.end_date ? new Date(event.end_date) : null;
  const structuredEvent = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description,
    url: eventUrl,
    image: image ? [image] : undefined,
    startDate: `${event.date}T${event.start_time || "18:00"}:00+03:00`,
    endDate: endDate && !Number.isNaN(endDate.getTime()) ? endDate.toISOString() : undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.address,
        addressLocality: event.city,
        addressRegion: event.county,
        addressCountry: "KE",
      },
    },
    organizer: event.organizer_name ? { "@type": "Organization", name: event.organizer_name, url: siteUrl } : undefined,
    offers: tiers.map((tier) => ({
      "@type": "Offer",
      name: tier.name,
      price: Number(tier.price) || 0,
      priceCurrency: "KES",
      availability: Number(tier.quantity) > Number(tier.sold ?? 0) ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      url: `${eventUrl}#tickets`,
    })),
  };
  const eventTitle = `${event.title} Tickets in ${event.city} | TicketHub`;
  const eventContent = `<main><nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/discover">Events</a> / ${escapeHtml(event.title)}</nav><article><h1>${escapeHtml(event.title)} tickets in ${escapeHtml(event.city)}, Kenya</h1><p>${escapeHtml(event.category)} · ${escapeHtml(event.date)} · ${escapeHtml(event.venue)}, ${escapeHtml(event.city)}</p>${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(event.title)} at ${escapeHtml(event.venue)}, ${escapeHtml(event.city)}" width="1200" height="800" />` : ""}<p>${escapeHtml(description)}</p><p>${event.is_free || price === 0 ? "Free entry" : `Tickets from KSh ${Number(price).toLocaleString("en-KE")}`}${event.sold_out ? " · Sold out" : " · Tickets available"}</p><a href="/discover">Explore more events in Kenya</a></article></main>`;
  await writeSnapshot(route, eventTitle, `${description.slice(0, 130)} Book ${event.title} tickets in ${event.city}, Kenya on TicketHub.`, eventContent, structuredEvent, image);
  addUrl(route, event.updated_at);

  const county = counties.find((item) => item.name.toLowerCase() === String(event.county ?? "").toLowerCase());
  if (county) {
    const list = countyEvents.get(county.slug) ?? [];
    list.push(event);
    countyEvents.set(county.slug, list);
  }
  const categorySlug = String(event.category ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (categorySlug) {
    const list = categoryEvents.get(categorySlug) ?? [];
    list.push(event);
    categoryEvents.set(categorySlug, list);
  }
}

function eventListMarkup(items) {
  return `<ul>${items.map((event) => `<li><a href="/events/${encodeURIComponent(event.slug)}">${escapeHtml(event.title)}</a> — ${escapeHtml(event.date)} · ${escapeHtml(event.venue)}, ${escapeHtml(event.city)}</li>`).join("")}</ul>`;
}

for (const county of counties) {
  const countySlug = county.slug;
  const items = countyEvents.get(countySlug) ?? [];
  const route = `/events-in/${countySlug}`;
  const title = `Events in ${county.name} County, Kenya | TicketHub`;
  const description = `Find upcoming concerts, festivals, comedy, sports and cultural events in ${county.name} County, Kenya. Compare venues and ticket prices and book online with TicketHub.`;
  const content = `<main><nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/events-in-kenya">Kenya events</a> / ${escapeHtml(county.name)}</nav><h1>Upcoming events in ${escapeHtml(county.name)} County</h1><p>${escapeHtml(description)}</p><p>${items.length} upcoming ${items.length === 1 ? "event" : "events"}</p>${eventListMarkup(items)}<a href="/events-in-kenya">Browse all 47 counties</a></main>`;
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: title, description, url: canonicalUrl(route), about: { "@type": "AdministrativeArea", name: `${county.name} County, Kenya` }, mainEntity: { "@type": "ItemList", itemListElement: items.map((event, index) => ({ "@type": "ListItem", position: index + 1, url: canonicalUrl(`/events/${event.slug}`), name: event.title })) } };
  await writeSnapshot(route, title, description, content, schema, undefined, items.length ? "index,follow" : "noindex,follow");
  if (items.length) addUrl(route, items.map((event) => event.updated_at).filter(Boolean).sort().at(-1));
}

for (const [categorySlug, items] of categoryEvents) {
  const categoryName = items[0].category;
  const route = `/events/category/${categorySlug}`;
  const title = `${categoryName} Events in Kenya | TicketHub`;
  const description = `Discover upcoming ${categoryName.toLowerCase()} events across Kenya. Browse dates, venues and ticket prices and book securely with TicketHub.`;
  const content = `<main><nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/discover">Events</a> / ${escapeHtml(categoryName)}</nav><h1>${escapeHtml(categoryName)} events in Kenya</h1><p>${escapeHtml(description)}</p><p>${items.length} upcoming ${items.length === 1 ? "event" : "events"}</p>${eventListMarkup(items)}<a href="/events-in-kenya">Browse events by county</a></main>`;
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: title, description, url: canonicalUrl(route), mainEntity: { "@type": "ItemList", itemListElement: items.map((event, index) => ({ "@type": "ListItem", position: index + 1, url: canonicalUrl(`/events/${event.slug}`), name: event.title })) } };
  await writeSnapshot(route, title, description, content, schema);
  addUrl(route, items.map((event) => event.updated_at).filter(Boolean).sort().at(-1));
}

const directoryRoute = "/events-in-kenya";
const countyLinks = counties.map((county) => `<li><a href="/events-in/${county.slug}">Events in ${escapeHtml(county.name)}</a></li>`).join("");
const directoryContent = `<main><h1>Events across Kenya by county</h1><p>Explore upcoming events across all 47 counties. County pages show current listings when available.</p><ul>${countyLinks}</ul></main>`;
const directoryDescription = "Browse event listings by county across Kenya. Discover concerts, festivals, comedy and cultural events near you with TicketHub.";
const directorySchema = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Events across Kenya by county", description: directoryDescription, url: canonicalUrl(directoryRoute), about: { "@type": "Country", name: "Kenya" } };
await writeSnapshot(directoryRoute, "Events Across Kenya by County | TicketHub", directoryDescription, directoryContent, directorySchema);

const upcomingEventLinks = events.slice(0, 30).map((event) => `<li><a href="/events/${encodeURIComponent(event.slug)}">${escapeHtml(event.title)} tickets</a> — ${escapeHtml(event.city)}, ${escapeHtml(event.county)} County · ${escapeHtml(event.date)}</li>`).join("");
const homepageDescription = "Discover concerts, festivals, comedy, sports and cultural events across Kenya. Compare ticket prices and book securely online with TicketHub by Tribedala.";
const homepageContent = `<main><h1>Discover events and book tickets across Kenya</h1><p>${escapeHtml(homepageDescription)}</p><p>Find live events in Nairobi, Mombasa, Kisumu, Nakuru, Eldoret and counties across the country.</p><p><a href="/discover">Browse all upcoming events</a> · <a href="/events-in-kenya">Explore events by county</a></p><h2>Upcoming events in Kenya</h2><ul>${upcomingEventLinks}</ul></main>`;
const homepageSchema = [
  { "@context": "https://schema.org", "@type": "Organization", name: "TicketHub by Tribedala", url: siteUrl, description: homepageDescription, areaServed: { "@type": "Country", name: "Kenya" } },
  { "@context": "https://schema.org", "@type": "WebSite", name: "TicketHub by Tribedala", url: siteUrl, potentialAction: { "@type": "SearchAction", target: `${siteUrl}/discover?q={search_term_string}`, "query-input": "required name=search_term_string" } },
];
await writeSnapshot("/", "Kenya Events, Concerts & Festival Tickets | TicketHub", homepageDescription, homepageContent, homepageSchema);

const discoverDescription = "Browse upcoming concerts, festivals, comedy, sports and cultural events across Kenya. Search event listings by city, category, date and price.";
const discoverContent = `<main><h1>Upcoming events across Kenya</h1><p>${escapeHtml(discoverDescription)}</p><ul>${upcomingEventLinks}</ul><p><a href="/events-in-kenya">Find events by county</a></p></main>`;
await writeSnapshot("/discover", "Upcoming Events in Kenya | Discover on TicketHub", discoverDescription, discoverContent, { "@context": "https://schema.org", "@type": "CollectionPage", name: "Upcoming events in Kenya", description: discoverDescription, url: canonicalUrl("/discover"), mainEntity: { "@type": "ItemList", itemListElement: events.slice(0, 30).map((event, index) => ({ "@type": "ListItem", position: index + 1, url: canonicalUrl(`/events/${event.slug}`), name: event.title })) } });

const howItWorksDescription = "Learn how to discover Kenyan events, book tickets online, pay securely and enter with your digital ticket.";
const howItWorksContent = `<main><h1>How event ticket booking works</h1><p>${escapeHtml(howItWorksDescription)}</p><ol><li>Find an event by city, county or category.</li><li>Choose an available ticket type and quantity.</li><li>Complete checkout and receive your ticket details.</li><li>Show your ticket QR code at the event entrance.</li></ol><p><a href="/discover">Find events in Kenya</a> · <a href="/events-in-kenya">Browse all 47 counties</a></p></main>`;
await writeSnapshot("/how-it-works", "How to Book Event Tickets in Kenya | TicketHub", howItWorksDescription, howItWorksContent, { "@context": "https://schema.org", "@type": "HowTo", name: "How to book event tickets in Kenya", description: howItWorksDescription, step: ["Find an event", "Choose tickets", "Complete checkout", "Show your QR ticket at the gate"].map((name, index) => ({ "@type": "HowToStep", position: index + 1, name })) });

const sitemapEntries = [...urls.entries()];
const sitemapChunks = [];
for (let index = 0; index < sitemapEntries.length; index += sitemapLimit) sitemapChunks.push(sitemapEntries.slice(index, index + sitemapLimit));
for (const filename of await readdir(outputDirectory)) {
  if (/^sitemap(?:-\d+)?\.xml$/.test(filename)) await rm(path.join(outputDirectory, filename));
}

const sitemapFiles = [];
for (const [index, chunk] of sitemapChunks.entries()) {
  const filename = sitemapChunks.length === 1 ? "sitemap.xml" : `sitemap-${index + 1}.xml`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${chunk.map(([loc, lastmod]) => `  <url><loc>${escapeXml(loc)}</loc><lastmod>${lastmod}</lastmod></url>`).join("\n")}\n</urlset>\n`;
  await writeFile(path.join(outputDirectory, filename), xml, "utf8");
  sitemapFiles.push(filename);
}

if (sitemapFiles.length > 1) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapFiles.map((filename) => `  <sitemap><loc>${siteUrl}/${filename}</loc><lastmod>${today}</lastmod></sitemap>`).join("\n")}\n</sitemapindex>\n`;
  await writeFile(path.join(outputDirectory, "sitemap.xml"), xml, "utf8");
}

