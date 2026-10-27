import DashboardShell from "@/components/feature/DashboardShell";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, Card, Progress, StatCard, TableWrap, Td, Th } from "@/components/base/ui";
import { CategoryBarChart, SalesAreaChart } from "@/components/feature/Charts";
import { formatKsh, formatNumber } from "@/lib/helpers";
import { organizerMobileNav, organizerNav } from "@/pages/organizer/nav";
import { categorySales, eventPerformance, organizerKpis, salesTrend } from "@/mocks/dashboard";
import { useApp } from "@/store/AppStore";

export default function AnalyticsPage() {
  const { pushToast } = useApp();

  return (
    <DashboardShell
      variant="organizer"
      nav={organizerNav}
      mobileNav={organizerMobileNav}
      userName="DalaLive Events"
      userRole="Verified organizer · Kisumu"
      initials="DL"
      title="Analytics"
      description="Sales, conversion, attendance and refund performance"
      actions={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2 text-[11px]">
            {["Last 30 days", "Last 90 days", "This year"].map((range, index) => (
              <span
                key={range}
                className={`rounded-full px-2.5 py-1 font-semibold ${
                  index === 0 ? "bg-foreground-950 text-background-50" : "border border-background-300 text-foreground-600"
                }`}
              >
                {range}
              </span>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={() => pushToast("Analytics report exported as CSV.", "success")}>
            <i className="ri-download-2-line" /> Export report
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Tickets sold" value={formatNumber(organizerKpis.ticketsSold)} icon="ri-ticket-2-line" trend="+11%" />
        <StatCard label="Gross revenue" value={formatKsh(organizerKpis.grossSales, { compact: true })} icon="ri-line-chart-line" tone="accent" trend="+18%" />
        <StatCard label="Attendance rate" value="67%" icon="ri-qr-scan-line" tone="secondary" hint="Checked in vs issued" />
        <StatCard label="Refund rate" value="1.5%" icon="ri-refund-2-line" tone="foreground" hint="Below 3% target" />
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
          { title: "Best selling window", value: "18:00 – 23:00", body: "Most tickets are bought on mobile in the evening, 3–7 days before an event." },
          { title: "Top city", value: "Nairobi", body: "62% of your ticket volume. Kisumu follows at 21%." },
          { title: "Repeat buyers", value: "34%", body: "Of attendees have bought from you more than once this year." },
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
