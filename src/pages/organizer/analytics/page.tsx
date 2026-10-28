import DashboardShell from "@/components/feature/DashboardShell";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, Card, Progress, StatCard, TableWrap, Td, Th } from "@/components/base/ui";
import { CategoryBarChart, SalesAreaChart } from "@/components/feature/Charts";
import { formatKsh, formatNumber } from "@/lib/helpers";
import { organizerMobileNav, organizerNav } from "@/pages/organizer/nav";
import { useApp } from "@/store/AppStore";
import { useOrganizerData } from "@/hooks/useOrganizerData";
import { useState } from "react";

export default function AnalyticsPage() {
  const { pushToast } = useApp();
  const { events, orders, tickets, loading, error } = useOrganizerData();
  const [range, setRange] = useState("30");
  const cutoff = Date.now() - (range === "year" ? 365 : Number(range)) * 86400000;
  const paidOrders = orders.filter((order) => order.status === "Paid" && new Date(order.createdAt).getTime() >= cutoff);
  const organizerKpis = { ticketsSold: paidOrders.reduce((sum, order) => sum + order.quantity, 0), grossSales: paidOrders.reduce((sum, order) => sum + order.total, 0) };
  const paidTickets = tickets.filter((ticket) => ["paid", "completed"].includes(ticket.paymentStatus.toLowerCase()));
  const attendanceRate = paidTickets.length ? Math.round(paidTickets.filter((ticket) => ticket.scannedAt).length / paidTickets.length * 100) : 0;
  const refundedOrders = orders.filter((order) => order.status === "Refunded");
  const refundRate = orders.length ? Math.round(refundedOrders.length / orders.length * 1000) / 10 : 0;
  const salesTrend = [...new Set(paidOrders.map((order) => order.createdAt.slice(0, 10)))].sort().map((day) => ({ label: day.slice(5), sales: paidOrders.filter((order) => order.createdAt.startsWith(day)).reduce((sum, order) => sum + order.total, 0) }));
  const categoryMap = new Map<string, number>();
  for (const order of paidOrders) categoryMap.set(order.tier, (categoryMap.get(order.tier) ?? 0) + order.total);
  const categorySales = [...categoryMap.entries()].map(([label, value]) => ({ label, value, color: "primary" }));
  const eventPerformance = events.map((event) => {
    const eventOrders = paidOrders.filter((order) => order.eventId === event.id);
    const sold = eventOrders.reduce((sum, order) => sum + order.quantity, 0);
    const checked = tickets.filter((ticket) => ticket.eventId === event.id && ticket.scannedAt).length;
    return { name: event.title, city: event.city, sold, attendance: sold ? Math.round(checked / sold * 100) : 0, revenue: eventOrders.reduce((sum, order) => sum + order.total, 0) };
  });
  const hourCounts = new Map<number, number>();
  for (const order of paidOrders) { const hour = new Date(order.createdAt).getHours(); hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + order.quantity); }
  const bestHour = [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const buyerCounts = new Map<string, number>();
  for (const order of paidOrders) buyerCounts.set(order.buyer, (buyerCounts.get(order.buyer) ?? 0) + 1);
  const repeatPercent = buyerCounts.size ? Math.round([...buyerCounts.values()].filter((count) => count > 1).length / buyerCounts.size * 100) : 0;
  const cityRevenue = new Map<string, number>();
  for (const event of events) for (const order of paidOrders.filter((item) => item.eventId === event.id)) cityRevenue.set(event.city, (cityRevenue.get(event.city) ?? 0) + order.total);
  const topCity = [...cityRevenue.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Ã¢â‚¬â€";

  return (
    <DashboardShell
      variant="organizer"
      nav={organizerNav}
      mobileNav={organizerMobileNav}
      userName="DalaLive Events"
      userRole="Verified organizer Ã‚Â· Kisumu"
      initials="DL"
      title="Analytics"
      description="Sales, conversion, attendance and refund performance"
      actions={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2 text-[11px]">
            {[["30", "Last 30 days"], ["90", "Last 90 days"], ["year", "This year"]].map(([value, label]) => (
              <span
                key={value}
                role="button"
                tabIndex={0}
                onClick={() => setRange(value)}
                className={`rounded-full px-2.5 py-1 font-semibold ${
                  range === value ? "bg-foreground-950 text-background-50" : "border border-background-300 text-foreground-600"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={() => {
            const content = [["Reference", "Buyer", "Event", "Tier", "Quantity", "Gross", "Commission", "Status", "Created"], ...paidOrders.map((order) => [order.reference, order.buyer, order.eventTitle, order.tier, String(order.quantity), String(order.total), String(order.commission), order.status, order.createdAt])]
              .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
            const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
            const anchor = document.createElement("a"); anchor.href = url; anchor.download = "organizer-analytics.csv"; anchor.click(); URL.revokeObjectURL(url);
            pushToast("Live analytics exported.", "success");
          }}>
            <i className="ri-download-2-line" /> Export report
          </Button>
        </div>
      }
    >
      {loading && <p className="mb-3 text-sm text-foreground-500">Loading live analyticsÃ¢â‚¬Â¦</p>}
      {error && <p role="alert" className="mb-3 text-sm text-accent-700">{error}</p>}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Tickets sold" value={formatNumber(organizerKpis.ticketsSold)} icon="ri-ticket-2-line" />
        <StatCard label="Gross revenue" value={formatKsh(organizerKpis.grossSales, { compact: true })} icon="ri-line-chart-line" tone="accent" />
        <StatCard label="Attendance rate" value={`${attendanceRate}%`} icon="ri-qr-scan-line" tone="secondary" hint="Checked in vs paid tickets" />
        <StatCard label="Refund rate" value={`${refundRate}%`} icon="ri-refund-2-line" tone="foreground" hint={`${refundedOrders.length} refunded orders`} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-4">
          <p className="text-sm font-bold text-foreground-950">Sales and tickets over time</p>
          <div className="mt-3">
            <SalesAreaChart data={salesTrend} dataKey="sales" />
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-bold text-foreground-950">Revenue by category</p>
          <div className="mt-3">
            <CategoryBarChart data={categorySales} height={200} />
          </div>
        </Card>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm font-bold text-foreground-950">Checkout funnel</p>
          <div className="mt-2 space-y-2.5">
            {[
              { label: "Event page views", value: 18420, percent: 100 },
              { label: "Ticket selection", value: 7260, percent: 39 },
              { label: "Checkout started", value: 5120, percent: 28 },
              { label: "Payment confirmed", value: 4310, percent: 23 },
            ].map((step) => (
              <div key={step.label}>
                <div className="flex justify-between text-[11px]">
                  <span className="text-foreground-600">{step.label}</span>
                  <span className="font-num font-semibold text-foreground-900">{formatNumber(step.value)}</span>
                </div>
                <div className="mt-1">
                  <Progress value={step.percent} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-foreground-500">
            Checkout completion is 84% of started payments. Abandonment is highest on mobile between
            22:00 and 01:00.
          </p>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground-950">Attendance by event</p>
            <Badge tone="success">Above target</Badge>
          </div>
          <div className="mt-2">
            <TableWrap>
              <thead>
                <tr>
                  <Th>Event</Th>
                  <Th>Sold</Th>
                  <Th>Checked in</Th>
                  <Th>Attendance</Th>
                  <Th>Revenue</Th>
                </tr>
              </thead>
              <tbody>
                {eventPerformance.map((row) => {
                  const checked = Math.round((row.sold * row.attendance) / 100);
                  return (
                    <tr key={row.name}>
                      <Td className="text-xs font-semibold text-foreground-950">{row.name}</Td>
                      <Td className="font-num text-xs">{formatNumber(row.sold)}</Td>
                      <Td className="font-num text-xs">{formatNumber(checked)}</Td>
                      <Td className="text-xs">{row.attendance}%</Td>
                      <Td className="font-num text-xs">{formatKsh(row.revenue, { compact: true })}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          </div>
        </Card>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {[
          { title: "Busiest purchase hour", value: bestHour === undefined ? "—" : String(bestHour).padStart(2, "0") + ":00", body: "Based on paid orders in the selected period." },
          { title: "Top city", value: topCity, body: "Ranked by paid ticket revenue in the selected period." },
          { title: "Repeat buyers", value: String(repeatPercent) + "%", body: "Share of distinct buyers with multiple paid orders." },
        ].map((item) => (
          <Card key={item.title} className="p-4">
            <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-foreground-500">{item.title}</p>
            <p className="mt-1 text-lg font-bold text-foreground-950">{item.value}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-foreground-600">{item.body}</p>
          </Card>
        ))}
      </div>
      <Toaster />
    </DashboardShell>
  );
}
