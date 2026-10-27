import { Link } from "react-router-dom";
import type { EventItem } from "@/types";
import { cn, formatEventDate, formatKsh } from "@/lib/helpers";
import { useApp } from "@/store/AppStore";
import { Progress } from "@/components/base/ui";

export default function EventCard({ event, compact = false }: { event: EventItem; compact?: boolean }) {
  const { favorites, toggleFavorite } = useApp();
  const isFavorite = favorites.includes(event.id);
  const remaining = event.capacity - event.ticketsSold;
  const soldPercent = Math.round((event.ticketsSold / event.capacity) * 100);

  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-background-200 bg-background-50 transition-colors duration-300 hover:border-foreground-400">
      <div
        className={cn(
          "relative w-full overflow-hidden",
          compact ? "h-28 sm:h-40" : "h-32 sm:h-44 lg:h-48"
        )}
      >
        <Link to={`/events/${event.slug}`} className="block h-full w-full">
          <img
            src={event.image}
            alt={`${event.title} — ${event.venue}, ${event.city}`}
            title={`${event.title} tickets ${event.city}`}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-1.5 sm:p-3">
          <span className="rounded-full bg-foreground-950/70 px-1.5 py-0.5 text-[8px] font-label font-bold uppercase tracking-wide text-background-50 backdrop-blur sm:px-2.5 sm:py-1 sm:text-[10px]">
            {event.category}
          </span>
          <button
            onClick={() => toggleFavorite(event.id)}
            aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
            className={cn(
              "pointer-events-auto flex h-6 w-6 cursor-pointer items-center justify-center rounded-full backdrop-blur transition-colors sm:h-8 sm:w-8",
              isFavorite
                ? "bg-primary-500 text-background-50"
                : "bg-foreground-950/50 text-background-50 hover:bg-foreground-950/70"
            )}
          >
            <i className={cn(isFavorite ? "ri-heart-3-fill" : "ri-heart-3-line", "text-[11px] sm:text-sm")} />
          </button>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 p-1.5 sm:p-3">
          <span className="rounded-md bg-background-50 px-1.5 py-0.5 text-[9px] font-bold text-foreground-950 sm:px-2 sm:py-1 sm:text-[11px]">
            {event.free ? "Free" : `From ${formatKsh(event.priceFrom)}`}
          </span>
          {event.soldOut && (
            <span className="rounded-md bg-primary-700 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-background-50 sm:px-2 sm:py-1 sm:text-[10px]">
              Sold out
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        <div className="flex items-center gap-1 text-[8.5px] font-label font-semibold uppercase tracking-wide text-foreground-700 sm:gap-1.5 sm:text-[11px]">
          <i className="ri-calendar-event-line" />
          <span className="line-clamp-1">{formatEventDate(event.date)}</span>
          <span className="hidden text-background-300 sm:inline">·</span>
          <span className="hidden text-foreground-500 sm:inline">{event.startTime}</span>
        </div>
        <Link to={`/events/${event.slug}`} className="mt-1 cursor-pointer sm:mt-1.5">
          <h3 className="line-clamp-2 text-[11.5px] font-bold leading-snug text-foreground-950 hover:text-foreground-600 sm:text-[15px]">
            {event.title}
          </h3>
        </Link>
        <p className="mt-1 flex items-start gap-1 text-[9.5px] text-foreground-600 sm:gap-1.5 sm:text-xs">
          <i className="ri-map-pin-line mt-0.5 flex-none text-foreground-400" />
          <span className="line-clamp-1">
            {event.venue}, {event.city}
          </span>
        </p>

        <div className="mt-2 hidden items-center gap-1.5 sm:mt-3 sm:flex">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background-200 text-[9px] font-bold text-foreground-700">
            {event.organizerName.slice(0, 2).toUpperCase()}
          </span>
          <span className="line-clamp-1 text-[11px] text-foreground-600">{event.organizerName}</span>
          {event.verified && <i className="ri-verified-badge-fill text-xs text-accent-600" title="Verified organizer" />}
        </div>

        <div className="mt-auto pt-2 sm:pt-3">
          <div className="mb-1 flex items-center justify-between text-[8.5px] font-medium text-foreground-500 sm:mb-1.5 sm:text-[10px]">
            <span>{soldPercent}% sold</span>
            <span className="hidden sm:inline">
              {event.soldOut ? "Waitlist open" : `${remaining.toLocaleString()} left`}
            </span>
          </div>
          <Progress value={soldPercent} tone={event.soldOut ? "foreground" : "primary"} />
        </div>
      </div>
    </article>
  );
}