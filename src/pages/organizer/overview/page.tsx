import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardShell from "@/components/feature/DashboardShell";
import { Toaster } from "@/components/feature/Toaster";
import { CategoryBarChart, SalesAreaChart } from "@/components/feature/Charts";
import { Badge, Button, Card, Progress, Select, StatCard, TableWrap, Td, Th } from "@/components/base/ui";
import { formatKsh, formatNumber } from "@/lib/helpers";
import { organizerMobileNav, organizerNav } from "@/pages/organizer/nav";
import { useOrganizerData } from "@/hooks/useOrganizerData";

export default function OrganizerOverviewPage() {
  const [range, setRange] = useState("30");
  const [eventFilter, setEventFilter] = useState("all");
  const { events: liveEvents, orders, tickets, loading, error } = useOrganizerData();
  const paidOrders = orders.filter((order) => order.status === "Paid");
  const grossSales = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const commission = paidOrders.reduce((sum, order) => sum + order.commission, 0);
  const ticketsSold = paidOrders.reduce((sum, order) => sum + order.quantity, 0);
  const checkedIn = tickets.filter((ticket) => Boolean(ticket.scannedAt)).length;
  const organizerKpis = {
    grossSales, commission, providerFees: 0, netEarnings: grossSales - commission,
    availableBalance: 0, pendingSettlement: 0, ticketsSold, checkedIn,
  };
  const salesTrend = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const order of paidOrders) {
      const date = order.createdAt.slice(0, 10);
      byDate.set(date, (byDate.get(date) ?? 0) + order.total);
    }
    return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([label, sales]) => ({ label: label.slice(5), sales }));
  }, [paidOrders]);
  const categorySales = useMemo(() => {
    const byTier = new Map<string, number>();
    for (const order of paidOrders) byTier.set(order.tier, (byTier.get(order.tier) ?? 0) + order.total);
    return [...byTier.entries()].map(([label, value]) => ({ label, value, color: "primary" }));
  }, [paidOrders]);
  const eventPerformance = liveEvents.map((event) => {
    const eventOrders = paidOrders.filter((order) => order.eventId === event.id);
    const sold = eventOrders.reduce((sum, order) => sum + order.quantity, 0);
    return { name: event.title, sold, capacity: event.capacity, revenue: eventOrders.reduce((sum, order) => sum + order.total, 0), attendance: sold ? Math.round((tickets.filter((ticket) => ticket.eventId === event.id && ticket.scannedAt).length / sold) * 100) : 0 };
  });

  return (
    <DashboardShell
      variant="organizer"
      nav={organizerNav}
      mobileNav={organizerMobileNav}
      userName="DalaLive Events"
      userRole="Verified organizer · Kisumu"
      initials="DL"
      title="Overview"
      description="Sales, earnings and gate performance across all your events"
      actions={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={range} onChange={(event) => setRange(event.target.value)} className="h-9 w-auto text-xs">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </Select>
            <Select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)} className="h-9 w-auto text-xs">
              <option value="all">All events</option>
              {liveEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2">
            <Link to="/organizer/withdrawals">
              <Button size="sm" variant="outline">
                <i className="ri-bank-card-line" /> Withdraw
              </Button>
            </Link>
            <Link to="/organizer/events/new">
              <Button size="sm">
                <i className="ri-add-line" /> New event
              </Button>
            </Link>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Gross ticket sales" value={formatKsh(organizerKpis.grossSales, { compact: true })} icon="ri-line-chart-line" hint="Recorded paid orders" />
        <StatCard label="Recorded commission" value={formatKsh(organizerKpis.commission, { compact: true })} icon="ri-percent-line" tone="secondary" hint="From paid order records" />
        <StatCard label="Net organizer earnings" value={formatKsh(organizerKpis.netEarnings, { compact: true })} icon="ri-wallet-3-line" tone="accent" hint="After commission & fees" />
        <StatCard label="Available to withdraw" value="Unavailable" icon="ri-bank-card-line" hint="Settlement API pending" />
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-accent-700">{error}</p>}
      {loading && <p className="mt-3 text-sm text-foreground-500">Loading live event and order data…</p>}

      <div className="mt-2.5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Pending settlement" value="Unavailable" icon="ri-time-line" tone="secondary" hint="Bank settlement API pending" />
        <StatCard label="Tickets sold" value={formatNumber(organizerKpis.ticketsSold)} icon="ri-ticket-2-line" tone="accent" />
        <StatCard label="Checked in" value={formatNumber(organizerKpis.checkedIn)} icon="ri-qr-scan-line" hint={`${organizerKpis.ticketsSold ? Math.round((organizerKpis.checkedIn / organizerKpis.ticketsSold) * 100) : 0}% attendance`} />
        <StatCard label="Refunds issued" value="Unavailable" icon="ri-refund-2-line" tone="foreground" hint="Refund processing is not connected" />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-foreground-950">Sales trend</p>
              <p className="text-[11px] text-foreground-500">Gross sales per day, before commission and fees</p>
            </div>
            <Badge tone="success">Live</Badge>
          </div>
          <div className="mt-3">
            <SalesAreaChart data={salesTrend} dataKey="sales" />
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-bold text-foreground-950">Sales by ticket category</p>
          <p className="text-[11px] text-foreground-500">Where your revenue comes from</p>
          <div className="mt-3">
            <CategoryBarChart data={categorySales} height={200} />
          </div>
          <div className="mt-2 space-y-1.5">
            {categorySales.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-[11px]">
                <span className="text-foreground-600">{item.label}</span>
                <span className="font-num font-semibold text-foreground-900">{formatKsh(item.value, { compact: true })}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-3 p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-foreground-950">Event performance</p>
            <p className="text-[11px] text-foreground-500">Inventory, revenue and attendance by event</p>
          </div>
          <Link to="/organizer/events" className="text-[11px] font-semibold text-primary-700">
            Manage events
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr>
                <Th>Event</Th>
                <Th>Tickets</Th>
                <Th>Revenue</Th>
                <Th>Attendance</Th>
                <Th>Capacity</Th>
              </tr>
            </thead>
            <tbody>
              {eventPerformance.map((row) => (
                <tr key={row.name}>
                  <Td>
                    <p className="text-xs font-semibold text-foreground-950">{row.name}</p>
                  </Td>
                  <Td className="font-num text-xs">{formatNumber(row.sold)}</Td>
                  <Td className="font-num text-xs">{formatKsh(row.revenue, { compact: true })}</Td>
                  <Td className="text-xs">{row.attendance}%</Td>
                  <Td className="w-[160px]">
                    <Progress value={row.capacity ? (row.sold / row.capacity) * 100 : 0} />
                    <p className="mt-1 text-[10px] text-foreground-500">
                      {formatNumber(row.sold)} / {formatNumber(row.capacity)}
                    </p>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground-950">Recent orders</p>
            <Link to="/organizer/orders" className="text-[11px] font-semibold text-primary-700">
              View all
            </Link>
          </div>
          <div className="mt-2 divide-y divide-background-100">
            {orders.slice(0, 5).map((order) => {
              return (
                <div key={order.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground-950">{order.buyer}</p>
                    <p className="truncate text-[10px] text-foreground-500">
                      {order.reference} · {order.quantity} × {order.tier} · {order.eventTitle}
                    </p>
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    <span className="font-num text-xs font-bold text-foreground-950">{formatKsh(order.total)}</span>
                    <Badge tone={order.status === "Paid" ? "success" : order.status === "Pending" ? "warning" : order.status === "Refunded" ? "neutral" : "danger"}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-3">
          <Card className="p-4">
            <p className="text-sm font-bold text-foreground-950">Needs your attention</p>
            <div className="mt-2 space-y-2">
              <Link to="/organizer/orders" className="block rounded-md border border-background-200 p-2.5 text-[11px] font-semibold text-foreground-900 hover:border-foreground-400">Review live order records ({orders.length})</Link>
              <Link to="/organizer/withdrawals" className="block rounded-md border border-background-200 p-2.5 text-[11px] text-foreground-700 hover:border-foreground-400">Bank settlement API is not connected; withdrawals are locked.</Link>
            </div>
          </Card>

          <Card className="border-accent-200 bg-accent-50 p-4">
            <p className="text-sm font-bold text-accent-900">Commission clarity</p>
            <p className="mt-1 text-[11px] leading-relaxed text-accent-900/85">
              Gross {formatKsh(organizerKpis.grossSales, { compact: true })} less recorded commission{" "}
              {formatKsh(organizerKpis.commission, { compact: true })}. Provider fees and settlement are unavailable until payment APIs are connected.
            </p>
            <Link to="/organizer/earnings" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-accent-800">
              Open statement <i className="ri-arrow-right-line" />
            </Link>
          </Card>
        </div>
      </div>

      <div className="mt-3">
        <TableWrap>
          <thead>
            <tr>
              <Th>Live events</Th>
              <Th>Date</Th>
              <Th>Sold</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {liveEvents.map((event) => (
              <tr key={event.id}>
                <Td className="text-xs font-semibold text-foreground-950">{event.title}</Td>
                <Td className="text-xs">{event.date}</Td>
                <Td className="font-num text-xs">
                  {formatNumber(event.ticketsSold)} / {formatNumber(event.capacity)}
                </Td>
                <Td>
                  <Badge tone={event.soldOut ? "danger" : "success"}>{event.soldOut ? "Sold out" : "On sale"}</Badge>
                </Td>
                <Td>
                  <Link to="/organizer/orders" className="text-[11px] font-semibold text-primary-700">
                    View orders
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
      <Toaster />
    </DashboardShell>
  );
}
