import { useState } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "@/components/feature/PublicLayout";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Card, SectionTitle } from "@/components/base/ui";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { formatCompactStat } from "@/lib/statsApi";
import { formatNumber, cn } from "@/lib/helpers";
import { CommissionExplainer, CtaBand } from "@/pages/home/components/sections";

const attendeeSteps = [
  {
    icon: "ri-search-eye-line",
    title: "Find the right night",
    body: "Search by artist, venue, city or date. Filter by price and category, then open the event to see the full lineup, gate times and what is included.",
    points: ["City, date and price filters", "Lineup, schedule and age limits", "Save events to your favourites"],
  },
  {
    icon: "ri-price-tag-3-line",
    title: "Pick your ticket category",
    body: "Every event lists its categories with the price, remaining inventory and what each category unlocks. Fees are shown before you pay, never after.",
    points: ["Advance, Regular, VIP or table", "Limits per order always disclosed", "No surprise charges at checkout"],
  },
  {
    icon: "ri-smartphone-line",
    title: "Ticket payments",
    body: "Confirm the STK Push on your phone. Nothing is issued until the payment provider confirms the money actually moved.",
    points: ["Payment provider setup is pending", "No ticket is issued before payment confirmation", "Unpaid checkout does not reserve inventory"],
  },
  {
    icon: "ri-ticket-2-line",
    title: "Keep your QR ticket",
    body: "Tickets land in your wallet with a unique QR code. Download a PNG or PDF copy, or simply open My Tickets at the gate.",
    points: ["One QR code per attendee", "Image and PDF downloads", "Transfer where the organizer allows"],
  },
];

const categories = [
  {
    name: "Advance / Early bird",
    icon: "ri-flashlight-line",
    body: "Cheapest entry, released first and usually limited. Great if your plans are already fixed.",
    tag: "Best value",
  },
  {
    name: "Regular / Standard",
    icon: "ri-ticket-line",
    body: "The main allocation. Available until the event sells out or sales close.",
    tag: "Most common",
  },
  {
    name: "VIP / Front row",
    icon: "ri-vip-crown-line",
    body: "Closer to the stage, faster entry lane and usually a dedicated bar or lounge.",
    tag: "Premium",
  },
  {
    name: "Table / Group",
    icon: "ri-group-line",
    body: "One purchase covers several guests at a reserved table. The lead attendee holds the QR.",
    tag: "Groups",
  },
];

const gateStates = [
  {
    tone: "Green",
    title: "Valid — let them in",
    body: "The code exists, belongs to this event and has never been scanned. The scanner records the gate and staff member instantly.",
    icon: "ri-checkbox-circle-line",
    badge: "success",
  },
  {
    tone: "Red",
    title: "Stop — already used or invalid",
    body: "A second scan of the same ticket, a cancelled ticket or a code from another event. Gate staff see why, without seeing the buyer's finances.",
    icon: "ri-close-circle-line",
    badge: "danger",
  },
  {
    tone: "Amber",
    title: "Check — network or pending",
    body: "Offline mode, a slow connection or a payment still settling. Staff are prompted to verify manually rather than guess.",
    icon: "ri-error-warning-line",
    badge: "warning",
  },
];

const organizerSteps = [
  {
    icon: "ri-add-box-line",
    title: "Create the event",
    body: "Set the date, venue, capacity and ticket categories with inventory limits. Drafts stay private until you publish.",
  },
  {
    icon: "ri-shield-check-line",
    title: "Verify your business",
    body: "Submit your business details and payout account. A platform admin reviews every application — only they can grant the verified badge.",
  },
  {
    icon: "ri-megaphone-line",
    title: "Sell and promote",
    body: "Share your event link, add promoters and watch live sales. Commission is disclosed per order before you publish.",
  },
  {
    icon: "ri-qr-scan-2-line",
    title: "Scan, settle, withdraw",
    body: "Invite scanner-only gate staff and run the door. Payouts will open after the settlement provider is connected.",
  },
];

const requirements = [
  "Registered business name or recognised brand",
  "Business registration or permit reference",
  "Director or owner identification on file",
  "Payout account in the business name",
  "A reachable phone number and email",
];

const faqs = [
  {
    q: "What does organizer verification actually check?",
    a: "That the business exists, that the person applying can act for it, and that the payout account belongs to the same business. Verification is what unlocks the public verified badge.",
  },
  {
    q: "Who approves a verified organizer?",
    a: "Only a platform administrator. Organizers can submit and resubmit applications, but they can never mark themselves verified.",
  },
  {
    q: "Can I buy a ticket without an account?",
    a: "You can browse without signing in, but tickets are tied to an account so you can recover them on a new phone and transfer them when the organizer allows it.",
  },
  {
    q: "What happens if my payment fails?",
    a: "The seats are released back to the pool and no ticket is issued. You will see the failed status and can retry with another number.",
  },
  {
    q: "What information can gate staff see?",
    a: "A gate scanner sees the ticket code, category, attendee name and status. They never see revenue, payouts or payment details.",
  },
  {
    q: "How do refunds work?",
    a: "Refunds follow the event's refund policy, which is shown before checkout. Approved refunds reverse the organizer allocation and platform commission for that order.",
  },
];

export default function HowItWorksPage() {
  const { stats } = usePlatformStats();
  const [open, setOpen] = useState(0);

  const heroStats = stats
    ? [
        { value: `${formatNumber(stats.eventsListed)}+`, label: "Events listed" },
        { value: formatCompactStat(stats.ticketsSold), label: "Tickets sold" },
        { value: `${formatNumber(stats.verifiedOrganizers)}+`, label: "Verified organizers" },
        { value: stats.averageRating.toFixed(1), label: "Average rating" },
      ]
    : [];

  return (
    <PublicLayout>
      <section className="relative w-full overflow-hidden bg-foreground-950">
        <img
          src="https://readdy.ai/api/search-image?query=cinematic%20wide%20photograph%20of%20a%20Nairobi%20concert%20entry%20gate%20at%20dusk%2C%20small%20queue%20of%20stylish%20young%20Kenyan%20guests%20holding%20phones%2C%20warm%20amber%20string%20lights%20and%20deep%20charcoal%20shadows%2C%20editorial%20documentary%20style%2C%20high%20detail%2C%20no%20text%2C%20no%20watermark&width=1600&height=820&seq=dala-howitworks-hero&orientation=landscape"
          alt="Guests arriving at a Nairobi concert gate"
          title="How Dala Tickets works"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 hero-veil" />
        <div className="relative mx-auto w-full max-w-[1400px] px-4 pb-10 pt-12 md:px-6 md:pb-16 md:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[9.5px] font-label font-semibold uppercase tracking-[0.22em] text-white/85 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-white" /> How it works
          </span>
          <h1 className="mt-4 max-w-3xl font-display text-[34px] leading-[0.98] text-white sm:text-5xl lg:text-[64px]">
            From “I need plans” to
            <span className="block italic text-white/60">“I’m inside the gate.”</span>
          </h1>
          <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-white/70 sm:text-base">
            Dala Tickets provides event discovery, ticket management and gate scanning. Ticket payment
            collection and payouts will be available after the provider APIs are connected.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Link
              to="/discover"
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-btn bg-background-50 px-5 text-xs font-semibold text-foreground-950 hover:bg-background-200"
            >
              <i className="ri-compass-3-line" /> Browse events
            </Link>
            <Link
              to="/signup"
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-btn border border-white/35 bg-white/5 px-5 text-xs font-semibold text-white backdrop-blur hover:bg-white/15"
            >
              <i className="ri-store-3-line" /> Start selling tickets
            </Link>
          </div>

          {heroStats.length > 0 && (
            <div className="mt-9 grid grid-cols-2 gap-y-4 border-t border-white/15 pt-5 sm:grid-cols-4">
              {heroStats.map((item) => (
                <div key={item.label}>
                  <p className="font-num text-lg font-extrabold text-white md:text-2xl">{item.value}</p>
                  <p className="mt-0.5 text-[9.5px] font-label uppercase tracking-wide text-white/55 md:text-[11px]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1400px] px-4 pt-12 md:px-6 md:pt-16">
        <SectionTitle
          eyebrow="For attendees"
          title="Four steps, no guesswork"
          subtitle="Everything below is what actually happens when you tap buy — including the parts most ticketing sites hide."
        />
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {attendeeSteps.map((step, index) => (
            <Card key={step.title} className="flex flex-col p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary-100 text-secondary-900">
                  <i className={cn(step.icon, "text-lg")} />
                </span>
                <span className="font-num text-2xl font-extrabold text-background-300">0{index + 1}</span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-foreground-950">{step.title}</h3>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-foreground-600">{step.body}</p>
              <ul className="mt-3 space-y-1.5 border-t border-background-200 pt-3">
                {step.points.map((point) => (
                  <li key={point} className="flex items-start gap-1.5 text-[11px] text-foreground-700">
                    <i className="ri-check-line mt-0.5 text-accent-600" /> {point}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12 w-full border-y border-background-200 bg-background-100 py-10 md:mt-16 md:py-14">
        <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6">
          <SectionTitle
            eyebrow="Ticket categories"
            title="Why one night has four different prices"
            subtitle="Each category has its own allocation. Categories sell out independently, so a cheap tier disappearing does not mean the event is gone."
          />
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((item) => (
              <div key={item.name} className="rounded-card border border-background-200 bg-background-50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-background-100 text-foreground-800">
                    <i className={cn(item.icon, "text-base")} />
                  </span>
                  <Badge tone="neutral">{item.tag}</Badge>
                </div>
                <h3 className="mt-3 text-[12.5px] font-bold text-foreground-950">{item.name}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-foreground-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1400px] px-4 pt-12 md:px-6 md:pt-16">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <SectionTitle
              eyebrow="At the gate"
              title="What the scanner colours mean"
              subtitle="Gate staff scan, the system decides. Nobody at the door has to judge whether a screenshot looks convincing."
            />
            <div className="mt-4 rounded-card border border-background-200 bg-background-50 p-4">
              <p className="text-[11px] font-label font-bold uppercase tracking-wider text-foreground-500">
                Built for real queues
              </p>
              <ul className="mt-2 space-y-2">
                {[
                  "Scanner-only staff accounts — no access to money",
                  "Every scan logs gate, time and staff member",
                  "Offline scans queue and reconcile when back online",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[11.5px] text-foreground-700">
                    <i className="ri-shield-check-line mt-0.5 text-foreground-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="space-y-2.5">
            {gateStates.map((state) => (
              <div
                key={state.tone}
                className="flex items-start gap-3 rounded-card border border-background-200 bg-background-50 p-4"
              >
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-background-100 text-foreground-800">
                  <i className={cn(state.icon, "text-lg")} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[12.5px] font-bold text-foreground-950">{state.title}</p>
                    <Badge tone={state.badge}>{state.tone}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-foreground-600">{state.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 w-full max-w-[1400px] px-4 md:mt-16 md:px-6">
        <SectionTitle
          eyebrow="For organizers"
          title="Publish, sell, scan, get paid"
          subtitle="Same four beats for every event, whether it is 80 people in a room or 12,000 on a field."
        />
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {organizerSteps.map((step, index) => (
            <Card key={step.title} className="p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground-950 text-background-50">
                  <i className={cn(step.icon, "text-base")} />
                </span>
                <span className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-foreground-400">
                  Step {index + 1}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-foreground-950">{step.title}</h3>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-foreground-600">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 w-full max-w-[1400px] px-4 md:mt-16 md:px-6">
        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="p-5 md:p-6">
            <Badge tone="success">Verified organizer</Badge>
            <h2 className="mt-3 text-xl font-bold text-foreground-950 md:text-2xl">
              Verification is a real review, not a checkbox
            </h2>
            <p className="mt-2 max-w-lg text-[12.5px] leading-relaxed text-foreground-600">
              Any organizer can create events. The verified badge is granted only after a platform
              administrator reviews the business details. Applicants can track their status in the
              organizer workspace and resubmit if a document is rejected.
            </p>
            <div className="mt-4 rounded-md border border-background-200 bg-background-100 p-4">
              <p className="text-[10px] font-label font-bold uppercase tracking-wider text-foreground-500">
                What we ask for
              </p>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {requirements.map((item) => (
                  <li key={item} className="flex items-start gap-1.5 text-[11px] text-foreground-700">
                    <i className="ri-file-check-line mt-0.5 text-foreground-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/organizer/settings"
                className="inline-flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap rounded-btn bg-primary-500 px-4 text-xs font-semibold text-background-50 hover:bg-primary-600 dark:text-foreground-50"
              >
                <i className="ri-shield-check-line" /> Apply for verification
              </Link>
              <Link
                to="/admin/organizers"
                className="inline-flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap rounded-btn border border-background-300 px-4 text-xs font-semibold text-foreground-800 hover:bg-background-100"
              >
                <i className="ri-shield-star-line" /> Admin review queue
              </Link>
            </div>
          </Card>

          <div className="rounded-card border border-background-200 bg-background-50 p-5 md:p-6">
            <p className="text-[10px] font-label font-bold uppercase tracking-wider text-foreground-500">
              What changes once verified
            </p>
            <div className="mt-3 space-y-2.5">
              {[
                {
                  icon: "ri-verified-badge-line",
                  title: "Public verified badge",
                  body: "Your events and organizer profile carry the badge buyers look for.",
                },
                {
                  icon: "ri-bank-card-line",
                  title: "Withdrawals unlocked",
                  body: "Payout requests go to the account that was verified, not a random number.",
                },
                {
                  icon: "ri-user-star-line",
                  title: "Accountability",
                  body: "Verification can be revoked after serious disputes, refunds or fraud reports.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-md border border-background-200 p-3">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-accent-100 text-accent-800">
                    <i className={cn(item.icon, "text-sm")} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-semibold text-foreground-950">{item.title}</p>
                    <p className="mt-0.5 text-[10.5px] leading-relaxed text-foreground-600">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-foreground-500">
              Verification does not change your commission. Rates are set by the platform and shown on
              every order and earnings statement.
            </p>
          </div>
        </div>
      </section>

      <CommissionExplainer />

      <section className="mx-auto mt-12 w-full max-w-[1400px] px-4 md:mt-16 md:px-6">
        <SectionTitle eyebrow="Questions" title="The detail people ask about" align="center" />
        <div className="mx-auto mt-5 max-w-3xl divide-y divide-background-200 rounded-card border border-background-200 bg-background-50">
          {faqs.map((item, index) => (
            <div key={item.q}>
              <button
                onClick={() => setOpen(open === index ? -1 : index)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5 sm:py-4"
              >
                <span className="text-[12.5px] font-semibold text-foreground-950 sm:text-sm">{item.q}</span>
                <i
                  className={cn(
                    "flex-none text-foreground-400",
                    open === index ? "ri-subtract-line" : "ri-add-line"
                  )}
                />
              </button>
              {open === index && (
                <p className="animate-fade-up px-4 pb-3.5 text-[11.5px] leading-relaxed text-foreground-600 sm:px-5 sm:pb-4">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <CtaBand />
      <Toaster />
    </PublicLayout>
  );
}
