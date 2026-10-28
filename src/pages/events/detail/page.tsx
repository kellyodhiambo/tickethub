import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PublicLayout from "@/components/feature/PublicLayout";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button } from "@/components/base/ui";
import EventCard from "@/components/feature/EventCard";
import StayReminder from "@/components/feature/StayReminder";
import { cn, formatEventDate, formatKsh } from "@/lib/helpers";
import { tierLegend, tierTheme } from "@/lib/tierTheme";
import { useEvent, useEvents } from "@/hooks/useEvents";
import { DataError, DataLoading } from "@/components/feature/DataStates";
import { SITE_URL, setPageSeo } from "@/lib/seo";
import { useApp } from "@/store/AppStore";

const shortDate = (iso: string) =>
  new Date(`${iso}T09:00:00`).toLocaleDateString("en-KE", { day: "numeric", month: "short" });

export default function EventDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { pushToast, favorites, toggleFavorite } = useApp();
  const { event, loading, error, reload } = useEvent(slug);
  const { events: availableEvents } = useEvents();
  const [selectedTier, setSelectedTier] = useState(event?.tiers[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!event) return;
    const path = `/events/${event.slug}`;
    setPageSeo({
      title: `${event.title} Tickets in ${event.city} | TicketHub`,
      description: `${event.description.slice(0, 130).trim()} Book ${event.title} tickets in ${event.city}, Kenya from KSh ${event.priceFrom.toLocaleString("en-KE")} on TicketHub.`,
      path,
      image: event.image || undefined,
      type: "event",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Event",
          name: event.title,
          description: event.description,
          url: new URL(path, SITE_URL).href,
          image: event.image ? [event.image] : undefined,
          startDate: `${event.date}T${event.startTime || "18:00"}:00+03:00`,
          endDate: `${event.endDate}T${event.endTime || event.startTime || "23:00"}:00+03:00`,
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
          organizer: { "@type": "Organization", name: event.organizerName, url: SITE_URL },
          offers: event.tiers.map((tier) => ({
            "@type": "Offer",
            name: tier.name,
            price: tier.price,
            priceCurrency: "KES",
            availability:
              tier.quantity > tier.sold
                ? "https://schema.org/InStock"
                : "https://schema.org/SoldOut",
            url: `${new URL(path, SITE_URL).href}#tickets`,
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Events", item: `${SITE_URL}/discover` },
            { "@type": "ListItem", position: 3, name: event.title, item: new URL(path, SITE_URL).href },
          ],
        },
      ],
    });
  }, [event]);

  const similar = useMemo(
    () => availableEvents.filter((item) => item.id !== event?.id && item.category === event?.category).slice(0, 3),
    [availableEvents, event]
  );

  if (loading) return <PublicLayout><DataLoading label="Loading event" /></PublicLayout>;
  if (error) return <PublicLayout><DataError message={error} onRetry={reload} /></PublicLayout>;

  if (!event) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-2xl font-bold">Event not found</h1>
          <p className="mt-2 text-sm text-foreground-600">
            This event may have been cancelled or the link is incorrect.
          </p>
          <Link to="/discover" className="mt-5 inline-block text-sm font-semibold text-primary-700">
            Browse all events
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const tier = event.tiers.find((item) => item.id === selectedTier) ?? event.tiers[0];
  const remaining = tier.quantity - tier.sold;
  const isSoldOut = remaining <= 0 || event.soldOut;
  const total = tier.price * quantity;
  const isFavorite = favorites.includes(event.id);

  const goToCheckout = () => {
    if (isSoldOut) {
      pushToast("This category is sold out — join the waitlist instead.", "warning");
      return;
    }
    const params = new URLSearchParams({ tier: tier.id, qty: String(quantity) });
    if (tier.price === 0) params.set("free", "1");
    navigate(`/checkout/${event.slug}?${params.toString()}`);
  };

  return (
    <PublicLayout>
      <div className="border-b border-background-200 bg-background-50">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-3 text-[11px] text-foreground-500 md:px-6">
          <Link to="/" className="cursor-pointer hover:text-foreground-900">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link to="/discover" className="cursor-pointer hover:text-foreground-900">
            Discover
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground-800">{event.title}</span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-4 pt-4 md:px-6 md:pt-6">
        <div className="grid gap-2 md:grid-cols-[2fr_1fr]">
          <div className="relative h-[240px] w-full overflow-hidden rounded-card md:h-[400px]">
            <img
              src={event.image}
              alt={`${event.title} at ${event.venue}`}
              title={`${event.title} tickets`}
              className="h-full w-full object-cover object-top"
            />
            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-foreground-950/75 px-2.5 py-1 text-[10px] font-label font-bold uppercase tracking-wide text-background-50 backdrop-blur">
                {event.category}
              </span>
              {event.verified && (
                <span className="flex items-center gap-1 rounded-full bg-accent-600/90 px-2.5 py-1 text-[10px] font-label font-bold uppercase tracking-wide text-background-50 backdrop-blur">
                  <i className="ri-verified-badge-fill" /> Verified organizer
                </span>
              )}
            </div>
          </div>
          <div className="hidden flex-col gap-2 md:flex">
            <div className="h-[196px] w-full overflow-hidden rounded-card">
              <img
                src={event.gallery[0] ?? event.image}
                alt={`${event.title} atmosphere`}
                title={`${event.title} gallery`}
                className="h-full w-full object-cover object-top"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between rounded-card bg-foreground-950 p-4">
              <div>
                <p className="text-[10px] font-label font-bold uppercase tracking-wider text-background-300">
                  Entry window
                </p>
                <p className="mt-1 text-sm font-semibold text-background-50">
                  {event.startTime} — {event.endTime}
                </p>
              </div>
              <div className="mt-3 space-y-1.5 text-[11px] text-background-200">
                <p className="flex items-start gap-1.5">
                  <i className="ri-shield-check-line mt-0.5 text-accent-400" /> {event.requirements}
                </p>
                <p className="flex items-start gap-1.5">
                  <i className="ri-shield-user-line mt-0.5 text-primary-400" /> {event.ageLimit}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1400px] gap-8 px-4 py-6 md:px-6 lg:grid-cols-[1.6fr_1fr] lg:py-8">
        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-[1.03] text-foreground-950 md:text-5xl">{event.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-foreground-700">
            <span className="flex items-center gap-1.5 font-semibold">
              <i className="ri-calendar-event-line text-primary-600" />
              {formatEventDate(event.date)}
              {event.endDate !== event.date && ` – ${formatEventDate(event.endDate)}`}
            </span>
            <span className="flex items-center gap-1.5">
              <i className="ri-time-line text-primary-600" />
              {event.startTime} — {event.endTime}
            </span>
            <span className="flex items-center gap-1.5">
              <i className="ri-map-pin-line text-primary-600" />
              {event.venue}, {event.city}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant={isFavorite ? "primary" : "outline"}
              size="sm"
              onClick={() => {
                toggleFavorite(event.id);
                pushToast(isFavorite ? "Removed from favorites" : "Saved to favorites", "info");
              }}
            >
              <i className={isFavorite ? "ri-heart-3-fill" : "ri-heart-3-line"} />
              {isFavorite ? "Saved" : "Save event"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                pushToast("Event link copied to clipboard", "info");
              }}
            >
              <i className="ri-share-line" /> Share
            </Button>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue}, ${event.city}, Kenya`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 cursor-pointer items-center gap-2 whitespace-nowrap rounded-btn border border-background-300 px-3.5 text-xs font-semibold text-foreground-800 hover:bg-background-100"
            >
              <i className="ri-direction-line" /> Directions
            </a>
          </div>

          <div className="mt-7">
            <h2 className="text-base font-bold text-foreground-950">About this event</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground-700">{event.description}</p>
          </div>

          <div className="mt-7 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold text-foreground-950">Line-up</h3>
              <ul className="mt-2 space-y-2">
                {event.lineup.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-center justify-between gap-2 rounded-md border border-background-200 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground-950">{item.name}</p>
                      <p className="text-[10px] text-foreground-500">{item.role}</p>
                    </div>
                    <span className="flex-none font-num text-[11px] font-semibold text-primary-700">{item.time}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground-950">Schedule</h3>
              <ul className="mt-2 space-y-2">
                {event.schedule.map((item) => (
                  <li key={item.label} className="flex gap-3 border-l-2 border-background-200 pl-3">
                    <span className="w-10 flex-none font-num text-[11px] font-bold text-foreground-900">{item.time}</span>
                    <span className="text-[11px] leading-relaxed text-foreground-600">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-7 rounded-card border border-background-200 bg-background-100 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-foreground-950 text-xs font-bold text-background-50">
                {event.organizerName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-foreground-950">{event.organizerName}</p>
                  {event.verified && <i className="ri-verified-badge-fill text-sm text-accent-600" />}
                </div>
                <p className="mt-0.5 text-[11px] text-foreground-500">
                  {event.city} · Event organizer
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7">
            <h3 className="text-sm font-bold text-foreground-950">Policies and entry rules</h3>
            <div className="mt-2 space-y-2">
              {event.policies.map((policy) => (
                <p key={policy} className="flex items-start gap-2 text-xs leading-relaxed text-foreground-600">
                  <i className="ri-information-line mt-0.5 text-foreground-400" />
                  {policy}
                </p>
              ))}
              <p className="flex items-start gap-2 rounded-md bg-primary-50 px-3 py-2.5 text-xs leading-relaxed text-primary-900">
                <i className="ri-refund-2-line mt-0.5" />
                {event.refundPolicy}
              </p>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-[88px] lg:self-start">
          <div className="rounded-card border border-background-200 bg-background-50 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground-950">Choose your ticket</h2>
              <Badge tone={event.soldOut ? "danger" : "success"} dot>
                {event.soldOut ? "Sold out" : "On sale"}
              </Badge>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {tierLegend.map((legend) => (
                <span
                  key={legend.label}
                  className="flex items-center gap-1 text-[9px] font-label font-semibold uppercase tracking-wide text-foreground-500"
                >
                  <span className={cn("tier-dot h-1.5 w-1.5 rounded-full", legend.root)} />
                  {legend.label}
                </span>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              {event.tiers.map((item) => {
                const left = item.quantity - item.sold;
                const soldOut = left <= 0 || event.soldOut;
                const active = item.id === tier.id;
                const { root } = tierTheme(item.name);
                return (
                  <button
                    key={item.id}
                    disabled={soldOut}
                    onClick={() => {
                      setSelectedTier(item.id);
                      setQuantity(1);
                    }}
                    className={cn(
                      "tier-card group relative w-full cursor-pointer overflow-hidden rounded-md border p-3 pl-4 text-left transition-colors",
                      root,
                      active
                        ? "tier-active"
                        : "border-background-200 hover:border-foreground-400 hover:bg-background-100",
                      soldOut && "cursor-not-allowed opacity-60"
                    )}
                  >
                    <span className="tier-rail absolute left-0 top-0 h-full w-[3px]" />
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-xs font-bold">
                          <span className="tier-dot h-1.5 w-1.5 rounded-full" />
                          <span className="tier-name">{item.name}</span>
                        </p>
                        <p className="mt-0.5 text-[10px] leading-relaxed text-foreground-600">{item.description}</p>
                      </div>
                      <div className="flex-none text-right">
                        <p className="font-num text-sm font-bold text-foreground-950">
                          {item.price === 0 ? "Free" : formatKsh(item.price)}
                        </p>
                        <p className="text-[10px] text-foreground-500">{soldOut ? "Sold out" : `${left} left`}</p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background-200">
                      <div
                        className={cn("h-full rounded-full", soldOut ? "bg-foreground-400" : "tier-bar")}
                        style={{ width: `${Math.min(100, Math.max(0, (item.sold / item.quantity) * 100))}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-md bg-background-100 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-foreground-700">Quantity</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-background-300 bg-background-50 text-foreground-800 disabled:opacity-40"
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <i className="ri-subtract-line text-xs" />
                  </button>
                  <span className="w-6 text-center font-num text-sm font-bold text-foreground-950">{quantity}</span>
                  <button
                    onClick={() => setQuantity((value) => Math.min(tier.maxPerOrder, remaining || 1, value + 1))}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-background-300 bg-background-50 text-foreground-800 disabled:opacity-40"
                    disabled={quantity >= Math.min(tier.maxPerOrder, remaining || 1)}
                    aria-label="Increase quantity"
                  >
                    <i className="ri-add-line text-xs" />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-[10px] text-foreground-500">
                Max {tier.maxPerOrder} per order · sales close {shortDate(tier.salesEnd)}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-background-200 pt-3">
              <span className="text-xs text-foreground-600">Subtotal</span>
              <span className="font-num text-lg font-extrabold text-foreground-950">
                {total === 0 ? "Free" : formatKsh(total)}
              </span>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-foreground-500">
              A service fee is calculated at checkout and shown before you pay. No hidden charges.
            </p>

            <Button block className="mt-3" size="lg" onClick={goToCheckout} disabled={isSoldOut}>
              {isSoldOut ? "Sold out — join waitlist" : total === 0 ? "Register free" : "Continue to checkout"}
            </Button>

            {isSoldOut && (
              <div className="mt-3 rounded-md border border-primary-200 bg-primary-50 p-3">
                <p className="text-[11px] font-semibold text-primary-900">This event is sold out</p>
                <p className="mt-1 text-[10px] leading-relaxed text-primary-800">
                  Join the waitlist and we will alert you if capacity is released or resale tickets
                  become available.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  block
                  className="mt-2"
                  disabled
                >
                  Join waitlist
                </Button>
              </div>
            )}

            <div className="mt-3 space-y-1.5 text-[10px] text-foreground-500">
              <p className="flex items-center gap-1.5">
                <i className="ri-smartphone-line text-accent-600" /> Payment collection is not connected yet
              </p>
              <p className="flex items-center gap-1.5">
                <i className="ri-shield-check-line text-accent-600" /> Ticket issued after payment confirmation
              </p>
              <p className="flex items-center gap-1.5">
                <i className="ri-group-line text-accent-600" /> Group passes must enter together
              </p>
            </div>
          </div>

          <StayReminder className="mt-3" eventTitle={event.title} eventCity={event.city} />

          <div className="mt-3 rounded-card border border-background-200 bg-background-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-500">Venue</p>
            <p className="mt-1 text-xs font-semibold text-foreground-950">{event.venue}</p>
            <p className="text-[11px] text-foreground-600">{event.address}</p>
            <div className="mt-3 h-24 w-full overflow-hidden rounded-md border border-background-200">
              <iframe
                title={`Map for ${event.venue}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(`${event.venue}, ${event.city}, Kenya`)}&output=embed`}
                className="h-full w-full"
                loading="lazy"
              />
            </div>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mx-auto w-full max-w-[1400px] px-4 pb-10 md:px-6">
          <h2 className="text-lg font-bold text-foreground-950">Similar events you might like</h2>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
            {similar.map((item) => (
              <EventCard key={item.id} event={item} />
            ))}
          </div>
        </section>
      )}
      <Toaster />
    </PublicLayout>
  );
}
