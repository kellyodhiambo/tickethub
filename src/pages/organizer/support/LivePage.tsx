import { useCallback, useEffect, useState } from "react";
import DashboardShell from "@/components/feature/DashboardShell";
import { Badge, Button, Card, Input, Label, Modal, Select, TableWrap, Td, Th, Textarea } from "@/components/base/ui";
import { organizerMobileNav, organizerNav } from "@/pages/organizer/nav";
import { useAuth } from "@/store/AuthProvider";
import { useApp } from "@/store/AppStore";
import { supabase } from "@/lib/supabase";

type SupportItem = { id: string; subject: string; priority: string; status: string; created_at: string };
export default function LiveSupportPage() {
  const { user } = useAuth(); const { pushToast } = useApp();
  const [rows, setRows] = useState<SupportItem[]>([]); const [busy, setBusy] = useState(true); const [error, setError] = useState("");
  const [open, setOpen] = useState(false); const [subject, setSubject] = useState(""); const [message, setMessage] = useState(""); const [priority, setPriority] = useState("Normal");
  const load = useCallback(async () => { if (!user?.id) { setRows([]); setBusy(false); return; } setBusy(true); const result = await supabase.from("support_tickets").select("id,subject,priority,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }); if (result.error) { setError(result.error.message); setRows([]); } else { setError(""); setRows(result.data ?? []); } setBusy(false); }, [user?.id]);
  useEffect(() => { void load(); }, [load]);
  const submit = async () => { if (!user?.id || subject.trim().length < 4 || message.trim().length < 10) { pushToast("Enter a subject and at least 10 characters describing the issue.", "warning"); return; } const { error: insertError } = await supabase.from("support_tickets").insert({ user_id: user.id, subject: subject.trim(), message: message.trim(), priority, status: "Open" }); if (insertError) { pushToast(insertError.message, "danger"); return; } setOpen(false); setSubject(""); setMessage(""); setPriority("Normal"); await load(); pushToast("Support request sent.", "success"); };
  return <DashboardShell variant="organizer" nav={organizerNav} mobileNav={organizerMobileNav} userName={user?.email ?? "Organizer"} userRole="Organizer" initials="OR" title="Help & support" description="Create a support request and review its live status" actions={<Button size="sm" onClick={() => setOpen(true)}><i className="ri-add-line" /> New support request</Button>}>
    {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
    <Card className="p-4"><h2 className="mb-3 font-bold">Your support requests</h2>{busy ? <p className="text-sm text-foreground-500">Loading…</p> : rows.length ? <TableWrap><thead><tr><Th>Subject</Th><Th>Priority</Th><Th>Created</Th><Th>Status</Th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><Td>{row.subject}</Td><Td><Badge tone={row.priority === "High" ? "danger" : "neutral"}>{row.priority}</Badge></Td><Td>{new Date(row.created_at).toLocaleString()}</Td><Td><Badge tone={row.status === "Resolved" ? "success" : row.status === "Open" ? "warning" : "neutral"}>{row.status}</Badge></Td></tr>)}</tbody></TableWrap> : <p className="text-sm text-foreground-500">No support requests yet.</p>}</Card>
    <Modal open={open} onClose={() => setOpen(false)} title="New support request" description="Your request is saved to your account and visible to platform support." footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => void submit()}>Send request</Button></>}>
      <div className="space-y-3"><div><Label htmlFor="support-subject">Subject</Label><Input id="support-subject" value={subject} onChange={(event) => setSubject(event.target.value)} /></div><div><Label htmlFor="support-priority">Priority</Label><Select id="support-priority" value={priority} onChange={(event) => setPriority(event.target.value)}><option>Low</option><option>Normal</option><option>High</option></Select></div><div><Label htmlFor="support-message">Details</Label><Textarea id="support-message" value={message} onChange={(event) => setMessage(event.target.value)} rows={5} /></div></div>
    </Modal>
  </DashboardShell>;
}
