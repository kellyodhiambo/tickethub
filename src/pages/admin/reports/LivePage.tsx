import { useEffect, useState } from "react";
import DashboardShell from "@/components/feature/DashboardShell";
import { Badge, Button, Card, StatCard, TableWrap, Td, Th } from "@/components/base/ui";
import { formatKsh, formatNumber } from "@/lib/helpers";
import { adminMobileNav, adminNav } from "@/pages/organizer/nav";
import { supabase } from "@/lib/supabase";

type Order = { id: string; reference: string | null; buyer: string | null; total: number | null; commission: number | null; status: string | null; created_at: string; events: { title?: string } | null };
type Support = { id: string; subject: string; status: string; priority: string; created_at: string };
const csv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export default function LiveAdminReports() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [support, setSupport] = useState<Support[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([
      supabase.from("orders").select("id,reference,buyer,total,commission,status,created_at,events(title)").order("created_at", { ascending: false }).limit(500),
      supabase.from("support_tickets").select("id,subject,status,priority,created_at").order("created_at", { ascending: false }).limit(100),
    ]).then(([orderResult, supportResult]) => {
      if (!active) return;
      if (orderResult.error) throw orderResult.error;
      if (supportResult.error) throw supportResult.error;
      setOrders((orderResult.data ?? []) as unknown as Order[]);
      setSupport(supportResult.data ?? []);
    }).catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Could not load report data."); });
    return () => { active = false; };
  }, []);
  const paid = orders.filter((row) => ["paid", "completed"].includes(String(row.status).toLowerCase()));
  const gmv = paid.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const commission = paid.reduce((sum, row) => sum + Number(row.commission ?? 0), 0);
  const exportOrders = () => {
    const rows = [["Reference", "Buyer", "Event", "Gross", "Commission", "Status", "Created"], ...orders.map((row) => [row.reference, row.buyer, row.events?.title, row.total, row.commission, row.status, row.created_at])];
    const blob = new Blob([rows.map((row) => row.map(csv).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "tribedala-orders-report.csv"; anchor.click(); URL.revokeObjectURL(url);
  };
  return <DashboardShell variant="admin" nav={adminNav} mobileNav={adminMobileNav} userName="Platform Admin" userRole="Administrator" initials="PA" title="Reports" description="Live order and support data from Supabase">
    {error && <p role="alert" className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="mb-3 flex justify-end"><Button variant="outline" onClick={exportOrders}><i className="ri-download-2-line" /> Export orders CSV ({formatNumber(orders.length)})</Button></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><StatCard label="Paid gross" value={formatKsh(gmv, { compact: true })} icon="ri-line-chart-line" /><StatCard label="Recorded commission" value={formatKsh(commission, { compact: true })} icon="ri-percent-line" tone="accent" /><StatCard label="Orders loaded" value={formatNumber(orders.length)} icon="ri-file-list-3-line" /><StatCard label="Open support tickets" value={formatNumber(support.filter((row) => !["resolved", "closed"].includes(row.status.toLowerCase())).length)} icon="ri-customer-service-line" tone="secondary" /></div>
    <Card className="mt-3 p-4"><h2 className="mb-3 font-bold">Recent orders</h2><TableWrap><thead><tr><Th>Reference</Th><Th>Buyer</Th><Th>Event</Th><Th>Total</Th><Th>Commission</Th><Th>Status</Th><Th>Created</Th></tr></thead><tbody>{orders.slice(0, 100).map((row) => <tr key={row.id}><Td>{row.reference ?? row.id}</Td><Td>{row.buyer ?? "—"}</Td><Td>{row.events?.title ?? "—"}</Td><Td>{formatKsh(Number(row.total ?? 0))}</Td><Td>{formatKsh(Number(row.commission ?? 0))}</Td><Td><Badge tone={row.status?.toLowerCase() === "paid" ? "success" : "warning"}>{row.status ?? "unknown"}</Badge></Td><Td>{new Date(row.created_at).toLocaleString()}</Td></tr>)}</tbody></TableWrap></Card>
    <Card className="mt-3 p-4"><h2 className="mb-3 font-bold">Support and disputes</h2>{support.length ? support.map((row) => <div key={row.id} className="flex items-center justify-between border-t py-2 text-sm"><span>{row.subject}</span><span className="flex gap-2"><Badge tone={row.priority === "High" ? "danger" : "neutral"}>{row.priority}</Badge><Badge tone={row.status === "Resolved" ? "success" : "warning"}>{row.status}</Badge></span></div>) : <p className="text-sm text-foreground-500">No support tickets recorded.</p>}</Card>
  </DashboardShell>;
}
