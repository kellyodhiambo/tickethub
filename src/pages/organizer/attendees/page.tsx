import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/feature/DashboardShell";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, Card, EmptyState, Modal, Select, TableWrap, Td, Th } from "@/components/base/ui";
import { organizerMobileNav, organizerNav } from "@/pages/organizer/nav";
import { useApp } from "@/store/AppStore";
import { useAuth } from "@/store/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { WalletTicket } from "@/types";

type AttendeeTicket = WalletTicket & { eventTitle: string };

export default function AttendeesPage() {
  const { pushToast } = useApp();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<AttendeeTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [activeTicket, setActiveTicket] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user?.id) { setTickets([]); setLoading(false); return; }
      setLoadError(null);
      const { data, error } = await supabase
        .from("tickets")
        .select("id,event_id,tier_name,qr_code,status,payment_status,payment_reference,order_reference,attendee,buyer_name,created_at,gate,scanned_at,events!inner(slug,title,organizer_id)")
        .eq("events.organizer_id", user.id)
        .in("payment_status", ["completed", "paid"])
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) setLoadError(error.message);
      else setTickets((data ?? []).map((raw) => {
        const row = raw as Record<string, unknown>;
        const event = row.events as { slug?: string; title?: string };
        const statusValue = String(row.status ?? "").toLowerCase();
        return {
          id: String(row.id), code: String(row.qr_code ?? ""),
          orderReference: String(row.order_reference ?? row.payment_reference ?? ""),
          eventSlug: String(event.slug ?? row.event_id), eventTitle: String(event.title ?? "Event"),
          tier: String(row.tier_name ?? "General"), attendee: String(row.attendee ?? row.buyer_name ?? "Ticket holder"),
          status: statusValue === "used" || Boolean(row.scanned_at) ? "Used" : statusValue === "cancelled" ? "Cancelled" : "Valid",
          issuedAt: String(row.created_at ?? "").slice(0, 10),
          gate: row.gate ? String(row.gate) : undefined,
          scannedAt: row.scanned_at ? String(row.scanned_at) : undefined,
        };
      }));
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [user?.id]);

  const rows = useMemo(
    () =>
      tickets,
    [tickets]
  );

  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || [row.attendee, row.code, row.orderReference, row.tier].join(" ").toLowerCase().includes(q);
    const matchesStatus = status === "all" || row.status.toLowerCase() === status;
    const matchesEvent = eventFilter === "all" || row.eventSlug === eventFilter;
    return matchesQuery && matchesStatus && matchesEvent;
  });

  const active = rows.find((row) => row.code === activeTicket);

  const exportCsv = () => {
    const csv = [
      ["Ticket ID", "Attendee", "Event", "Category", "Status", "Order", "Issued", "Gate", "Scanned"],
      ...filtered.map((row) => [
        row.code,
        row.attendee,
        row.eventTitle,
        row.tier,
        row.status,
        row.orderReference,
        row.issuedAt,
        row.gate ?? "",
        row.scannedAt ?? "",
      ]),
    ]
      .map((line) => line.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "dala-attendees.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    pushToast("Attendee list exported.", "success");
  };

  return (
    <DashboardShell
      variant="organizer"
      nav={organizerNav}
      mobileNav={organizerMobileNav}
      userName="DalaLive Events"
      userRole="Verified organizer · Kisumu"
      initials="DL"
      title="Attendees"
      description="Ticket holders, check-in state and entry history"
      actions={
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <div className="flex h-9 items-center gap-2 rounded-field border border-background-300 bg-background-50 px-3">
              <i className="ri-search-line text-xs text-foreground-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Attendee, ticket ID, order"
                className="w-44 bg-transparent text-xs outline-none placeholder:text-foreground-400"
              />
            </div>
            <Select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 w-auto text-xs">
              <option value="all">All tickets</option>
              <option value="valid">Valid</option>
              <option value="used">Checked in</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            <Select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)} className="h-9 w-auto text-xs">
              <option value="all">All events</option>
              {[...new Map(tickets.map((ticket) => [ticket.eventSlug, ticket.eventTitle])).entries()].map(([slug, title]) => (
                <option key={slug} value={slug}>
                  {title}
                </option>
              ))}
            </Select>
          </div>
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <i className="ri-download-2-line" /> Export CSV
          </Button>
        </div>
      }
    >
      <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          { label: "Tickets issued", value: String(rows.length) },
          { label: "Checked in", value: String(rows.filter((row) => row.status === "Used").length) },
          { label: "Still valid", value: String(rows.filter((row) => row.status === "Valid").length) },
          { label: "Attendance rate", value: `${Math.round((rows.filter((row) => row.status === "Used").length / Math.max(1, rows.length)) * 100)}%` },
        ].map((item) => (
          <Card key={item.label} className="p-3">
            <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-foreground-500">{item.label}</p>
            <p className="mt-1 font-num text-lg font-bold text-foreground-950">{item.value}</p>
          </Card>
        ))}
      </div>

      {loading ? <p className="py-8 text-center text-sm text-foreground-500">Loading attendees…</p> : loadError ? <p role="alert" className="py-8 text-center text-sm text-accent-700">{loadError}</p> : filtered.length === 0 ? (
        <EmptyState
          icon="ri-group-line"
          title="No attendees in this view"
          description="Tickets appear here as soon as a payment is confirmed."
          action={<Button variant="outline" onClick={exportCsv}>Export current view</Button>}
        />
      ) : (
        <>
          <div className="hidden lg:block">
            <TableWrap>
              <thead>
                <tr>
                  <Th>Attendee</Th>
                  <Th>Ticket ID</Th>
                  <Th>Event</Th>
                  <Th>Category</Th>
                  <Th>Status</Th>
                  <Th>Gate</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <Td>
                      <p className="text-xs font-semibold text-foreground-900">{row.attendee}</p>
                      <p className="text-[10px] text-foreground-500">{row.orderReference}</p>
                    </Td>
                    <Td className="font-num text-[11px]">{row.code}</Td>
                    <Td className="text-xs">{row.eventTitle}</Td>
                    <Td className="text-xs">{row.tier}</Td>
                    <Td>
                      <Badge tone={row.status === "Valid" ? "success" : row.status === "Used" ? "neutral" : "danger"}>{row.status}</Badge>
                    </Td>
                    <Td className="text-[11px] text-foreground-600">{row.gate ?? "—"}</Td>
                    <Td>
                      <button onClick={() => setActiveTicket(row.code)} className="cursor-pointer text-[11px] font-semibold text-primary-700">
                        Details
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </div>

          <div className="space-y-2.5 lg:hidden">
            {filtered.map((row) => (
              <Card key={row.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground-950">{row.attendee}</p>
                    <p className="font-num text-[10px] text-foreground-500">{row.code}</p>
                  </div>
                  <Badge tone={row.status === "Valid" ? "success" : row.status === "Used" ? "neutral" : "danger"}>{row.status}</Badge>
                </div>
                <p className="mt-1 text-[11px] text-foreground-600">
                  {row.eventTitle} · {row.tier}
                </p>
                <button onClick={() => setActiveTicket(row.code)} className="mt-2 cursor-pointer text-[11px] font-semibold text-primary-700">
                  View ticket details
                </button>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal
        open={Boolean(active)}
        onClose={() => setActiveTicket(null)}
        title="Ticket record"
        description={active ? active.code : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setActiveTicket(null)}>
              Close
            </Button>
            <Button variant="outline" disabled title="Ticket reissue is not implemented yet">
              Reissue ticket
            </Button>
            <Button variant="danger" disabled title="Ticket state changes must use a server-side workflow">
              Cancel ticket
            </Button>
          </>
        }
      >
        {active && (
          <div className="space-y-2 text-xs">
            {[
              ["Attendee", active.attendee],
              ["Event", active.eventTitle],
              ["Category", active.tier],
              ["Status", active.status],
              ["Issued", active.issuedAt],
              ["Gate", active.gate ?? "Not scanned"],
              ["Scanned at", active.scannedAt ?? "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-background-100 pb-1.5">
                <span className="text-foreground-500">{label}</span>
                <span className="font-semibold text-foreground-950">{value}</span>
              </div>
            ))}
            <p className="pt-1 text-[10px] leading-relaxed text-foreground-500">
              Sensitive attendee data is only shown to authorized organizer staff. Gate staff with
              scanner-only access never see this page.
            </p>
          </div>
        )}
      </Modal>
      <Toaster />
    </DashboardShell>
  );
}
