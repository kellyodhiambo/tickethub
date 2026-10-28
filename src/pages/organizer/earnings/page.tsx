import DashboardShell from "@/components/feature/DashboardShell";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, Card, Progress, StatCard, TableWrap, Td, Th } from "@/components/base/ui";
import { SalesAreaChart } from "@/components/feature/Charts";
import { formatKsh, formatNumber } from "@/lib/helpers";
import { organizerMobileNav, organizerNav } from "@/pages/organizer/nav";
import { Link } from "react-router-dom";
import { useOrganizerData } from "@/hooks/useOrganizerData";

export default function EarningsPage() {
  const { orders, loading, error } = useOrganizerData();
  const paidOrders = orders.filter((order) => order.status === "Paid");
  const grossSales = paidOrders.reduce((total, order) => total + order.total, 0);
  const commission = paidOrders.reduce((total, order) => total + order.commission, 0);
  const ticketsSold = paidOrders.reduce((total, order) => total + order.quantity, 0);
  const refundOrders = orders.filter((order) => order.status === "Refunded");
  const refundTotal = refundOrders.reduce((sum, order) => sum + order.total, 0);
  const organizerKpis = { grossSales, commission, providerFees: 0, netEarnings: grossSales - commission, availableBalance: 0, pendingSettlement: 0, ticketsSold, avgTicket: ticketsSold ? Math.round(grossSales / ticketsSold) : 0, refunds: refundTotal };
  const days = [...new Set(paidOrders.map((order) => order.createdAt.slice(0, 10)))].sort();
  const salesTrend = days.map((day) => ({ label: day.slice(5), sales: paidOrders.filter((order) => order.createdAt.startsWith(day)).reduce((sum, order) => sum + order.total, 0) }));
  const byTier = new Map<string, number>();
  for (const order of paidOrders) byTier.set(order.tier, (byTier.get(order.tier) ?? 0) + order.total);
  const categorySales = [...byTier.entries()].map(([label, value]) => ({ label, value, color: "primary" }));
  const ledgerEntries = paidOrders.map((order) => ({ id: order.id, reference: order.reference, type: "Ticket sale", gross: order.total, commission: order.commission, fee: 0, net: order.total - order.commission, at: order.createdAt, status: "Payment settlement pending" }));
  const exportStatement = () => {
    const content = [["Reference", "Type", "Gross", "Commission", "Provider fees", "Net before provider fees", "Status", "Created"], ...ledgerEntries.map((entry) => [entry.reference, entry.type, String(entry.gross), String(entry.commission), "not reported", String(entry.net), entry.status, entry.at])]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "organizer-earnings.csv"; anchor.click(); URL.revokeObjectURL(url);
  };

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
            <Button size="sm" variant="outline" onClick={exportStatement}>
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
      {loading && <p className="mb-3 text-sm text-foreground-500">Loading live earnings…</p>}
      {error && <p role="alert" className="mb-3 text-sm text-accent-700">{error}</p>}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Gross sales" value={formatKsh(organizerKpis.grossSales, { compact: true })} icon="ri-line-chart-line" hint="All paid orders" />
        <StatCard label="Recorded commission" value={formatKsh(organizerKpis.commission, { compact: true })} icon="ri-percent-line" tone="secondary" hint="Sum recorded on paid orders" />
        <StatCard label="Provider fees" value="Not reported" icon="ri-bank-card-line" tone="foreground" hint="Awaiting payment provider data" />
        <StatCard label="Net before provider fees" value={formatKsh(organizerKpis.netEarnings, { compact: true })} icon="ri-wallet-3-line" tone="accent" hint="Gross less recorded commission" />
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
              { label: "Organizer amount before provider fees", value: organizerKpis.netEarnings, percent: grossSales ? Math.round(organizerKpis.netEarnings / grossSales * 100) : 0, tone: "accent" as const },
              { label: "Recorded platform commission", value: organizerKpis.commission, percent: grossSales ? Math.round(organizerKpis.commission / grossSales * 100) : 0, tone: "primary" as const },
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
                <span className="font-num font-semibold text-accent-700">Unavailable</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-600">Pending settlement</span>
                <span className="font-num font-semibold text-foreground-800">Unavailable</span>
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
          <Badge tone="warning">Provider reconciliation pending</Badge>
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
            Commission amounts below come from the saved order records. This dashboard does not assume a fixed rate where no active rule or provider settlement record is available.
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-primary-800">
            Provider fees are deducted at cost. Refunds reverse both the organizer allocation and the
            platform commission proportionally.
          </p>
          <p className="mt-3 text-[11px] text-primary-800">Provider fees, refund settlement and withdrawable balances appear after the settlement API is connected.</p>
        </Card>
      </div>
      <Toaster />
    </DashboardShell>
  );
}
