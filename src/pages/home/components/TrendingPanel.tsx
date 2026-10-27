import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { EventItem } from "@/types";
import { cn, formatEventDate, formatKsh } from "@/lib/helpers";

/**
 * "Most booked" showcase.
 * - Desktop: one large card auto-rotating through the most-booked events.
 * - Mobile: a small horizontal snap rail you can swipe with a thumb.
 */
export default function TrendingPanel({ events }: { events: EventItem[] }) {
  const list = events.slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || list.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % list.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [paused, list.length]);

  if (list.length === 0) return null;
  const active = list[Math.min(index, list.length - 1)];

  return (
    <>
      {/* Desktop — auto-rotating featured card */}
      <div
        className="hidden lg:block"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[10px] font-label font-bold uppercase tracking-[0.22em] text-white/70">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Trending now
          </p>
          <p className="text-[10px] font-label uppercase tracking-[0.18em] text-white/45">Most booked</p>
        </div>

        <div className="relative h-[300px] overflow-hidden rounded-card border border-white/15">
          <Link to={`/events/${active.slug}`} className="group block h-full w-full">
            <img
              key={active.id}
              src={active.image}
              alt={`${active.title} in ${active.city}`}
              title={`${active.title} tickets`}
              className="h-full w-full animate-fade-up object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/35 to-black/5" />

            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-label font-bold uppercase tracking-wide text-black">
                  {active.category}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-white/80">
                  <i className="ri-fire-line" />
                  {active.ticketsSold.toLocaleString()} booked
                </span>
              </div>
              <h3 className="mt-2 line-clamp-2 font-heading text-lg font-extrabold leading-tight text-white">
                {active.title}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-white/70">
                <i className="ri-calendar-event-line" />
                {formatEventDate(active.date)}
                <span className="text-white/30">·</span>
                <i className="ri-map-pin-line" />
                {active.city}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-2.5">
                <span className="text-[11px] font-semibold text-white">
                  {active.free ? "Free entry" : `From ${formatKsh(active.priceFrom)}`}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-white">
                  Get tickets <i className="ri-arrow-right-line" />
                </span>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-2 flex gap-1.5">
          {list.map((event, i) => (
            <button
              key={event.id}
              onClick={() => setIndex(i)}
              aria-label={`Show ${event.title}`}
              className={cn(
                "h-1 cursor-pointer rounded-full transition-all",
                i === index ? "w-8 bg-white" : "w-4 bg-white/30 hover:bg-white/50"
              )}
            />
          ))}
        </div>
      </div>

      {/* Mobile — compact swipeable rail */}
      <div className="lg:hidden">
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[9px] font-label font-bold uppercase tracking-[0.2em] text-white/70">
            <span className="h-1 w-1 animate-pulse rounded-full bg-white" />
            Trending · swipe
          </p>
          <Link
            to="/discover?sort=popular"
            className="flex items-center gap-0.5 text-[9px] font-semibold text-white/60"
          >
            See all <i className="ri-arrow-right-s-line" />
          </Link>
        </div>
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 no-scrollbar">
          {list.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.slug}`}
              className="w-[132px] flex-none snap-start overflow-hidden rounded-lg border border-white/15 bg-black/35 backdrop-blur"
            >
              <div className="h-[62px] w-full overflow-hidden">
                <img
                  src={event.image}
                  alt={`${event.title} in ${event.city}`}
                  title={`${event.title} tickets`}
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div className="p-1.5">
                <p className="line-clamp-1 text-[10px] font-semibold leading-tight text-white">{event.title}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[8.5px] text-white/55">
                  <i className="ri-fire-line" />
                  {event.ticketsSold.toLocaleString()} booked
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}