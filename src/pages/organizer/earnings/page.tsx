import DashboardShell from "@/components/feature/DashboardShell";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, Card, Progress, StatCard, TableWrap, Td, Th } from "@/components/base/ui";
import { SalesAreaChart } from "@/components/feature/Charts";
import { formatKsh, formatNumber } from "@/lib/helpers";
import { organizerMobileNav, organizerNav } from "@/pages/organizer/nav";
import { categorySales, ledgerEntries, organizerKpis, salesTrend } from "@/mocks/dashboard";
import { Link } from "react-router-dom";
import { useApp } from "@/store/AppStore";

export default function EarningsPage() {
  const { pushToast } = useApp();

  return (
    <DashboardShell
      variant="organizer"
      nav={organizerNav}
      mobileNav={organizerMobileNav}
      userName="DalaLive Events"
      userRole="Verified organizer · Kisumu"
      initials="DL"
      title="Earnings"
      description="Gross sales, commission, fees and what is actually yours"
      actions={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-foreground-600">Statement period: 1 – 26 October 2026</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => pushToast("Statement CSV generated.", "success")}>
              <i className="ri-download-2-line" /> Export statement
            </Button>
            <Link to="/organizer/withdrawals">
              <Button size="sm">
                <i className="ri-bank-card-line" /> Withdraw funds
              </Button>
            </Link>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Gross sales" value={formatKsh(organizerKpis.grossSales, { compact: true })} icon="ri-line-chart-line" hint="All paid orders" />
        <StatCard label="Platform commission" value={formatKsh(organizerKpis.commission, { compact: true })} icon="ri-percent-line" tone="secondary" hint="10% default rate" />
        <StatCard label="Provider fees" value={formatKsh(organizerKpis.providerFees, { compact: true })} icon="ri-bank-card-line" tone="foreground" hint="M-Pesa & card charges" />
        <StatCard label="Net entitlement" value={formatKsh(organizerKpis.netEarnings, { compact: true })} icon="ri-wallet-3-line" tone="accent" hint="After commission & fees" />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-4">
          <p className="text-sm font-bold text-foreground-950">Gross sales over time</p>
          <p className="text-[11px] text-foreground-500">Before commission, provider fees and refunds</p>
          <div className="mt-3">
            <SalesAreaChart data={salesTrend} dataKey="sales" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-background-200 pt-3 text-center">
            {[
              { label: "Avg. ticket", value: formatKsh(organizerKpis.avgTicket) },
              { label: "Tickets sold", value: formatNumber(organizerKpis.ticketsSold) },
              { label: "Refunded", value: formatKsh(organizerKpis.refunds, { compact: true }) },
            ].map((item) => (
              <div key={item.label}>
                <p className="font-num text-sm font-bold text-foreground-950">{item.value}</p>
                <p className="text-[10px] text-foreground-500">{item.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-bold text-foreground-950">Where the money goes</p>
          <p className="text-[11px] text-foreground-500">Every shilling accounted for</p>

          <div className="mt-3 space-y-3">
            {[
              { label: "Organizer net", value: organizerKpis.netEarnings, percent: 88, tone: "accent" as const },
              { label: "Platform commission", value: organizerKpis.commission, percent: 10, tone: "primary" as const },
              { label: "Provider fees", value: organizerKpis.providerFees, percent: 2, tone: "foreground" as const },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-foreground-600">{item.label}</span>
                  <span className="font-num font-semibold text-foreground-900">{formatKsh(item.value, { compact: true })}</span>
                </div>
                <div className="mt-1">
                  <Progress value={item.percent} tone={item.tone} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-md bg-background-100 p-3">
            <p className="text-[11px] font-semibold text-foreground-900">Settlement buckets</p>
            <div className="mt-1.5 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-foreground-600">Cleared & withdrawable</span>
                <span className="font-num font-semibold text-accent-700">{formatKsh(organizerKpis.availableBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-600">Pending settlement</span>
                <span className="font-num font-semibold text-foreground-800">{formatKsh(organizerKpis.pendingSettlement)}</span>
              </div>
            </div>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-foreground-500">
            A successful ticket payment does not mean funds have settled. Balances become withdrawable
            only after the provider settles the collection.
          </p>
        </Card>
      </div>

      <Card className="mt-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-foreground-950">Financial ledger</p>
            <p className="text-[11px] text-foreground-500">Audit trail of sales, refunds and withdrawals</p>
          </div>
          <Badge tone="success">Reconciled</Badge>
        </div>
        <div className="mt-3">
          <TableWrap>
            <thead>
              <tr>
                <Th>Reference</Th>
                <Th>Type</Th>
                <Th>Gross</Th>
                <Th>Commission</Th>
                <Th>Fees</Th>
                <Th>Net</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.map((entry) => (
                <tr key={entry.id}>
                  <Td>
                    <p className="font-num text-xs font-semibold text-foreground-950">{entry.reference}</p>
                    <p className="text-[10px] text-foreground-500">{entry.at}</p>
                  </Td>
                  <Td className="text-xs">{entry.type}</Td>
                  <Td className={`font-num text-xs ${entry.gross < 0 ? "text-primary-700" : ""}`}>{formatKsh(entry.gross)}</Td>
                  <Td className="font-num text-xs text-foreground-600">{formatKsh(entry.commission)}</Td>
                  <Td className="font-num text-xs text-foreground-600">{formatKsh(entry.fee)}</Td>
                  <Td className="font-num text-xs font-semibold">{formatKsh(entry.net)}</Td>
                  <Td>
                    <Badge tone={entry.status === "Settled" ? "success" : entry.status === "Pending" || entry.status === "Pending settlement" ? "warning" : "neutral"}>
                      {entry.status}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      </Card>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm font-bold text-foreground-950">Sales by category</p>
          <div className="mt-2 space-y-2">
            {categorySales.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-[11px]">
                  <span className="text-foreground-600">{item.label}</span>
                  <span className="font-num font-semibold text-foreground-900">{formatKsh(item.value, { compact: true })}</span>
                </div>
                <div className="mt-1">
                  <Progress value={(item.value / categorySales[0].value) * 100} tone={item.color === "primary" ? "primary" : item.color === "accent" ? "accent" : "foreground"} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-primary-200 bg-primary-50 p-4">
          <p className="text-sm font-bold text-primary-900">Commission disclosure</p>
          <p className="mt-1 text-[11px] leading-relaxed text-primary-800">
            Your platform commission is 10% of the ticket price. A KSh 1,500 ticket allocates KSh 150 to
            the platform and KSh 1,350 to you before provider fees and adjustments.
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-primary-800">
            Provider fees are deducted at cost. Refunds reverse both the organizer allocation and the
            platform commission proportionally.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => pushToast("Commission terms downloaded.", "success")}
          >
            <i className="ri-file-text-line" /> Download commission terms
          </Button>
        </Card>
      </div>
      <Toaster />
    </DashboardShell>
  );
}