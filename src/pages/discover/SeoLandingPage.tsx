import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import EventCard from "@/components/feature/EventCard";
import PublicLayout from "@/components/feature/PublicLayout";
import { DataError, DataLoading } from "@/components/feature/DataStates";
import { eventCategories } from "@/mocks/events";
import counties from "@/data/kenya-counties.json";
import { useEvents } from "@/hooks/useEvents";
import { SITE_URL, setPageSeo } from "@/lib/seo";

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function CountyDirectoryPage() {
  useEffect(() => {
    setPageSeo({
      title: "Events Across Kenya: Browse All 47 Counties | TicketHub",
      description:
        "Explore upcoming concerts, festivals, comedy, sports and cultural events in every county in Kenya. Find local events and book tickets with TicketHub.",
      path: "/events-in-kenya",
      structuredData: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Events across Kenya by county",
        url: `${SITE_URL}/events-in-kenya`,
        about: { "@type": "Country", name: "Kenya" },
      },
    });
  }, []);

  return (
    <PublicLayout>
      <main className="mx-auto w-full max-w-[1400px] px-4 py-10 md:px-6 md:py-14">
        <p className="text-xs font-bold uppercase text-primary-700">Across Kenya</p>
        <h1 className="mt-2 text-3xl font-extrabold text-foreground-950">Find events in your county</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-700">
          Browse TicketHub listings by county. See upcoming events near you, compare ticket options and book online.
          New listings are added as Kenyan organizers publish their events.
        </p>
        <nav aria-label="Kenya counties" className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {counties.map((county) => (
            <Link
              key={county.slug}
              to={`/events-in/${county.slug}`}
              className="rounded-md border border-background-200 px-3 py-3 text-sm font-semibold text-foreground-800 hover:border-primary-500 hover:text-primary-700"
            >
              Events in {county.name}
            </Link>
          ))}
        </nav>
      </main>
    </PublicLayout>
  );
}

export default function SeoLandingPage() {
  const { countySlug, categorySlug } = useParams();
  const { events, loading, error, reload } = useEvents();
  const county = counties.find((item) => item.slug === countySlug);
  const category = eventCategories.find((item) => slugify(item.label) === categorySlug);
  const titlePlace = county?.name ?? category?.label ?? "Events";
  const filtered = events.filter((event) => {
    if (county && slugify(event.county || event.city) !== county.slug && slugify(event.city) !== county.slug) return false;
    if (category && event.category.toLowerCase() !== category.label.toLowerCase()) return false;
    return true;
  });
  const path = county ? `/events-in/${county.slug}` : `/events/category/${categorySlug}`;

  useEffect(() => {
    if (!county && !category) return;
    const countText = filtered.length === 1 ? "1 upcoming event" : `${filtered.length} upcoming events`;
    const description = county
      ? `${countText} in ${county.name} County, Kenya. Explore upcoming concerts, festivals, comedy, sports and cultural events in ${county.name}; compare prices and book tickets on TicketHub.`
      : `${countText} in the ${category?.label.toLowerCase()} category across Kenya. Find dates, venues and ticket prices and book securely on TicketHub.`;
    setPageSeo({
      title: `${category ? `${category.label} ` : "Events "}in ${county?.name ?? "Kenya"} | TicketHub`,
      description,
      path,
      robots: filtered.length ? "index,follow" : "noindex,follow",
      structuredData: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${category ? `${category.label} ` : "Events "}in ${titlePlace}`,
        description,
        url: new URL(path, SITE_URL).href,
        numberOfItems: filtered.length,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: filtered.slice(0, 50).map((event, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${SITE_URL}/events/${event.slug}`,
            name: event.title,
          })),
        },
      },
    });
  }, [county, category, filtered, path, titlePlace]);

  if (!county && !category) {
    return (
      <PublicLayout>
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-3xl font-bold">Location or category not found</h1>
          <Link className="mt-5 inline-block text-primary-700" to="/events-in-kenya">Browse events by county</Link>
        </main>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <main className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-6 md:py-12">
        <nav aria-label="Breadcrumb" className="text-xs text-foreground-500">
          <Link to="/">Home</Link> / <Link to="/discover">Events</Link> / {titlePlace}
        </nav>
        <p className="mt-6 text-xs font-bold uppercase text-primary-700">Kenya event guide</p>
        <h1 className="mt-2 text-3xl font-extrabold text-foreground-950">
          {category ? `${category.label} events` : "Events"} in {county?.name ?? "Kenya"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground-700">
          {county
            ? `Discover upcoming events in ${county.name} County, Kenya. Browse local listings for concerts, festivals, comedy, sports and cultural experiences, then compare ticket prices and book online.`
            : `Browse upcoming ${category?.label.toLowerCase()} events throughout Kenya. Find event dates, venues, organizers and ticket prices in one place.`}
        </p>
        <div className="mt-8">
          {loading ? <DataLoading /> : error ? <DataError message={error} onRetry={reload} /> : filtered.length ? (
            <>
              <p className="mb-4 text-sm text-foreground-600">{filtered.length} upcoming {filtered.length === 1 ? "event" : "events"}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((event) => <EventCard key={event.id} event={event} />)}
              </div>
            </>
          ) : (
            <section className="border-y border-background-200 py-8">
              <h2 className="text-xl font-bold text-foreground-950">No upcoming listings yet</h2>
              <p className="mt-2 max-w-2xl text-sm text-foreground-700">
                There are no published events in this selection right now. Check back for new listings or browse all upcoming events across Kenya.
              </p>
              <Link to="/discover" className="mt-4 inline-flex font-semibold text-primary-700">Browse all Kenya events</Link>
            </section>
          )}
        </div>
      </main>
    </PublicLayout>
  );
}