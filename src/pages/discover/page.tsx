import { useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PublicLayout from "@/components/feature/PublicLayout";
import { Toaster } from "@/components/feature/Toaster";
import EventCard from "@/components/feature/EventCard";
import { Badge, Button, EmptyState, Select } from "@/components/base/ui";
import { DataError, DataLoading } from "@/components/feature/DataStates";
import { eventCategories, cities } from "@/mocks/events";
import { usePaginatedEvents } from "@/hooks/useEvents";
import { cn } from "@/lib/helpers";

const sortOptions = [
  { id: "popular", label: "Most popular" },
  { id: "date", label: "Date: soonest" },
  { id: "price-low", label: "Price: low to high" },
  { id: "price-high", label: "Price: high to low" },
  { id: "new", label: "Recently added" },
];

export default function DiscoverPage() {
  const { events, loading, error, reload, hasMore, loadingMore, loadMore } = usePaginatedEvents();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [city, setCity] = useState(params.get("city") ?? "");
  const [priceBand, setPriceBand] = useState(params.get("price") ?? "");
  const [dateBand, setDateBand] = useState("");
  const [availability, setAvailability] = useState("");
  const [sort, setSort] = useState("popular");
  const [visible, setVisible] = useState(8);

  const filtered = useMemo(() => {
    let list = [...events];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((event) =>
        [event.title, event.organizerName, event.venue, event.city, event.category]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    if (category) list = list.filter((event) => event.category === category);
    if (city) list = list.filter((event) => event.city === city);
    if (priceBand === "free") list = list.filter((event) => event.free);
    if (priceBand === "under-2k") list = list.filter((event) => !event.free && event.priceFrom < 2000);
    if (priceBand === "2k-5k") list = list.filter((event) => event.priceFrom >= 2000 && event.priceFrom <= 5000);
    if (priceBand === "5k-plus") list = list.filter((event) => event.priceFrom > 5000);
    if (availability === "available") list = list.filter((event) => !event.soldOut);
    if (availability === "soldout") list = list.filter((event) => event.soldOut);
    if (dateBand === "week") {
      list = list.filter((event) => {
        const diff = new Date(event.date).getTime() - new Date("2026-10-27").getTime();
        return diff >= 0 && diff <= 7 * 86400000;
      });
    }
    if (dateBand === "month") {
      list = list.filter((event) => event.date.startsWith("2026-11"));
    }
    if (dateBand === "december") list = list.filter((event) => event.date.startsWith("2026-12"));

    if (sort === "date") list.sort((a, b) => a.date.localeCompare(b.date));
    if (sort === "price-low") list.sort((a, b) => a.priceFrom - b.priceFrom);
    if (sort === "price-high") list.sort((a, b) => b.priceFrom - a.priceFrom);
    if (sort === "popular") list.sort((a, b) => b.ticketsSold - a.ticketsSold);
    if (sort === "new") list.reverse();
    return list;
  }, [events, query, category, city, priceBand, dateBand, availability, sort]);

  const activeChips = [
    category && { label: category, clear: () => setCategory("") },
    city && { label: city, clear: () => setCity("") },
    priceBand && { label: priceBand === "free" ? "Free" : priceBand, clear: () => setPriceBand("") },
    dateBand && { label: dateBand === "week" ? "This week" : dateBand, clear: () => setDateBand("") },
    availability && { label: availability === "available" ? "Available" : "Sold out", clear: () => setAvailability("") },
    query && { label: `“${query}”`, clear: () => setQuery("") },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const resetAll = () => {
    setQuery("");
    setCategory("");
    setCity("");
    setPriceBand("");
    setDateBand("");
    setAvailability("");
    setParams({});
  };

  return (
    <PublicLayout>
      <div className="border-b border-background-200 bg-background-100">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-7 md:px-6 md:py-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-label font-bold uppercase tracking-[0.22em] text-primary-700">
                Discover
              </p>
              <h1 className="mt-1.5 text-2xl font-extrabold leading-tight text-foreground-950 md:mt-2 md:text-4xl">
                Find something worth leaving the house for
              </h1>
              <p className="mt-1.5 max-w-xl text-[12.5px] text-foreground-600 md:mt-2 md:text-sm">
                {filtered.length} matching events loaded{hasMore ? " so far" : ""}. Filter by city, date, category and price —
                then check out in under a minute.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              <div className="flex h-11 flex-1 items-center gap-2 rounded-field border border-background-300 bg-background-50 px-3 lg:w-72">
                <i className="ri-search-line text-sm text-foreground-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Event, venue, organizer or city"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-foreground-400"
                />
              </div>
              <Select value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 lg:w-48">
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-6 lg:flex-row">
        {/* Filters */}
        <aside className="w-full flex-none lg:w-[236px]">
          <div className="rounded-card border border-background-200 bg-background-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-label font-bold uppercase tracking-wider text-foreground-500">
                Filters
              </p>
              <button
                onClick={resetAll}
                className="cursor-pointer text-[11px] font-semibold text-primary-700 hover:text-primary-800"
              >
                Reset
              </button>
            </div>

            <FilterGroup title="Category">
              <div className="flex flex-wrap gap-1.5">
                {eventCategories.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCategory(category === item.label ? "" : item.label)}
                    className={cn(
                      "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      category === item.label
                        ? "border-foreground-950 bg-foreground-950 text-background-50"
                        : "border-background-300 text-foreground-700 hover:border-foreground-400"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title="City">
              <Select value={city} onChange={(event) => setCity(event.target.value)} className="h-10 text-xs">
                <option value="">All cities</option>
                {cities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </FilterGroup>

            <FilterGroup title="Date">
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "week", label: "This week" },
                  { id: "month", label: "November" },
                  { id: "december", label: "December" },
                  { id: "", label: "Any date" },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setDateBand(item.id)}
                    className={cn(
                      "cursor-pointer rounded-md border px-2 py-1.5 text-[11px] font-medium",
                      dateBand === item.id
                        ? "border-foreground-950 bg-foreground-950 text-background-50"
                        : "border-background-300 text-foreground-700"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title="Price">
              <div className="flex flex-col gap-1.5">
                {[
                  { id: "", label: "Any price" },
                  { id: "free", label: "Free events" },
                  { id: "under-2k", label: "Under KSh 2,000" },
                  { id: "2k-5k", label: "KSh 2,000 – 5,000" },
                  { id: "5k-plus", label: "KSh 5,000+" },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setPriceBand(item.id)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-[11px]",
                      priceBand === item.id
                        ? "bg-secondary-200 font-semibold text-secondary-900"
                        : "text-foreground-700 hover:bg-background-100"
                    )}
                  >
                    {item.label}
                    {priceBand === item.id && <i className="ri-check-line text-primary-700" />}
                  </button>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title="Availability">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "", label: "All" },
                  { id: "available", label: "Available" },
                  { id: "soldout", label: "Sold out" },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setAvailability(item.id)}
                    className={cn(
                      "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium",
                      availability === item.id
                        ? "border-foreground-950 bg-foreground-950 text-background-50"
                        : "border-background-300 text-foreground-700"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </FilterGroup>
          </div>

          <div className="mt-3 rounded-card border border-accent-200 bg-accent-50 p-4">
            <p className="text-xs font-bold text-accent-900">Selling out fast</p>
            <p className="mt-1 text-[11px] leading-relaxed text-accent-900/80">
              Sound Factory Nairobi is at 72% capacity. Early Bird is already sold out.
            </p>
            <Link
              to="/events/sound-factory-nairobi"
              className="mt-3 inline-flex cursor-pointer items-center gap-1 text-[11px] font-bold text-accent-800"
            >
              View event <i className="ri-arrow-right-line" />
            </Link>
          </div>
        </aside>

        {/* Results */}
        <div className="min-w-0 flex-1">
          {loading && <DataLoading label="Loading events" />}
          {!loading && error && <DataError message={error} onRetry={reload} />}
          {!loading && !error && activeChips.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {activeChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={chip.clear}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-background-300 bg-background-50 px-2.5 py-1 text-[11px] font-medium text-foreground-700 hover:border-foreground-400"
                >
                  {chip.label}
                  <i className="ri-close-line text-foreground-400" />
                </button>
              ))}
              <button onClick={resetAll} className="cursor-pointer text-[11px] font-semibold text-primary-700">
                Clear all
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 ? (
            <EmptyState
              icon="ri-search-line"
              title={hasMore ? "No matches in this batch" : "No events match those filters"}
              description={hasMore ? "More events are available. Load the next batch or adjust your filters." : "Try removing a filter, searching a different city, or browsing everything happening this month."}
              action={hasMore ? <Button onClick={() => void loadMore()} disabled={loadingMore}>{loadingMore ? "Loading…" : "Load more events"}</Button> : <Button onClick={resetAll}>Reset filters</Button>}
            />
          ) : null}
          {!loading && !error && filtered.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-3">
                {filtered.slice(0, visible).map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              <div className="mt-6 flex flex-col items-center gap-3">
                <p className="text-[11px] text-foreground-500">
                  Showing {Math.min(visible, filtered.length)} of {filtered.length} events
                </p>
                {visible < filtered.length ? (
                  <Button variant="outline" onClick={() => setVisible((value) => value + 6)}>
                    Load more events
                  </Button>
                ) : hasMore ? (
                  <Button variant="outline" onClick={() => { setVisible((value) => value + 24); void loadMore(); }} disabled={loadingMore}>
                    {loadingMore ? "Loading…" : "Load more events"}
                  </Button>
                ) : (
                  <Badge tone="neutral">You have seen every match</Badge>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <Toaster />
    </PublicLayout>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4 border-t border-background-100 pt-3 first:border-0">
      <p className="mb-2 text-[11px] font-label font-bold uppercase tracking-wider text-foreground-500">
        {title}
      </p>
      {children}
    </div>
  );
}
