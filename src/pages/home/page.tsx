import PublicLayout from "@/components/feature/PublicLayout";
import { Toaster } from "@/components/feature/Toaster";
import { DataError, DataLoading } from "@/components/feature/DataStates";
import { useEvents } from "@/hooks/useEvents";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { formatCompactStat } from "@/lib/statsApi";
import { formatNumber } from "@/lib/helpers";
import {
  CategoryStrip,
  CommissionExplainer,
  CtaBand,
  EventRail,
  FaqSection,
  FreeEventsBanner,
  HomeHero,
  HowItWorks,
  OrganizerStrip,
  WeekendRail,
} from "./components/sections";

export default function HomePage() {
  const { events, loading, error, reload } = useEvents();
  const { stats, loading: statsLoading } = usePlatformStats();

  const statCards = stats
    ? [
        { value: `${formatNumber(stats.eventsListed)}+`, label: "Events listed" },
        { value: formatCompactStat(stats.ticketsSold), label: "Tickets sold" },
        { value: `${formatNumber(stats.verifiedOrganizers)}+`, label: "Verified organizers" },
        { value: stats.averageRating.toFixed(1), label: "Average attendee rating" },
      ]
    : [];

  if (loading) {
    return (
      <PublicLayout>
        <DataLoading />
      </PublicLayout>
    );
  }

  if (error) {
    return (
      <PublicLayout>
        <DataError message={error} onRetry={reload} />
      </PublicLayout>
    );
  }

  const featured = events.filter((event) => event.featured);
  const trending = events.filter((event) => event.trending);
  const free = events.filter((event) => event.free);
  const weekend = [...events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);

  return (
    <PublicLayout>
      <HomeHero trending={[...trending].sort((a, b) => b.ticketsSold - a.ticketsSold)} />

      <section className="border-b border-background-200 bg-background-50">
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-2 gap-y-5 px-4 py-5 md:grid-cols-4 md:px-6 md:py-7">
          {!statsLoading && statCards.length > 0
            ? statCards.map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="font-num text-lg font-extrabold text-foreground-950 md:text-2xl">{stat.value}</span>
                  <span className="mt-0.5 text-[9.5px] font-label uppercase tracking-wide text-foreground-500 md:text-[11px]">
                    {stat.label}
                  </span>
                </div>
              ))
            : Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-1.5">
                  <span className="h-5 w-16 animate-pulse rounded bg-background-200 md:h-6 md:w-20" />
                  <span className="h-2.5 w-24 animate-pulse rounded bg-background-100" />
                </div>
              ))}
        </div>
      </section>

      <CategoryStrip />

      <EventRail
        title="Featured events"
        subtitle="Hand-picked by our editorial team — the shows worth planning your month around."
        eventsList={featured.slice(0, 4)}
        actionLabel="All featured events"
      />

      <WeekendRail eventsList={weekend} />

      <EventRail
        title="Trending this week"
        subtitle="Selling fastest right now across Kenya. Tickets move quickly on these."
        eventsList={trending.slice(0, 4)}
      />

      <FreeEventsBanner eventsList={free} />

      <EventRail
        title="Upcoming across the country"
        subtitle="From Nairobi rooftops to lakeside festivals in Kisumu and the coast."
        eventsList={events.slice(4, 8)}
        actionLabel="Browse all events"
      />

      <OrganizerStrip />
      <HowItWorks />
      <CommissionExplainer />
      <FaqSection />
      <CtaBand />
      <Toaster />
    </PublicLayout>
  );
}