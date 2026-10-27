import type { RefObject } from "react";
import QrCode from "@/components/feature/QrCode";
import { cn, formatEventDate } from "@/lib/helpers";
import { tierTheme } from "@/lib/tierTheme";
import type { EventItem, WalletTicket } from "@/types";

/**
 * The ticket artwork itself. It is deliberately rendered on "paper"
 * (always light tokens) so a screenshot / export looks like a real ticket
 * whether the visitor is using light or dark mode.
 */
export default function TicketStub({
  ticket,
  event,
  nodeRef,
  className,
}: {
  ticket: WalletTicket;
  event: EventItem;
  nodeRef?: RefObject<HTMLDivElement | null>;
  className?: string;
}) {
  const tone = tierTheme(ticket.tier);

  return (
    <div
      ref={nodeRef}
      id="ticket-stub"
      className={cn(
        "ticket-paper overflow-hidden rounded-card border border-background-200 bg-background-50",
        className
      )}
    >
      {/* cover */}
      <div className="relative h-[172px] w-full overflow-hidden bg-foreground-950 md:h-[214px]">
        <img
          src={event.image}
          alt={event.title}
          title={`${event.title} ticket`}
          className="h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3.5 md:p-4">
          <span className="flex items-center gap-1.5 rounded-full border border-white/25 bg-black/35 px-2.5 py-1 text-[8.5px] font-label font-bold uppercase tracking-[0.24em] text-white/85 md:text-[9px]">
            <i className="ri-ticket-2-line text-[11px]" /> Dala Tickets
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-[8.5px] font-label font-bold uppercase tracking-[0.16em] text-black md:text-[9px]">
            {ticket.status === "Valid" ? "Admit one" : ticket.status}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-3.5 md:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "tier-chip inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-label font-bold uppercase tracking-[0.14em]",
                tone.root
              )}
            >
              <span className="tier-dot h-1 w-1 rounded-full" />
              {ticket.tier}
            </span>
            <span className="text-[9px] font-label uppercase tracking-[0.2em] text-white/60">
              {event.category}
            </span>
          </div>
          <h1 className="mt-1.5 font-display text-[23px] leading-[1.1] text-white md:text-[34px]">
            {event.title}
          </h1>
          <p className="mt-1.5 text-[10.5px] font-medium text-white/75 md:text-xs">
            {formatEventDate(event.date)} · {event.startTime} · {event.venue}, {event.city}
          </p>
        </div>
      </div>

      {/* body */}
      <div className="grid gap-4 px-4 py-5 md:grid-cols-[auto_1fr] md:gap-6 md:px-6 md:py-6">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-lg border border-background-200 bg-background-50 p-2">
            <QrCode value={ticket.code} size={148} />
          </div>
          <p className="font-num text-[10.5px] font-bold tracking-[0.22em] text-foreground-800">
            {ticket.code}
          </p>
          <p className="text-[8.5px] font-label uppercase tracking-[0.18em] text-foreground-500">
            Scan at gate
          </p>
        </div>

        <div className="min-w-0">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label="Attendee" value={ticket.attendee} />
            <Field label="Category" value={ticket.tier} />
            <Field label="Date" value={formatEventDate(event.date)} />
            <Field label="Entry window" value={`${event.startTime} — ${event.endTime}`} />
            <Field label="Venue" value={`${event.venue}, ${event.city}`} />
            <Field label="Order" value={ticket.orderReference} mono />
          </dl>

          <div className="mt-4 flex items-start gap-2 border-t border-dashed border-background-300 pt-3 text-[9.5px] leading-relaxed text-foreground-600">
            <i className="ri-information-line mt-px text-[12px]" />
            <span>
              {event.ageLimit} · {event.requirements}. This ticket admits one person and is
              scanned once.
            </span>
          </div>
        </div>
      </div>

      {/* stay partner band — on every ticket */}
      <a
        href="https://nyumbanilink.com"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 border-t border-dashed border-background-300 bg-background-100 px-4 py-3 md:px-6"
      >
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md border border-background-200 bg-background-50 text-foreground-800">
          <i className="ri-hotel-bed-line text-[13px]" />
        </span>
        <span className="min-w-0">
          <span className="block text-[8.5px] font-label font-bold uppercase tracking-[0.2em] text-foreground-500">
            Need a place to stay?
          </span>
          <span className="mt-0.5 block truncate text-[11.5px] font-bold text-foreground-950">
            nyumbanilink.com — Airbnbs &amp; hotels in {event.city}
          </span>
        </span>
        <span className="ml-auto hidden flex-none items-center gap-1 rounded-full border border-background-300 bg-background-50 px-2.5 py-1 text-[9px] font-label font-bold uppercase tracking-[0.12em] text-foreground-800 sm:inline-flex">
          Book
          <i className="ri-arrow-right-up-line transition-transform group-hover:-translate-y-0.5" />
        </span>
      </a>

      <div className="flex items-center justify-between gap-3 border-t border-background-200 px-4 py-2.5 text-[8.5px] font-label uppercase tracking-[0.16em] text-foreground-500 md:px-6">
        <span className="truncate">Issued by Dala Tickets for {event.organizerName}</span>
        <span className="flex-none font-num tracking-normal">{ticket.orderReference}</span>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[8.5px] font-label font-bold uppercase tracking-[0.16em] text-foreground-500">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 truncate text-[11.5px] font-semibold text-foreground-950",
          mono && "font-num"
        )}
      >
        {value}
      </dd>
    </div>
  );
}