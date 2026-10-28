import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardShell from "@/components/feature/DashboardShell";
import { Badge, Card, StatCard, TableWrap, Td, Th } from "@/components/base/ui";
import { formatKsh, formatNumber } from "@/lib/helpers";
import { fetchAdminRows, type AdminRow } from "@/lib/adminData";
import { adminMobileNav, adminNav } from "@/pages/organizer/nav";

export default function LiveAdminOverview() {
  const [data, setData] = useState<Record<string, AdminRow[]>>({});
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all(["organizers", "events", "transactions", "payouts"].map(async (kind) => [kind, await fetchAdminRows(kind as "organizers" | "events" | "transactions" | "payouts")] as const))
      .then((items) => { if (active) setData(Object.fromEntries(items)); })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Could not load platform data."); });
    return () => { active = false; };
  }, []);
  const organizers = data.organizers ?? [];
  const events = data.events ?? [];
  const transactions = data.transactions ?? [];
  const payouts = data.payouts ?? [];
  const paid = transactions.filter((row) => ["paid", "completed"].includes(String(row.status).toLowerCase()));
  const pendingPayouts = payouts.filter((row) => ["pending", "processing"].includes(String(row.status).toLowerCase()));
  const pendingOrganizers = organizers.filter((row) => row.status !== "Verified");
  const gmv = paid.reduce((sum, row) => sum + Number(row.gross ?? 0), 0);
  const commission = paid.reduce((sum, row) => sum + Number(row.commission ?? 0), 0);
  return <DashboardShell variant="admin" nav={adminNav} mobileNav={adminMobileNav} userName="Platform Admin" userRole="Administrator" initials="PA" title="Platform overview" description="Live marketplace activity from Supabase">
    {error && <p role="alert" className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Paid gross sales" value={formatKsh(gmv, { compact: true })} icon="ri-line-chart-line" />
      <StatCard label="Recorded commission" value={formatKsh(commission, { compact: true })} icon="ri-percent-line" tone="accent" />
      <StatCard label="Events" value={formatNumber(events.length)} icon="ri-calendar-2-line" />
      <StatCard label="Verified organizers" value={formatNumber(organizers.filter((row) => row.status === "Verified").length)} icon="ri-verified-badge-line" tone="secondary" />
    </div>
    <div className="mt-3 grid grid-cols-2 gap-3">
      <StatCard label="Paid orders" value={formatNumber(paid.length)} icon="ri-ticket-2-line" />
      <StatCard label="Pending payout requests" value={formatNumber(pendingPayouts.length)} icon="ri-bank-line" />
    </div>
    <div className="mt-3 grid gap-3 lg:grid-cols-2">
      <Card className="p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Organizer verification queue</h2><Link to="/admin/organizers" className="text-sm text-primary-700">Review all</Link></div>
        {pendingOrganizers.length ? pendingOrganizers.slice(0, 6).map((row) => <div key={String(row.id)} className="flex justify-between border-t py-2 text-sm"><span>{String(row.name || row.id)}</span><Badge tone="warning">{String(row.status)}</Badge></div>) : <p className="text-sm text-foreground-500">No organizers awaiting verification.</p>}
      </Card>
      <Card className="p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Pending payout requests</h2><Link to="/admin/payouts" className="text-sm text-primary-700">View payouts</Link></div>
        {pendingPayouts.length ? pendingPayouts.slice(0, 6).map((row) => <div key={String(row.id)} className="flex justify-between border-t py-2 text-sm"><span>{String(row.organizer)} · {String(row.reference)}</span><b>{formatKsh(Number(row.amount ?? 0))}</b></div>) : <p className="text-sm text-foreground-500">No payout requests.</p>}
      </Card>
    </div>
    <Card className="mt-3 p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Recent paid transactions</h2><Link to="/admin/transactions" className="text-sm text-primary-700">View all</Link></div>
      <TableWrap><thead><tr><Th>Reference</Th><Th>Buyer</Th><Th>Event</Th><Th>Gross</Th><Th>Commission</Th></tr></thead><tbody>{paid.slice(0, 8).map((row) => <tr key={String(row.id)}><Td>{String(row.reference)}</Td><Td>{String(row.buyer)}</Td><Td>{String(row.event)}</Td><Td>{formatKsh(Number(row.gross))}</Td><Td>{formatKsh(Number(row.commission))}</Td></tr>)}</tbody></TableWrap>
    </Card>
  </DashboardShell>;
}
