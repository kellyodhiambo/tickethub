import { useMemo, useState } from "react";
import DashboardShell from "@/components/feature/DashboardShell";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, Card, EmptyState, Modal, Select, TableWrap, Td, Th } from "@/components/base/ui";
import { formatKsh } from "@/lib/helpers";
import { organizerMobileNav, organizerNav } from "@/pages/organizer/nav";
import { orders } from "@/mocks/dashboard";
import { events } from "@/mocks/events";
import { useApp } from "@/store/AppStore";

export default function OrganizerOrdersPage() {
  const { pushToast } = useApp();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);

  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        const q = query.trim().toLowerCase();
        const matchesQuery =
          !q ||
          [order.buyer, order.reference, order.phone, order.tier].join(" ").toLowerCase().includes(q);
        const matchesStatus = status === "all" || order.status.toLowerCase() === status;
        const matchesEvent = eventFilter === "all" || order.eventSlug === eventFilter;
        return matchesQuery && matchesStatus && matchesEvent;
      }),
    [query, status, eventFilter]
  );

  const active = orders.find((order) => order.id === activeId);

  const exportCsv = () => {
    const rows = [
      ["Reference", "Buyer", "Phone", "Event", "Tier", "Qty", "Total", "Commission", "Status", "Channel", "Created"],
      ...filtered.map((order) => [
        order.reference,
        order.buyer,
        order.phone,
        events.find((event) => event.slug === order.eventSlug)?.title ?? order.eventSlug,
        order.tier,
        String(order.quantity),
        String(order.total),
        String(order.commission),
        order.status,
        order.channel,
        order.createdAt,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "dala-orders.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    pushToast("CSV exported with the filtered rows.", "success");
  };

  return (
    <DashboardShell
      variant="organizer"
      nav={organizerNav}
      mobileNav={organizerMobileNav}
      userName="DalaLive Events"
      userRole="Verified organizer · Kisumu"
      initials="DL"
      title="Orders"
      description="Every purchase, payment status and commission split"
      actions={
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <div className="flex h-9 items-center gap-2 rounded-field border border-background-300 bg-background-50 px-3">
              <i className="ri-search-line text-xs text-foreground-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, reference, phone"
                className="w-44 bg-transparent text-xs outline-none placeholder:text-foreground-400"
              />
            </div>
            <Select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 w-auto text-xs">
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </Select>
            <Select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)} className="h-9 w-auto text-xs">
              <option value="all">All events</option>
              {events.slice(0, 6).map((event) => (
                <option key={event.slug} value={event.slug}>
                  {event.title}
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
          { label: "Orders", value: String(orders.length) },
          { label: "Paid", value: String(orders.filter((order) => order.status === "Paid").length) },
          { label: "Awaiting payment", value: String(orders.filter((order) => order.status === "Pending").length) },
          { label: "Gross from this view", value: formatKsh(filtered.filter((order) => order.status === "Paid").reduce((sum, order) => sum + order.total, 0), { compact: true }) },
        ].map((item) => (
          <Card key={item.label} className="p-3">
            <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-foreground-500">{item.label}</p>
            <p className="mt-1 font-num text-lg font-bold text-foreground-950">{item.value}</p>
          </Card>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="ri-shopping-bag-3-line"
          title="No orders match these filters"
          description="Try a different status, event or search term."
          action={<Button variant="outline" onClick={() => { setQuery(""); setStatus("all"); setEventFilter("all"); }}>Reset filters</Button>}
        />
      ) : (
        <>
          <div className="hidden lg:block">
            <TableWrap>
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Buyer</Th>
                  <Th>Event & tier</Th>
                  <Th>Total</Th>
                  <Th>Commission</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-background-50">
                    <Td>
                      <p className="font-num text-xs font-semibold text-foreground-950">{order.reference}</p>
                      <p className="text-[10px] text-foreground-500">{order.createdAt}</p>
                    </Td>
                    <Td>
                      <p className="text-xs font-semibold text-foreground-900">{order.buyer}</p>
                      <p className="text-[10px] text-foreground-500">{order.phone}</p>
                    </Td>
                    <Td>
                      <p className="text-xs text-foreground-800">{events.find((event) => event.slug === order.eventSlug)?.title}</p>
                      <p className="text-[10px] text-foreground-500">
                        {order.quantity} × {order.tier}
                      </p>
                    </Td>
                    <Td className="font-num text-xs font-semibold">{formatKsh(order.total)}</Td>
                    <Td className="font-num text-xs text-foreground-600">{formatKsh(order.commission)}</Td>
                    <Td>
                      <Badge tone={order.status === "Paid" ? "success" : order.status === "Pending" ? "warning" : order.status === "Refunded" ? "neutral" : "danger"}>
                        {order.status}
                      </Badge>
                    </Td>
                    <Td>
                      <button
                        onClick={() => setActiveId(order.id)}
                        className="cursor-pointer text-[11px] font-semibold text-primary-700"
                      >
                        Details
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </div>

          <div className="space-y-2.5 lg:hidden">
            {filtered.map((order) => (
              <Card key={order.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground-950">{order.buyer}</p>
                    <p className="font-num text-[10px] text-foreground-500">{order.reference}</p>
                  </div>
                  <Badge tone={order.status === "Paid" ? "success" : order.status === "Pending" ? "warning" : order.status === "Refunded" ? "neutral" : "danger"}>
                    {order.status}
                  </Badge>
                </div>
                <p className="mt-1.5 text-[11px] text-foreground-600">
                  {order.quantity} × {order.tier} · {events.find((event) => event.slug === order.eventSlug)?.title}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-num text-sm font-bold text-foreground-950">{formatKsh(order.total)}</span>
                  <button onClick={() => setActiveId(order.id)} className="cursor-pointer text-[11px] font-semibold text-primary-700">
                    View details
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal
        open={Boolean(active)}
        onClose={() => setActiveId(null)}
        title="Order details"
        description={active ? `${active.reference} · ${active.createdAt}` : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setActiveId(null)}>
              Close
            </Button>
            <Button variant="outline" onClick={() => pushToast("Ticket resent to the buyer by email and SMS.", "success")}>
              Resend tickets
            </Button>
            <Button variant="danger" onClick={() => setRefundOpen(true)}>
              Refund order
            </Button>
          </>
        }
      >
        {active && (
          <div className="space-y-2 text-xs">
            {[
              ["Buyer", active.buyer],
              ["Phone", active.phone],
              ["Event", events.find((event) => event.slug === active.eventSlug)?.title ?? active.eventSlug],
              ["Category", `${active.quantity} × ${active.tier}`],
              ["Total paid", formatKsh(active.total)],
              ["Platform commission", formatKsh(active.commission)],
              ["Organizer allocation", formatKsh(Math.round(active.total * 0.9))],
              ["Payment channel", active.channel],
              ["Status", active.status],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-background-100 pb-1.5">
                <span className="text-foreground-500">{label}</span>
                <span className="font-semibold text-foreground-950">{value}</span>
              </div>
            ))}
            <p className="pt-1 text-[10px] leading-relaxed text-foreground-500">
              Ticket status and scan history for this order are shown on the Attendees page. Refunds are
              recorded in the financial ledger and reverse the commission proportionally.
            </p>
          </div>
        )}
      </Modal>

      <Modal
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        title="Confirm refund"
        description="This reverses the organizer allocation and platform commission for the order."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRefundOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setRefundOpen(false);
                setActiveId(null);
                pushToast("Refund queued — provider confirmation pending.", "warning");
              }}
            >
              Confirm refund
            </Button>
          </>
        }
      >
        <p className="text-xs leading-relaxed text-foreground-700">
          Refunds are only processed when the payment provider confirms the reversal. Until then the
          order stays marked as pending refund, so your statement remains accurate.
        </p>
      </Modal>
      <Toaster />
    </DashboardShell>
  );
}
