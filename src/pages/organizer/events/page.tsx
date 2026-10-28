import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardShell from "@/components/feature/DashboardShell";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, Card, EmptyState, Input, Modal, Progress, Select } from "@/components/base/ui";
import { cn, formatEventDate, formatKsh, formatNumber } from "@/lib/helpers";
import { organizerMobileNav, organizerNav } from "@/pages/organizer/nav";
import { useApp } from "@/store/AppStore";
import { useAuth } from "@/store/AuthProvider";
import { fetchEventsByOrganizer } from "@/lib/eventsApi";
import { supabase } from "@/lib/supabase";
import type { EventItem } from "@/types";

type EventStatus = "Live" | "Draft" | "Paused" | "Cancelled" | "Sold out" | "Completed";

function statusForEvent(event: EventItem): EventStatus {
  if (event.status === "cancelled" || event.status === "canceled") return "Cancelled";
  if (event.status === "paused") return "Paused";
  if (event.status === "draft") return "Draft";
  if (event.soldOut) return "Sold out";
  if (event.date < new Date().toISOString().slice(0, 10)) return "Completed";
  return "Live";
}

export default function OrganizerEventsPage() {
  const { pushToast } = useApp();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [statuses, setStatuses] = useState<Record<string, EventStatus>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [action, setAction] = useState<{ type: "pause" | "clone" | "cancel"; eventId: string } | null>(null);
  const [cancelConfirmation, setCancelConfirmation] = useState("");

  useEffect(() => {
    let active = true;

    const loadEvents = async () => {
      setEvents([]);
      setStatuses({});
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);
      try {
        const ownedEvents = await fetchEventsByOrganizer(user.id);
        if (!active) return;
        setEvents(ownedEvents);
        setStatuses(Object.fromEntries(ownedEvents.map((event) => [event.id, statusForEvent(event)])));
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : "Could not load your events.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadEvents();
    return () => {
      active = false;
    };
  }, [user]);

  const managed = useMemo(
    () => events,
    [events]
  );

  const filtered = managed.filter((event) => {
    const status = statuses[event.id];
    if (tab === "live" && status !== "Live") return false;
    if (tab === "draft" && status !== "Draft") return false;
    if (tab === "soldout" && status !== "Sold out") return false;
    if (query && !event.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const activeEvent = action ? managed.find((event) => event.id === action.eventId) : null;

  const applyAction = async () => {
    if (!action) return;
    if (action.type === "clone") {
      pushToast("Event cloning is not available yet.", "warning");
      setAction(null);
      return;
    }
    if (action.type === "pause") {
      const resume = statuses[action.eventId] === "Paused";
      const { error } = await supabase.from("events").update({ status: resume ? "upcoming" : "paused" }).eq("id", action.eventId).eq("organizer_id", user?.id);
      if (error) { pushToast(error.message, "danger"); return; }
      setStatuses((current) => ({ ...current, [action.eventId]: resume ? "Live" : "Paused" }));
      setEvents((current) => current.map((event) => event.id === action.eventId ? { ...event, status: resume ? "upcoming" : "paused" } : event));
      pushToast(resume ? "Ticket sales resumed." : "Ticket sales paused.", "success");
    }
    if (action.type === "cancel") {
      if (cancelConfirmation !== "CANCELLED") { pushToast("Type CANCELLED to confirm this action.", "warning"); return; }
      const { error } = await supabase.from("events").update({ status: "cancelled" }).eq("id", action.eventId).eq("organizer_id", user?.id);
      if (error) { pushToast(error.message, "danger"); return; }
      setStatuses((current) => ({ ...current, [action.eventId]: "Cancelled" }));
      setEvents((current) => current.map((event) => event.id === action.eventId ? { ...event, status: "cancelled" } : event));
      pushToast("Event cancelled. No refunds were issued; contact support to coordinate attendee refunds.", "warning");
    }
    setCancelConfirmation("");
    setAction(null);
  };

  return (
    <DashboardShell
      variant="organizer"
      nav={organizerNav}
      mobileNav={organizerMobileNav}
      userName="DalaLive Events"
      userRole="Verified organizer · Kisumu"
      initials="DL"
      title="My events"
      description="Create, publish and manage every event on your account"
      actions={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-field border border-background-300 bg-background-50 px-3 h-9">
              <i className="ri-search-line text-xs text-foreground-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search events"
                className="w-40 bg-transparent text-xs outline-none placeholder:text-foreground-400"
              />
            </div>
            <Select className="h-9 w-auto text-xs" defaultValue="all">
              <option value="all">All time</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </Select>
          </div>
          <Link to="/organizer/events/new">
            <Button size="sm">
              <i className="ri-add-line" /> Create event
            </Button>
          </Link>
        </div>
      }
    >
      <div className="mb-3 inline-flex rounded-full border border-background-300 bg-background-50 p-1">
        {[
          { id: "all", label: "All events" },
          { id: "live", label: "Live" },
          { id: "draft", label: "Drafts" },
          { id: "soldout", label: "Sold out" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors",
              tab === item.id ? "bg-foreground-950 text-background-50" : "text-foreground-600"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-foreground-600">Loading your events…</div>
      ) : loadError ? (
        <div role="alert" className="rounded-md border border-primary-200 bg-primary-50 p-4 text-sm text-primary-900">
          Could not load your events: {loadError}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="ri-calendar-2-line"
          title={managed.length === 0 ? "You haven’t created any events yet" : "No events in this view"}
          description="Create your first event and publish it in minutes with the guided wizard."
          action={
            <Link to="/organizer/events/new">
              <Button>Create an event</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((event) => {
            const status = statuses[event.id];
            const soldPercent = Math.round((event.ticketsSold / event.capacity) * 100);
            return (
              <Card key={event.id} className="p-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="h-24 w-full flex-none overflow-hidden rounded-md md:h-20 md:w-32">
                    <img
                      src={event.image}
                      alt={event.title}
                      title={event.title}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-foreground-950">{event.title}</p>
                      <Badge tone={status === "Live" ? "success" : status === "Draft" ? "neutral" : status === "Paused" ? "warning" : "danger"}>
                        {status}
                      </Badge>
                      <Badge tone="neutral">{event.category}</Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-foreground-500">
                      {formatEventDate(event.date)} · {event.venue}, {event.city}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-foreground-600">
                      <span className="font-num">
                        {formatNumber(event.ticketsSold)} sold · {formatKsh(event.priceFrom)} from
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="ri-group-line" /> {formatNumber(event.capacity - event.ticketsSold)} left
                      </span>
                    </div>
                    <div className="mt-2 max-w-xs">
                      <Progress value={soldPercent} tone={soldPercent >= 100 ? "foreground" : "primary"} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 md:flex-col md:items-end">
                    <Link to={`/events/${event.slug}`}>
                      <Button size="sm" variant="outline">
                        <i className="ri-external-link-line" /> Public page
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost" disabled title="Event editing is not available yet"><i className="ri-edit-line" /> Edit</Button>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setAction({ type: "pause", eventId: event.id })}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-background-300 text-foreground-600 hover:bg-background-100"
                        aria-label="Pause or resume sales"
                      >
                        <i className={status === "Paused" ? "ri-play-line" : "ri-pause-line"} />
                      </button>
                      <button
                        disabled
                        title="Event cloning is not available yet"
                        onClick={() => setAction({ type: "clone", eventId: event.id })}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-background-300 text-foreground-600 hover:bg-background-100"
                        aria-label="Clone event"
                      >
                        <i className="ri-file-copy-2-line" />
                      </button>
                      <button
                        onClick={() => setAction({ type: "cancel", eventId: event.id })}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-primary-300 text-primary-700 hover:bg-primary-50"
                        aria-label="Cancel event"
                      >
                        <i className="ri-close-circle-line" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(action)}
        onClose={() => { setAction(null); setCancelConfirmation(""); }}
        title={
          action?.type === "pause"
            ? statuses[action.eventId] === "Paused"
              ? "Resume ticket sales?"
              : "Pause ticket sales?"
            : action?.type === "clone"
            ? "Clone this event?"
            : "Cancel this event?"
        }
        description={
          action?.type === "cancel"
            ? "This removes the event from public sale. It does not issue refunds; contact support to coordinate refunds until the bank settlement API is connected."
            : action?.type === "clone"
            ? "A draft copy is created with the same tiers. Dates and inventory are not copied automatically."
            : "You can resume any time. Live scans are unaffected."
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => { setAction(null); setCancelConfirmation(""); }}>
              Keep as is
            </Button>
            <Button variant={action?.type === "cancel" ? "danger" : "primary"} onClick={applyAction}>
              {action?.type === "cancel" ? "Cancel event" : "Confirm"}
            </Button>
          </>
        }
      >
        {activeEvent && (
          <div className="rounded-md border border-background-200 p-3">
            <p className="text-xs font-bold text-foreground-950">{activeEvent.title}</p>
            <p className="mt-1 text-[11px] text-foreground-500">
              {formatEventDate(activeEvent.date)} · {formatNumber(activeEvent.ticketsSold)} tickets sold ·{" "}
              {formatKsh(activeEvent.ticketsSold * activeEvent.priceFrom, { compact: true })} gross
            </p>
          </div>
        )}
        {action?.type === "cancel" && (
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] font-semibold text-foreground-700">Type CANCELLED to confirm</p>
            <Input value={cancelConfirmation} onChange={(event) => setCancelConfirmation(event.target.value)} placeholder="CANCELLED" />
          </div>
        )}
      </Modal>
      <Toaster />
    </DashboardShell>
  );
}
