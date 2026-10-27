import { Link } from "react-router-dom";
import DashboardShell from "@/components/feature/DashboardShell";
import { Toaster } from "@/components/feature/Toaster";
import { DualAreaChart } from "@/components/feature/Charts";
import { Badge, Button, Card, Progress, StatCard, TableWrap, Td, Th } from "@/components/base/ui";
import { formatKsh, formatNumber } from "@/lib/helpers";
import { adminMobileNav, adminNav } from "@/pages/organizer/nav";
import { adminEvents, adminOrganizers, adminPayouts, adminTransactions, platformKpis, platformRevenue } from "@/mocks/admin";

export default function AdminOverviewPage() {
  return (
    <DashboardShell
      variant="admin"
      nav={adminNav}
      mobileNav={adminMobileNav}
      userName="Platform Admin"
      userRole="Super admin · Nairobi"
      initials="PA"
      title="Platform overview"
      description="Marketplace health, commission revenue and financial queues"
      actions={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-foreground-600">Period: 1 – 27 October 2026 · demo data, no live money movement</p>
          <div className="flex gap-2">
            <Link to="/admin/reports">
              <Button size="sm" variant="outline">
                <i className="ri-file-chart-2-line" /> Reports
              </Button>
            </Link>
            <Link to="/admin/commissions">
              <Button size="sm">
                <i className="ri-percent-line" /> Commission rules
              </Button>
            </Link>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Gross merchandise value" value={formatKsh(platformKpis.gmv, { compact: true })} icon="ri-line-chart-line" trend="+21%" hint="vs September" />
        <StatCard label="Platform commission" value={formatKsh(platformKpis.commission, { compact: true })} icon="ri-percent-line" tone="accent" hint="10% blended rate" />
        <StatCard label="Organizer entitlement" value={formatKsh(platformKpis.organizerEntitlement, { compact: true })} icon="ri-wallet-3-line" tone="secondary" hint="Before provider fees" />
        <StatCard label="Provider fees" value={formatKsh(platformKpis.providerFees, { compact: true })} icon="ri-bank-card-line" tone="foreground" hint="Pass-through at cost" />
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Active events" value={formatNumber(platformKpis.activeEvents)} icon="ri-calendar-2-line" />
        <StatCard label="Verified organizers" value={formatNumber(platformKpis.verifiedOrganizers)} icon="ri-verified-badge-line" tone="accent" />
        <StatCard label="Tickets sold" value={formatNumber(platformKpis.ticketsSold)} icon="ri-ticket-2-line" tone="secondary" />
        <StatCard label="Pending payouts" value={formatKsh(platformKpis.pendingPayouts, { compact: true })} icon="ri-bank-line" tone="foreground" hint="2 awaiting approval" />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-foreground-950">GMV vs commission revenue</p>
              <p className="text-[11px] text-foreground-500">Monthly trend across the marketplace</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent-500" /> GMV</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary-500" /> Commission</span>
            </div>
          </div>
          <div className="mt-3">
            <DualAreaChart data={platformRevenue} />
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-bold text-foreground-950">Commission composition</p>
          <div className="mt-3 space-y-3">
            {[
              { label: "Standard events (10%)", value: 3120000, percent: 73, tone: "primary" as const },
              { label: "Negotiated events (9%)", value: 640000, percent: 15, tone: "accent" as const },
              { label: "Approved overrides (8%)", value: 380000, percent: 9, tone: "foreground" as const },
              { label: "Free events (0%)", value: 0, percent: 0, tone: "foreground" as const },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-[11px]">
                  <span className="text-foreground-600">{row.label}</span>
                  <span className="font-num font-semibold text-foreground-900">{formatKsh(row.value, { compact: true })}</span>
                </div>
                <div className="mt-1">
                  <Progress value={row.percent} tone={row.tone} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-md bg-background-100 p-2.5">
            <p className="text-[10px] leading-relaxed text-foreground-600">
              Commission is calculated server-side per order and posted to the ledger. Agreement on a
              settlement model with the payment provider is required before live payouts.
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground-950">Organizer verification queue</p>
            <Link to="/admin/organizers" className="text-[11px] font-semibold text-primary-700">
              Review all
            </Link>
          </div>
          <div className="mt-2 space-y-2">
            {adminOrganizers.filter((org) => org.status !== "Verified").map((org) => (
              <div key={org.id} className="flex items-center justify-between gap-2 rounded-md border border-background-200 p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground-900">{org.name}</p>
                  <p className="text-[10px] text-foreground-500">
                    {org.city} · {org.events} events · submitted {org.submitted}
                  </p>
                </div>
                <Badge tone={org.status === "Pending review" ? "warning" : "danger"}>{org.status}</Badge>
              </div>
            ))}
          </div>

          <p className="mt-3 text-sm font-bold text-foreground-950">Event moderation</p>
          <div className="mt-2 space-y-2">
            {adminEvents.filter((event) => event.status === "Under review").map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-2 rounded-md border border-background-200 p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground-900">{event.title}</p>
                  <p className="text-[10px] text-foreground-500">{event.organizer} · {event.date}</p>
                </div>
                <Badge tone="warning">{event.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground-950">Payout approval queue</p>
            <Link to="/admin/payouts" className="text-[11px] font-semibold text-primary-700">
              Manage payouts
            </Link>
          </div>
          <div className="mt-2 space-y-2">
            {adminPayouts.filter((payout) => payout.status === "Pending" || payout.status === "Processing").map((payout) => (
              <div key={payout.id} className="rounded-md border border-background-200 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-num text-xs font-semibold text-foreground-950">{payout.reference}</p>
                  <Badge tone={payout.status === "Pending" ? "warning" : "neutral"}>{payout.status}</Badge>
                </div>
                <p className="mt-1 text-[10px] text-foreground-500">
                  {payout.organizer} · {payout.method} · {payout.destination}
                </p>
                <p className="mt-1 font-num text-sm font-bold text-foreground-950">{formatKsh(payout.amount)}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-md border border-primary-200 bg-primary-50 p-2.5">
            <p className="text-[10px] leading-relaxed text-primary-900">
              Sensitive financial actions require a second confirmation and are written to the audit log
              with your admin identity.
            </p>
          </div>
        </Card>
      </div>

      <Card className="mt-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-foreground-950">Recent transactions</p>
          <Link to="/admin/transactions" className="text-[11px] font-semibold text-primary-700">
            View all transactions
          </Link>
        </div>
        <div className="mt-3">
          <TableWrap>
            <thead>
              <tr>
                <Th>Reference</Th>
                <Th>Buyer</Th>
                <Th>Event</Th>
                <Th>Gross</Th>
                <Th>Commission</Th>
                <Th>Provider</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {adminTransactions.slice(0, 5).map((tx) => (
                <tr key={tx.id}>
                  <Td className="font-num text-xs font-semibold text-foreground-950">{tx.reference}</Td>
                  <Td className="text-xs">{tx.buyer}</Td>
                  <Td className="text-xs text-foreground-600">{tx.event}</Td>
                  <Td className="font-num text-xs">{formatKsh(tx.gross)}</Td>
                  <Td className="font-num text-xs text-accent-700">{formatKsh(tx.commission)}</Td>
                  <Td className="text-xs">{tx.provider}</Td>
                  <Td>
                    <Badge tone={tx.status === "Paid" ? "success" : tx.status === "Pending" ? "warning" : "neutral"}>{tx.status}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      </Card>
      <Toaster />
    </DashboardShell>
  );
}
