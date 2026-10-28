import { useCallback, useEffect, useState } from "react";
import DashboardShell from "@/components/feature/DashboardShell";
import { Badge, Button, Card, Input, Label, Modal, Select, TableWrap, Td, Th } from "@/components/base/ui";
import { organizerMobileNav, organizerNav } from "@/pages/organizer/nav";
import { useApp } from "@/store/AppStore";
import { useAuth } from "@/store/AuthProvider";
import { supabase } from "@/lib/supabase";

type Promoter = { id: string; name: string; code: string; commission_rate: number; status: "Active" | "Paused"; created_at: string };
export default function LivePromotersPage() {
  const { user } = useAuth(); const { pushToast } = useApp();
  const [rows, setRows] = useState<Promoter[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [code, setCode] = useState(""); const [rate, setRate] = useState("0");
  const load = useCallback(async () => {
    if (!user?.id) { setRows([]); setLoading(false); return; }
    setLoading(true); const result = await supabase.from("promoter_codes").select("id,name,code,commission_rate,status,created_at").eq("organizer_id", user.id).order("created_at", { ascending: false });
    if (result.error) { setError(result.error.message); setRows([]); } else { setError(""); setRows((result.data ?? []) as Promoter[]); } setLoading(false);
  }, [user?.id]);
  useEffect(() => { void load(); }, [load]);
  const create = async () => {
    if (!user?.id || !name.trim() || !/^[A-Z0-9_-]{3,24}$/i.test(code.trim())) { pushToast("Enter a promoter name and a 3–24 character code.", "danger"); return; }
    const { error: insertError } = await supabase.from("promoter_codes").insert({ organizer_id: user.id, name: name.trim(), code: code.trim().toUpperCase(), commission_rate: Number(rate), status: "Active" });
    if (insertError) { pushToast(insertError.message, "danger"); return; }
    setOpen(false); setName(""); setCode(""); setRate("0"); await load(); pushToast("Promoter code created.", "success");
  };
  const toggle = async (row: Promoter) => { const next = row.status === "Active" ? "Paused" : "Active"; const { error: updateError } = await supabase.from("promoter_codes").update({ status: next }).eq("id", row.id); if (updateError) pushToast(updateError.message, "danger"); else { setRows((current) => current.map((item) => item.id === row.id ? { ...item, status: next } : item)); pushToast(`Code ${next.toLowerCase()}.`, "success"); } };
  return <DashboardShell variant="organizer" nav={organizerNav} mobileNav={organizerMobileNav} userName={user?.email ?? "Organizer"} userRole="Organizer" initials="OR" title="Promoters" description="Manage referral codes stored in your organizer account" actions={<Button size="sm" onClick={() => setOpen(true)}><i className="ri-add-line" /> New code</Button>}>
    {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
    <Card className="mb-3 p-4"><p className="text-sm font-semibold">Sales attribution</p><p className="mt-1 text-xs text-foreground-600">Code ownership and status are stored in Supabase. Ticket sales and commission attribution will appear here when checkout records promoter codes.</p></Card>
    {loading ? <p className="p-4 text-sm text-foreground-500">Loading promoter codes…</p> : rows.length ? <TableWrap><thead><tr><Th>Name</Th><Th>Code</Th><Th>Rate</Th><Th>Status</Th><Th>Created</Th><Th>Action</Th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><Td>{row.name}</Td><Td className="font-mono">{row.code}</Td><Td>{row.commission_rate}%</Td><Td><Badge tone={row.status === "Active" ? "success" : "neutral"}>{row.status}</Badge></Td><Td>{new Date(row.created_at).toLocaleDateString()}</Td><Td><Button size="sm" variant="outline" onClick={() => void toggle(row)}>{row.status === "Active" ? "Pause" : "Resume"}</Button></Td></tr>)}</tbody></TableWrap> : <Card className="p-5 text-sm text-foreground-600">No promoter codes yet.</Card>}
    <Modal open={open} onClose={() => setOpen(false)} title="Create promoter code" description="Create a referral code for your event campaigns." footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => void create()}>Create code</Button></>}>
      <div className="space-y-3"><div><Label htmlFor="promoter-name">Promoter name</Label><Input id="promoter-name" value={name} onChange={(event) => setName(event.target.value)} /></div><div><Label htmlFor="promoter-code">Code</Label><Input id="promoter-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} /></div><div><Label htmlFor="promoter-rate">Commission rate</Label><Select id="promoter-rate" value={rate} onChange={(event) => setRate(event.target.value)}><option value="0">0%</option><option value="3">3%</option><option value="5">5%</option><option value="7">7%</option><option value="10">10%</option></Select></div></div>
    </Modal>
  </DashboardShell>;
}
