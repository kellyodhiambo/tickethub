import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { EventItem } from "@/types";
import { cn, formatKsh } from "@/lib/helpers";
import { Badge, Button, SectionTitle } from "@/components/base/ui";
import EventCard from "@/components/feature/EventCard";
import { eventCategories, cities } from "@/mocks/events";
import { supabase } from "@/lib/supabase";
import TrendingPanel from "./TrendingPanel";
import HeroBackdrop from "./HeroBackdrop";

export function HomeHero({ trending = [] }: { trending?: EventItem[] }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");

  const search = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (city) params.set("city", city);
    if (category) params.set("category", category);
    navigate(`/discover?${params.toString()}`);
  };

  return (
    <section className="relative w-full overflow-hidden bg-foreground-950">
      <div className="absolute inset-0 h-full w-full">
        <HeroBackdrop />
        <img
          src="https://readdy.ai/api/search-image?query=cinematic%20wide%20photograph%20of%20a%20jubilant%20Kenyan%20open%20air%20concert%20crowd%20at%20night%20in%20Nairobi%2C%20raised%20hands%20and%20phone%20lights%2C%20warm%20amber%20and%20orange%20stage%20beams%20through%20haze%2C%20deep%20charcoal%20shadows%2C%20premium%20music%20festival%20editorial%20photography%2C%20high%20detail%2C%20no%20text%2C%20no%20watermark&width=1600&height=900&seq=dala-hero-main&orientation=landscape"
          alt="Crowd at a Kenyan live music concert in Nairobi"
          title="Dala Tickets — Kenyan concerts and festivals"
          className="hero-zoom h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 hero-veil" />
        <div className="absolute inset-0 grain opacity-30" />
      </div>

      <div className="relative mx-auto w-full max-w-[1400px] px-4 pb-7 pt-8 md:px-6 md:pb-14 md:pt-16">
        <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-end lg:gap-10">
          <div className="max-w-2xl">
          <span
            style={{ animationDelay: "40ms" }}
            className="inline-flex animate-fade-up items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[9px] font-label font-semibold uppercase tracking-[0.2em] text-white/85 backdrop-blur md:gap-2 md:px-3 md:py-1.5 md:text-[10px] md:tracking-[0.22em]"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Concerts · Festivals · Comedy · Conferences
          </span>

          <h1
            style={{ animationDelay: "120ms" }}
            className="mt-3 animate-fade-up font-display text-[32px] leading-[0.98] tracking-[-0.01em] text-white sm:text-5xl lg:text-[70px]"
          >
            Find your next great
            <span className="block italic text-white/60">Kenyan night out.</span>
          </h1>

          <p
            style={{ animationDelay: "200ms" }}
            className="mt-2.5 hidden max-w-xl animate-fade-up text-[13px] leading-relaxed text-white/70 sm:block sm:text-base"
          >
            Discover events across Kenya, keep your tickets in one account, and scan in at the gate.
            Ticket payment collection is being connected.
          </p>

          <div
            style={{ animationDelay: "280ms" }}
            className="mt-4 flex animate-fade-up items-center gap-2 sm:mt-6"
          >
            <Link
              to="/discover"
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-btn bg-white px-3.5 text-[11.5px] font-semibold text-black transition-colors hover:bg-white/85 sm:h-12 sm:px-6 sm:text-sm"
            >
              <i className="ri-compass-3-line text-sm sm:text-base" />
              Explore Events
            </Link>
            <Link
              to="/organizer/events/new"
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-btn border border-white/35 bg-white/5 px-3.5 text-[11.5px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/15 sm:h-12 sm:px-6 sm:text-sm"
            >
              <i className="ri-add-circle-line text-sm sm:text-base" />
              Organize an Event
            </Link>
          </div>

          <div className="mt-7 hidden flex-wrap items-center gap-x-6 gap-y-3 text-[11px] text-white/60 sm:flex">
            {[
              { icon: "ri-shield-check-line", label: "Events managed by verified organizers" },
              { icon: "ri-ticket-2-line", label: "Tickets saved to your account" },
              { icon: "ri-qr-scan-2-line", label: "QR validation at event entry" },
            ].map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <i className={cn(item.icon, "text-white/70")} />
                {item.label}
              </span>
            ))}
          </div>
          </div>

          <div style={{ animationDelay: "340ms" }} className="animate-fade-up">
            <TrendingPanel events={trending} />
          </div>
        </div>

        {/* Search card */}
        <div className="relative mt-5 rounded-card border border-white/15 bg-background-50 p-2 md:mt-10 md:p-4">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.4fr_1fr_1fr_auto]">
            <div className="flex h-10 items-center gap-2 rounded-field border border-background-300 bg-background-50 px-3 md:h-12">
              <i className="ri-search-line text-sm text-foreground-500 md:text-base" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && search()}
                placeholder="Event, artist, venue or city"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-foreground-400 md:text-sm"
              />
            </div>
            <div className="hidden h-12 items-center gap-2 rounded-field border border-background-300 bg-background-50 px-3 md:flex">
              <i className="ri-map-pin-line text-foreground-500" />
              <select
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="w-full cursor-pointer bg-transparent text-sm text-foreground-900 outline-none"
              >
                <option value="">All cities</option>
                {cities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden h-12 items-center gap-2 rounded-field border border-background-300 bg-background-50 px-3 md:flex">
              <i className="ri-price-tag-3-line text-foreground-500" />
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full cursor-pointer bg-transparent text-sm text-foreground-900 outline-none"
              >
                <option value="">All categories</option>
                {eventCategories.map((item) => (
                  <option key={item.id} value={item.label}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <Button className="h-10 w-full text-[12px] md:h-12 md:w-auto md:text-sm" onClick={search}>
              <i className="ri-search-2-line" /> Search events
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CategoryStrip() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pt-10 md:px-6 md:pt-14">
      <SectionTitle
        eyebrow="Browse by mood"
        title="What are you in the mood for?"
        subtitle="From stadium concerts to stand-up in a small room — pick a lane and we will fill your weekend."
        action={
          <Link
            to="/discover"
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-800"
          >
            View all categories <i className="ri-arrow-right-line" />
          </Link>
        }
      />
      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-4 sm:gap-2.5 lg:grid-cols-8">
        {eventCategories.map((item, index) => (
          <Link
            key={item.id}
            to={`/discover?category=${item.label}`}
            className={cn(
              "group flex cursor-pointer flex-col items-start gap-1.5 rounded-card border border-background-200 bg-background-50 p-2.5 transition-colors hover:border-primary-300 hover:bg-primary-50 sm:gap-2 sm:p-3.5",
              index === 0 && "bg-secondary-100"
            )}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-background-100 text-foreground-800 transition-colors group-hover:bg-primary-500 group-hover:text-background-50 sm:h-9 sm:w-9">
              <i className={cn(item.icon, "text-sm sm:text-base")} />
            </span>
            <span className="text-[11px] font-semibold text-foreground-900 sm:text-[12px]">{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function EventRail({
  title,
  subtitle,
  eventsList,
  actionTo = "/discover",
  actionLabel = "See all",
  dark = false,
}: {
  title: string;
  subtitle?: string;
  eventsList: EventItem[];
  actionTo?: string;
  actionLabel?: string;
  dark?: boolean;
}) {
  return (
    <section className={cn("mx-auto w-full max-w-[1400px] px-4 pt-10 md:px-6 md:pt-16", dark && "text-background-50")}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className={cn("text-xl font-bold md:text-3xl", dark ? "text-background-50" : "text-foreground-950")}>
            {title}
          </h2>
          {subtitle && (
            <p className={cn("mt-1 line-clamp-2 max-w-xl text-[12.5px] md:mt-1.5 md:text-sm", dark ? "text-background-200" : "text-foreground-600")}>
              {subtitle}
            </p>
          )}
        </div>
        <Link
          to={actionTo}
          className={cn(
            "hidden whitespace-nowrap text-xs font-semibold sm:flex sm:items-center sm:gap-1",
            dark ? "text-primary-300 hover:text-primary-200" : "text-primary-700 hover:text-primary-800"
          )}
        >
          {actionLabel} <i className="ri-arrow-right-line" />
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-4 lg:grid-cols-4">
        {eventsList.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

export function WeekendRail({ eventsList }: { eventsList: EventItem[] }) {
  return (
    <section className="mt-10 border-y border-background-200 bg-background-100 py-8 md:mt-16 md:py-14">
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6">
        <SectionTitle
          eyebrow="This weekend"
          title="Happening in the next few days"
          subtitle="Short on plans? These are the events filling up fastest right now."
        />
        <div className="mt-4 flex gap-2.5 overflow-x-auto pb-2 no-scrollbar md:mt-5 md:gap-3">
          {eventsList.map((event) => (
            <div key={event.id} className="w-[200px] flex-none sm:w-[260px]">
              <EventCard event={event} compact />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FreeEventsBanner({ eventsList }: { eventsList: EventItem[] }) {
  return (
    <section className="mx-auto mt-10 w-full max-w-[1400px] px-4 md:mt-16 md:px-6">
      <div className="overflow-hidden rounded-card border border-accent-200 bg-accent-50">
        <div className="grid gap-5 p-4 md:grid-cols-[1.1fr_1fr] md:gap-6 md:p-8">
          <div>
            <Badge tone="success">Free to attend</Badge>
            <h2 className="mt-2.5 text-xl font-bold text-foreground-950 md:mt-3 md:text-3xl">
              Community events that cost nothing but your time
            </h2>
            <p className="mt-2 max-w-md text-[12.5px] leading-relaxed text-foreground-700 md:text-sm">
              Cultural nights, campus expos and open markets across Kenya. Register for a free QR
              ticket so we can plan capacity and security properly.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/discover?price=free"
                className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-btn bg-accent-600 px-4 text-xs font-semibold text-background-50 hover:bg-accent-700"
              >
                Browse free events <i className="ri-arrow-right-line" />
              </Link>
              <Link
                to="/discover?category=Campus"
                className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-btn border border-accent-300 px-4 text-xs font-semibold text-accent-900 hover:bg-accent-100"
              >
                Campus events
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {eventsList.slice(0, 2).map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.slug}`}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-accent-200 bg-background-50"
              >
                <div className="h-28 w-full overflow-hidden">
                  <img
                    src={event.image}
                    alt={`${event.title} free event in ${event.city}`}
                    title={`${event.title} — free event`}
                    className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <p className="text-[10px] font-label font-bold uppercase tracking-wide text-accent-700">
                    {event.city}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs font-semibold text-foreground-950">{event.title}</p>
                  <p className="mt-1 text-[11px] text-foreground-500">Free registration</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function OrganizerStrip() {
  const [organizers, setOrganizers] = useState<Array<{ id: string; full_name: string; avatar_url: string | null; location: string | null; bio: string | null }>>([]);
  useEffect(() => {
    void supabase.from("public_profiles").select("id,full_name,avatar_url,location,bio").eq("role", "creator").eq("verified", true).limit(6)
      .then(({ data }) => setOrganizers((data ?? []) as typeof organizers));
  }, []);
  return (
    <section className="mx-auto mt-12 w-full max-w-[1400px] px-4 md:mt-16 md:px-6">
      <SectionTitle
        eyebrow="Who is behind the shows"
        title="Popular organizers on Dala Tickets"
        subtitle="Organizers shown here have completed platform verification."
      />
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        {organizers.map((organizer) => (
          <div
            key={organizer.id}
            className="flex items-start gap-3 rounded-card border border-background-200 bg-background-50 p-4"
          >
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-foreground-950 text-xs font-bold text-background-50">
              {organizer.avatar_url ? <img src={organizer.avatar_url} alt="" className="h-full w-full rounded-full object-cover" /> : (organizer.full_name || "O").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold text-foreground-950">{organizer.full_name}</p>
                <i className="ri-verified-badge-fill text-sm text-accent-600" />
              </div>
              <p className="mt-0.5 text-[11px] text-foreground-500">
                {organizer.location || "Kenya"}
              </p>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-foreground-600">{organizer.bio || "Verified event organizer"}</p>
            </div>
            <span className="flex items-center gap-1 rounded-md bg-background-100 px-2 py-1 text-[11px] font-bold text-foreground-800">
              <i className="ri-verified-badge-fill text-accent-600" /> Verified
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

const steps = [
  { icon: "ri-search-eye-line", title: "Discover and choose", body: "Filter by city, date, category and price. Compare ticket categories before you commit." },
  { icon: "ri-smartphone-line", title: "Ticket payments", body: "Online ticket payment collection will be available after payment provider setup is complete." },
  { icon: "ri-ticket-2-line", title: "Manage your tickets", body: "Tickets linked to your account appear in your wallet." },
  { icon: "ri-qr-scan-line", title: "Scan in at the gate", body: "Gate staff can validate paid tickets and prevent duplicate scans." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto mt-12 w-full max-w-[1400px] px-4 md:mt-16 md:px-6">
      <SectionTitle
        eyebrow="How it works"
        title="From discovery to the gate in four steps"
        subtitle="Buying should be the easiest part of your night. Here is exactly what happens."
        align="center"
        action={
          <Link
            to="/how-it-works"
            className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap text-xs font-semibold text-primary-700 hover:text-primary-800"
          >
            Read the full guide <i className="ri-arrow-right-line" />
          </Link>
        }
      />
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3 lg:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.title} className="relative rounded-card border border-background-200 bg-background-50 p-3.5 sm:p-5">
            <span className="absolute right-3 top-3 hidden font-num text-2xl font-extrabold text-background-200 sm:block sm:text-3xl">
              0{index + 1}
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary-100 text-secondary-900 sm:h-11 sm:w-11">
              <i className={cn(step.icon, "text-base sm:text-xl")} />
            </span>
            <h3 className="mt-3 text-[12.5px] font-bold text-foreground-950 sm:mt-4 sm:text-sm">{step.title}</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-foreground-600 sm:mt-1.5 sm:text-xs">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CommissionExplainer() {
  return (
    <section className="mx-auto mt-12 w-full max-w-[1400px] px-4 md:mt-16 md:px-6">
      <div className="overflow-hidden rounded-card border border-background-200 bg-foreground-950">
        <div className="grid gap-5 p-4 md:grid-cols-2 md:gap-8 md:p-10">
          <div>
            <Badge tone="warning">For organizers</Badge>
            <h2 className="mt-2.5 text-xl font-bold text-background-50 md:mt-3 md:text-3xl">
              Commission you can actually see
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-background-200">
              One platform commission per ticket, set by the platform admin and shown before you
              publish. Earnings, provider fees and settlement are itemised on every statement.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                "Guided event wizard with tiered pricing and inventory control",
                "Scanner-only gate staff invites — no access to your money",
                "Withdrawals to an eligible M-Pesa number or bank account",
                "Sales charts, attendance reports and CSV exports",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-background-100">
                  <i className="ri-checkbox-circle-fill mt-0.5 text-accent-400" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/organizer"
              className="mt-6 inline-flex h-11 cursor-pointer items-center gap-2 rounded-btn bg-background-50 px-5 text-xs font-semibold text-foreground-950 transition-colors hover:bg-background-200"
            >
              Open organizer dashboard <i className="ri-arrow-right-line" />
            </Link>
          </div>

          <div className="rounded-card border border-background-50/15 bg-background-50/5 p-5">
            <p className="text-[11px] font-label font-bold uppercase tracking-wider text-background-300">
              Worked example · 10% commission
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between border-b border-background-50/10 pb-3">
                <span className="text-xs text-background-200">Ticket price</span>
                <span className="font-num text-sm font-bold text-background-50">{formatKsh(1500)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-background-50/10 pb-3">
                <span className="text-xs text-background-200">Platform commission (10%)</span>
                <span className="font-num text-sm font-bold text-primary-400">− {formatKsh(150)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-background-200">Organizer allocation</span>
                <span className="font-num text-xl font-extrabold text-accent-400">{formatKsh(1350)}</span>
              </div>
            </div>
            <p className="mt-4 text-[10px] leading-relaxed text-background-300">
              Before payment-provider charges, refunds, taxes or other disclosed adjustments. Demo
              figures — no live money movement in this environment.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "How do I get my ticket after paying with M-Pesa?",
    a: "Your ticket is generated only after our backend confirms the payment. It appears in My Tickets with a unique QR code that is ready to scan at the gate.",
  },
  {
    q: "What commission does Dala Tickets charge?",
    a: "A platform commission applies to every sale and is set by the platform admin, with approved event-specific rates where relevant. Organizers see the exact split on each order and earnings statement.",
  },
  {
    q: "What do the scanner colours mean?",
    a: "Green means a valid ticket and entry is approved. Red means the ticket was already scanned, is invalid or was cancelled. Amber means pending verification, a network problem or offline mode.",
  },
  {
    q: "Can gate staff see my sales and earnings?",
    a: "No. Gate staff are invited with scanner-only permissions. They can validate tickets but never see revenue, payouts or attendee finances.",
  },
  {
    q: "Can I change the name on my ticket?",
    a: "Where the organizer allows it, you can request a transfer from your ticket page. The QR code is reissued so possession of a screenshot is never enough.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState(0);
  return (
    <section className="mx-auto mt-12 w-full max-w-[1400px] px-4 md:mt-16 md:px-6">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionTitle
            eyebrow="Questions"
            title="Everything you might want to ask"
            subtitle="Still stuck? Our Nairobi support team answers ticket and organizer questions within one business day."
          />
          <Link
            to="/organizer/support"
            className="mt-5 inline-flex h-11 cursor-pointer items-center gap-2 rounded-btn border border-background-300 px-4 text-xs font-semibold text-foreground-800 hover:bg-background-100"
          >
            <i className="ri-customer-service-2-line" /> Contact support
          </Link>
        </div>
        <div className="divide-y divide-background-200 rounded-card border border-background-200 bg-background-50">
          {faqs.map((item, index) => (
            <div key={item.q}>
              <button
                onClick={() => setOpen(open === index ? -1 : index)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left sm:gap-4 sm:px-5 sm:py-4"
              >
                <span className="text-[12.5px] font-semibold text-foreground-950 sm:text-sm">{item.q}</span>
                <i
                  className={cn(
                    "flex-none text-foreground-400 transition-transform",
                    open === index ? "ri-subtract-line" : "ri-add-line"
                  )}
                />
              </button>
              {open === index && (
                <p className="animate-fade-up px-4 pb-3.5 text-[11px] leading-relaxed text-foreground-600 sm:px-5 sm:pb-4 sm:text-xs">{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="mx-auto mt-12 w-full max-w-[1400px] px-4 md:mt-16 md:px-6">
      <div className="relative overflow-hidden rounded-card bg-primary-500 px-6 py-10 md:px-12 md:py-14">
        <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full border border-background-50/15" />
        <div className="absolute -bottom-16 right-24 h-40 w-40 rounded-full border border-background-50/10" />
        <div className="relative max-w-2xl">
          <h2 className="text-xl font-extrabold text-background-50 md:text-4xl">
            Your next sold-out event starts here.
          </h2>
          <p className="mt-2 max-w-lg text-[12.5px] text-background-100 md:mt-3 md:text-sm">
            Publish your event in minutes, sell with M-Pesa and scan guests in with a gate app built
            for real Kenyan queues.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Link
              to="/organizer/events/new"
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-btn bg-foreground-950 px-5 text-xs font-semibold text-background-50 hover:bg-foreground-900"
            >
              Create an event
            </Link>
            <Link
              to="/admin"
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-btn border border-background-50/40 px-5 text-xs font-semibold text-background-50 hover:bg-background-50/10"
            >
              Admin console
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
