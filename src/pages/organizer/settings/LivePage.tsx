import { useEffect, useState } from "react";
import DashboardShell from "@/components/feature/DashboardShell";
import { Button, Card, Input, Label, Textarea } from "@/components/base/ui";
import { organizerMobileNav, organizerNav } from "@/pages/organizer/nav";
import { useAuth } from "@/store/AuthProvider";
import { useApp } from "@/store/AppStore";
import { supabase } from "@/lib/supabase";
import VerificationPanel from "./components/VerificationPanel";

export default function LiveOrganizerSettings() {
  const { user, profile, refreshProfile } = useAuth(); const { pushToast } = useApp();
  const [tab, setTab] = useState("profile"); const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", location: "", bio: "" });
  const [prefs, setPrefs] = useState({ notification_email: true, notification_inapp: true });
  useEffect(() => { if (!profile) return; setForm({ full_name: profile.full_name ?? "", location: profile.location ?? "", bio: profile.bio ?? "" }); setPrefs({ notification_email: profile.notification_email !== false, notification_inapp: profile.notification_inapp !== false }); }, [profile]);
  const save = async () => { if (!user?.id) return; setSaving(true); const { error } = await supabase.from("users").update({ full_name: form.full_name.trim(), location: form.location.trim(), bio: form.bio.trim(), updated_at: new Date().toISOString() }).eq("id", user.id); setSaving(false); if (error) pushToast(error.message, "danger"); else { await refreshProfile(); pushToast("Organizer profile saved.", "success"); } };
  const savePref = async (key: keyof typeof prefs) => { if (!user?.id) return; const next = !prefs[key]; const { error } = await supabase.from("users").update({ [key]: next }).eq("id", user.id); if (error) pushToast(error.message, "danger"); else { setPrefs((current) => ({ ...current, [key]: next })); await refreshProfile(); } };
  return <DashboardShell variant="organizer" nav={organizerNav} mobileNav={organizerMobileNav} userName={profile?.full_name ?? user?.email ?? "Organizer"} userRole={profile?.verified ? "Verified organizer" : "Organizer"} initials={(profile?.full_name ?? "OR").slice(0, 2).toUpperCase()} title="Settings" description="Manage your Supabase profile, verification, and notification preferences">
    <div className="mb-3 flex flex-wrap gap-2">{["profile", "verification", "payouts", "notifications"].map((key) => <Button key={key} size="sm" variant={tab === key ? "primary" : "outline"} onClick={() => setTab(key)}>{key[0].toUpperCase() + key.slice(1)}</Button>)}</div>
    {tab === "profile" && <Card className="max-w-2xl space-y-3 p-4"><h2 className="font-bold">Organizer profile</h2><div><Label htmlFor="org-name">Display name</Label><Input id="org-name" value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} /></div><div><Label htmlFor="org-location">Location</Label><Input id="org-location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></div><div><Label htmlFor="org-bio">About</Label><Textarea id="org-bio" rows={5} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></div><Button disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save profile"}</Button></Card>}
    {tab === "verification" && <VerificationPanel />}
    {tab === "payouts" && <Card className="max-w-2xl p-4"><h2 className="font-bold">Bank settlement</h2><p className="mt-2 text-sm text-foreground-600">No bank account is stored or marked verified. Balance reconciliation, payout account verification, and withdrawals will be enabled when the bank settlement API is connected. No funds can be requested until a cleared balance is confirmed.</p></Card>}
    {tab === "notifications" && <Card className="max-w-2xl space-y-3 p-4"><h2 className="font-bold">Notification preferences</h2>{(["notification_email", "notification_inapp"] as const).map((key) => <label key={key} className="flex items-center justify-between gap-3 border-b py-2 text-sm"><span>{key === "notification_email" ? "Email notifications" : "In-app notifications"}</span><input type="checkbox" checked={prefs[key]} onChange={() => void savePref(key)} /></label>)}</Card>}
  </DashboardShell>;
}
