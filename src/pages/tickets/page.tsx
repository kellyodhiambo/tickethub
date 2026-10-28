import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "@/components/feature/PublicLayout";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, EmptyState } from "@/components/base/ui";
import QrCode from "@/components/feature/QrCode";
import { cn, formatEventDate, formatKsh } from "@/lib/helpers";
import { tierTheme } from "@/lib/tierTheme";
import { useEvents } from "@/hooks/useEvents";
import { useApp } from "@/store/AppStore";

const tabs = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past & used" },
  { id: "orders", label: "Order history" },
];

export default function MyTicketsPage() {
  const { tickets, orders } = useApp();
  const { events } = useEvents();
  const [tab, setTab] = useState("upcoming");
  const attendedEventCount = new Set(tickets.filter((ticket) => ticket.status === "Used").map((ticket) => ticket.eventSlug)).size;

  const enriched = useMemo(
    () =>
      tickets.map((ticket) => ({
        ...ticket,
        event: events.find((item) => item.slug === ticket.eventSlug),
      })),
    [tickets]
  );

  const upcoming = enriched.filter((item) => item.status === "Valid");
  const past = enriched.filter((item) => item.status !== "Valid");

  return (
    <PublicLayout>
      <div className="border-b border-background-200 bg-background-100">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-7 md:px-6 md:py-9">
          <h1 className="text-2xl font-extrabold text-foreground-950 md:text-3xl">My tickets</h1>
          <p className="mt-1.5 max-w-xl text-sm text-foreground-600">
            Your wallet for every event. Open a ticket at the gate — the QR code is scanned once and
            then locked.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 rounded-full bg-background-50 px-2.5 py-1 font-semibold text-foreground-800">
              <i className="ri-ticket-2-line text-primary-600" /> {upcoming.length} valid tickets
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-background-50 px-2.5 py-1 font-semibold text-foreground-800">
              <i className="ri-history-line text-foreground-500" /> {past.length} used or expired
            </span>
            <Link
              to="/discover"
              className="flex items-center gap-1.5 rounded-full bg-primary-500 px-2.5 py-1 font-semibold text-background-50"
            >
              <i className="ri-add-line" /> Find another event
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6">
        <div className="mb-5 inline-flex rounded-full border border-background-300 bg-background-50 p-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "cursor-pointer whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
                tab === item.id ? "bg-foreground-950 text-background-50" : "text-foreground-600 hover:text-foreground-950"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "orders" ? (
          <div className="space-y-2">
            {orders.slice(0, 6).map((order) => {
              const event = events.find((item) => item.slug === order.eventSlug);
              return (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 rounded-card border border-background-200 bg-background-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground-950">{event?.title ?? order.eventSlug}</p>
                    <p className="mt-0.5 text-[11px] text-foreground-500">
                      {order.reference} · {order.quantity} × {order.tier} · {order.createdAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-num text-sm font-bold text-foreground-950">{formatKsh(order.total)}</span>
                    <Badge dot>{order.status}</Badge>
                    {order.status === "Paid" && (
                      <Link to="/tickets" className="text-[11px] font-semibold text-primary-700">
                        Receipt
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (tab === "upcoming" ? upcoming : past).length === 0 ? (
          <EmptyState
            icon="ri-ticket-2-line"
            title={tab === "upcoming" ? "No upcoming tickets yet" : "Nothing here yet"}
            description="Tickets you buy will appear here instantly with a QR code ready for the gate."
            action={
              <Link to="/discover">
                <Button>Discover events</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {(tab === "upcoming" ? upcoming : past).map((ticket) => (
              <div
                key={ticket.id}
                className="flex flex-col gap-4 rounded-card border border-background-200 bg-background-50 p-4 sm:flex-row"
              >
                <div className="flex-shrink-0">
                  <QrCode value={ticket.code} size={112} tone={ticket.status === "Valid" ? "dark" : "light"} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-bold text-foreground-950">
                      {ticket.event?.title ?? ticket.eventSlug}
                    </p>
                    <Badge tone={ticket.status === "Valid" ? "success" : ticket.status === "Used" ? "neutral" : "danger"}>
                      {ticket.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-foreground-500">
                    {ticket.event ? `${formatEventDate(ticket.event.date)} · ${ticket.event.startTime}` : ""}
                  </p>
                  <p className="text-[11px] text-foreground-500">
                    {ticket.event ? `${ticket.event.venue}, ${ticket.event.city}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                    <span
                      className={cn(
                        "tier-chip inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold",
                        tierTheme(ticket.tier).root
                      )}
                    >
                      <span className="tier-dot h-1 w-1 rounded-full" />
                      {ticket.tier}
                    </span>
                    <span className="font-num text-foreground-600">{ticket.code}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link to={`/tickets/${ticket.code}`}>
                      <Button size="sm" variant={ticket.status === "Valid" ? "primary" : "outline"}>
                        View ticket
                      </Button>
                    </Link>
                    {ticket.status === "Used" && (
                      <span className="flex items-center gap-1 text-[10px] text-foreground-500">
                        <i className="ri-check-double-line" /> Scanned at {ticket.gate} · {ticket.scannedAt}
                      </span>
                    )}
                  </div>
                  <a
                    href="https://nyumbanilink.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1.5 rounded-md border border-background-200 bg-background-100 px-2 py-1.5 text-[10px] font-medium text-foreground-600 transition-colors hover:border-foreground-400 hover:text-foreground-950"
                  >
                    <i className="ri-hotel-bed-line text-[12px]" />
                    <span className="truncate">
                      Need a stay{ticket.event ? ` in ${ticket.event.city}` : ""}? nyumbanilink.com
                    </span>
                    <i className="ri-arrow-right-up-line ml-auto flex-none text-[10px]" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {[
            { icon: "ri-download-2-line", title: "Download before you travel", body: "Tickets work offline once opened. Save a copy in case the network drops." },
            { icon: "ri-share-forward-line", title: "Ticket transfers", body: "Transfers are currently disabled until a secure ownership transfer flow is available." },
            { icon: "ri-notification-3-line", title: "Event updates", body: "Manage in-app and email notification preferences from your account." },
          ].map((item) => (
            <div key={item.title} className="rounded-card border border-background-200 bg-background-50 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary-100 text-secondary-900">
                <i className={item.icon} />
              </span>
              <p className="mt-3 text-xs font-bold text-foreground-950">{item.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-foreground-600">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-card border border-background-200 bg-background-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-foreground-950">Events attended</p>
            <span className="text-[11px] text-foreground-500">{attendedEventCount} event{attendedEventCount === 1 ? "" : "s"}</span>
          </div>
          <p className="mt-2 text-[11px] text-foreground-600">
            Attendance is counted from tickets scanned at the gate. Loyalty credits are not enabled yet.
          </p>
        </div>
      </div>
      <Toaster />
    </PublicLayout>
  );
}
