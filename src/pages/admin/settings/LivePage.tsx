import { useEffect, useState } from "react";
import DashboardShell from "@/components/feature/DashboardShell";
import { Badge, Card } from "@/components/base/ui";
import { adminMobileNav, adminNav } from "@/pages/organizer/nav";
import { supabase } from "@/lib/supabase";

type Rule = { scope: string; target_id: string | null; rate: number; active: boolean };
export default function LiveAdminSettings() {
  const [rules, setRules] = useState<Rule[]>([]); const [error, setError] = useState("");
  useEffect(() => { let active = true; supabase.from("commission_rules").select("scope,target_id,rate,active").order("created_at", { ascending: false }).then(({ data, error: queryError }) => { if (!active) return; if (queryError) setError(queryError.message); else setRules(data ?? []); }); return () => { active = false; }; }, []);
  const defaultRule = rules.find((rule) => rule.scope === "platform" && !rule.target_id && rule.active);
  return <DashboardShell variant="admin" nav={adminNav} mobileNav={adminMobileNav} userName="Platform Admin" userRole="Administrator" initials="PA" title="Settings" description="Current Supabase configuration and integration readiness">
    {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
    <div className="grid gap-3 lg:grid-cols-2">
      <Card className="p-4"><h2 className="font-bold">Payments and settlement</h2><div className="mt-3 space-y-3">
        <div className="flex items-center justify-between gap-3 border-t pt-3"><div><p className="text-sm font-semibold">Ticket collection</p><p className="text-xs text-foreground-500">No secure payment initiation function or provider credentials are configured in Supabase.</p></div><Badge tone="danger">Unavailable</Badge></div>
        <div className="flex items-center justify-between gap-3 border-t pt-3"><div><p className="text-sm font-semibold">Bank settlement and withdrawals</p><p className="text-xs text-foreground-500">Payout balances remain locked until the bank API verifies settlement and destination ownership.</p></div><Badge tone="warning">API pending</Badge></div>
      </div></Card>
      <Card className="p-4"><h2 className="font-bold">Commission configuration</h2><p className="mt-1 text-xs text-foreground-500">Rules stored in Supabase. Order-time application requires a trusted payment endpoint.</p><div className="mt-3 border-t pt-3 text-sm">Platform default: <b>{defaultRule ? `${defaultRule.rate}%` : "Not configured"}</b></div><div className="mt-2 text-xs text-foreground-600">{rules.length} configured rule{rules.length === 1 ? "" : "s"}</div></Card>
      <Card className="p-4 lg:col-span-2"><h2 className="font-bold">Feature availability</h2><ul className="mt-3 space-y-2 text-sm text-foreground-700"><li className="flex justify-between border-t pt-2"><span>Organizer verification</span><Badge tone="success">Connected to Supabase</Badge></li><li className="flex justify-between border-t pt-2"><span>Event publishing and moderation</span><Badge tone="success">Connected to Supabase</Badge></li><li className="flex justify-between border-t pt-2"><span>Ticket scanning and duplicate protection</span><Badge tone="success">Connected to Supabase</Badge></li><li className="flex justify-between border-t pt-2"><span>Ticket transfers</span><Badge tone="neutral">Disabled until secure workflow exists</Badge></li><li className="flex justify-between border-t pt-2"><span>Waitlists and reviews</span><Badge tone="neutral">Not implemented</Badge></li></ul></Card>
    </div>
  </DashboardShell>;
}
