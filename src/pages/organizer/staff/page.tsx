import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/feature/DashboardShell";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, Card, Input, Label, Modal, Select, TableWrap, Td, Th } from "@/components/base/ui";
import { organizerMobileNav, organizerNav } from "@/pages/organizer/nav";
import { supabase } from "@/lib/supabase";
import {
  inviteGateStaff,
  listGateStaff,
  resetStaffPassword,
  restoreGateStaff,
  revokeGateStaff,
  type GateStaffRow,
} from "@/lib/staffApi";
import { useApp } from "@/store/AppStore";
import { useAuth } from "@/store/AuthProvider";

const GATES = ["Gate A — Main", "Gate B — Main", "VIP Entrance", "Gate C — Staff", "Gate D — Overflow"];

type EventOption = { id: string; title: string };

function randomPassword() {
  const words = ["dala", "gate", "ticket", "entry", "scanner", "venue", "night", "kisumu"];
  const word = words[Math.floor(Math.random() * words.length)];
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${word}${digits}`;
}

export default function GateStaffPage() {
  const { pushToast } = useApp();
  const { profile, user } = useAuth();

  const [staff, setStaff] = useState<GateStaffRow[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<GateStaffRow | null>(null);
  const [resetTarget, setResetTarget] = useState<GateStaffRow | null>(null);
  const [resetValue, setResetValue] = useState("");
  const [issued, setIssued] = useState<{ name: string; phone: string; password: string; gate: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    gate: GATES[0],
    eventId: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setStaff([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [staffResult, eventResult] = await Promise.all([
        listGateStaff(),
        supabase.from("events").select("id, title").eq("organizer_id", user.id).order("start_date", { ascending: true }),
      ]);

      if (staffResult.error) throw new Error(staffResult.error);
      setStaff(staffResult.data?.staff ?? []);
      if (!eventResult.error) setEvents((eventResult.data ?? []) as EventOption[]);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load your gate staff.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeStaff = useMemo(() => staff.filter((member) => member.status === "Active"), [staff]);
  const totalScans = useMemo(() => staff.reduce((sum, member) => sum + member.scans, 0), [staff]);

  const openInvite = () => {
    setForm({ name: "", phone: "", password: randomPassword(), gate: GATES[0], eventId: "" });
    setFormError(null);
    setInviteOpen(true);
  };

  const submitInvite = async () => {
    if (!form.name.trim() || form.phone.replace(/[^\d]/g, "").length < 9) {
      setFormError("Add their full name and a phone number with the country code.");
      return;
    }
    if (form.password.length < 8) {
      setFormError("Give them a password with at least 8 characters.");
      return;
    }

    setBusy(true);
    setFormError(null);
    try {
      const result = await inviteGateStaff({
        fullName: form.name.trim(),
        phone: form.phone,
        password: form.password,
        gate: form.gate,
        eventId: form.eventId || null,
      });

      if (result.error || !result.data) {
        setFormError(result.error ?? "Could not create the staff login.");
        return;
      }

      setIssued({
        name: result.data.staff.full_name,
        phone: result.data.credentials.phone,
        password: form.password,
        gate: result.data.credentials.gate,
      });
      setInviteOpen(false);
      await load();
      pushToast("Scanner access created — hand over the details below.", "success");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create the staff login.");
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    const result = await revokeGateStaff(revokeTarget.id);
    setRevokeTarget(null);
    if (result.error) {
      pushToast(result.error, "danger");
      return;
    }
    pushToast("Scanner access revoked. They are signed out immediately.", "warning");
    await load();
  };

  const handleRestore = async (member: GateStaffRow) => {
    const result = await restoreGateStaff(member.id);
    if (result.error) {
      pushToast(result.error, "danger");
      return;
    }
    pushToast("Scanner access restored.", "success");
    await load();
  };

  const handleReset = async () => {
    if (!resetTarget) return;
    if (resetValue.length < 8) {
      pushToast("Use a password with at least 8 characters.", "danger");
      return;
    }
    const result = await resetStaffPassword(resetTarget.id, resetValue);
    if (result.error) {
      pushToast(result.error, "danger");
      return;
    }
    setIssued({ name: resetTarget.full_name, phone: resetTarget.phone, password: resetValue, gate: resetTarget.gate });
    setResetTarget(null);
    setResetValue("");
    pushToast("Password updated. Share the new password with them.", "success");
  };

  const copyCredentials = async () => {
    if (!issued) return;
    const text = `Dala Gate Scanner\nPhone: +${issued.phone}\nPassword: ${issued.password}\nGate: ${issued.gate}\nSign in: ${window.location.origin}${__BASE_PATH__}gate-login`.replace(
      /\/{2,}/g,
      "/"
    );
    try {
      await navigator.clipboard.writeText(text);
      pushToast("Login details copied.", "success");
    } catch {
      pushToast("Copy failed — select the text manually.", "warning");
    }
  };

  const statusTone = (status: string) => (status === "Active" ? "success" : status === "Revoked" ? "danger" : "warning");

  return (
    <DashboardShell
      variant="organizer"
      nav={organizerNav}
      mobileNav={organizerMobileNav}
      userName={profile?.full_name ?? "Your organization"}
      userRole={profile?.verified ? "Verified organizer" : "Organizer"}
      initials={(profile?.full_name ?? "DL").slice(0, 2).toUpperCase()}
      title="Gate staff"
      description="Issue phone + password logins for scanners — no dashboard access, no access to money"
      actions={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-foreground-600">
            {activeStaff.length} active scanner{activeStaff.length === 1 ? "" : "s"} · {totalScans.toLocaleString()} scans recorded
          </p>
          <Button size="sm" onClick={openInvite}>
            <i className="ri-user-add-line" /> Invite gate staff
          </Button>
        </div>
      }
    >
      {issued && (
        <Card className="mb-3 border-accent-200 bg-accent-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-accent-900">Login created for {issued.name}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-accent-900/80">
                Send these details to them. The password is only shown here once.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-md border border-accent-300 bg-background-50 px-2 py-1 font-num text-[11px] text-foreground-900">
                  +{issued.phone}
                </span>
                <span className="rounded-md border border-accent-300 bg-background-50 px-2 py-1 font-num text-[11px] text-foreground-900">
                  {issued.password}
                </span>
                <span className="rounded-md border border-accent-300 bg-background-50 px-2 py-1 text-[11px] text-foreground-900">
                  {issued.gate}
                </span>
              </div>
              <p className="mt-2 text-[10px] text-accent-900/70">
                They sign in at <span className="font-semibold">/gate-login</span> with the phone number and password.
              </p>
            </div>
            <div className="flex flex-none gap-2">
              <Button size="sm" variant="outline" onClick={copyCredentials}>
                <i className="ri-file-copy-line" /> Copy
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIssued(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loadError && (
        <Card className="mb-3 border-accent-200 bg-accent-50 p-4">
          <p className="text-sm font-bold text-accent-900">Could not load gate staff</p>
          <p className="mt-1 text-[11px] text-accent-900/80">{loadError}</p>
          <Button className="mt-2" size="sm" onClick={() => void load()}>
            <i className="ri-refresh-line" /> Try again
          </Button>
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="hidden lg:block">
            <TableWrap>
              <thead>
                <tr>
                  <Th>Staff member</Th>
                  <Th>Gate</Th>
                  <Th>Permission</Th>
                  <Th>Scans</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id}>
                    <Td>
                      <p className="text-xs font-semibold text-foreground-900">{member.full_name}</p>
                      <p className="text-[10px] text-foreground-500">+{member.phone}</p>
                    </Td>
                    <Td className="text-xs">{member.gate}</Td>
                    <Td>
                      <Badge tone="neutral">{member.role}</Badge>
                    </Td>
                    <Td className="font-num text-xs">{member.scans.toLocaleString()}</Td>
                    <Td>
                      <Badge tone={statusTone(member.status)}>{member.status}</Badge>
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => {
                            setResetTarget(member);
                            setResetValue(randomPassword());
                          }}
                          className="cursor-pointer whitespace-nowrap text-[11px] font-semibold text-foreground-600 hover:text-foreground-950"
                        >
                          Password
                        </button>
                        {member.status === "Revoked" ? (
                          <button
                            onClick={() => void handleRestore(member)}
                            className="cursor-pointer whitespace-nowrap text-[11px] font-semibold text-primary-700"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => setRevokeTarget(member)}
                            className="cursor-pointer whitespace-nowrap text-[11px] font-semibold text-primary-700"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
                {!loading && staff.length === 0 && (
                  <tr>
                    <td colSpan={6} className="border-b border-background-200 px-4 py-6 text-center text-xs text-foreground-500">
                      No scanners yet. Invite your first gate staff member to issue a login.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={6} className="border-b border-background-200 px-4 py-6 text-center text-xs text-foreground-500">
                      <span className="inline-flex items-center gap-2">
                        <i className="ri-loader-4-line animate-spin" /> Loading your gate staff…
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </TableWrap>
          </div>

          <div className="space-y-2.5 lg:hidden">
            {staff.map((member) => (
              <Card key={member.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground-950">{member.full_name}</p>
                    <p className="text-[10px] text-foreground-500">
                      +{member.phone} · {member.gate}
                    </p>
                  </div>
                  <Badge tone={statusTone(member.status)}>{member.status}</Badge>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-foreground-600">
                    {member.role} · {member.scans} scans
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setResetTarget(member);
                        setResetValue(randomPassword());
                      }}
                      className="cursor-pointer text-[11px] font-semibold text-foreground-600"
                    >
                      Password
                    </button>
                    {member.status === "Revoked" ? (
                      <button onClick={() => void handleRestore(member)} className="cursor-pointer text-[11px] font-semibold text-primary-700">
                        Restore
                      </button>
                    ) : (
                      <button onClick={() => setRevokeTarget(member)} className="cursor-pointer text-[11px] font-semibold text-primary-700">
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {!loading && staff.length === 0 && (
              <Card className="p-4 text-center">
                <p className="text-xs text-foreground-500">No scanners yet. Invite your first gate staff member.</p>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Card className="border-accent-200 bg-accent-50 p-4">
            <p className="text-sm font-bold text-accent-900">Scanner-only by design</p>
            <ul className="mt-2 space-y-1.5">
              {[
                "Gate staff sign in with a phone number and password you issue.",
                "No access to sales, earnings, payouts or attendee data.",
                "Revoking access signs them out of the scanner instantly.",
                "Every scan is logged with gate, staff and timestamp.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-[11px] leading-relaxed text-accent-900/85">
                  <i className="ri-checkbox-circle-fill mt-0.5 text-accent-600" /> {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4">
            <p className="text-sm font-bold text-foreground-950">Gate coverage</p>
            <div className="mt-2 space-y-2">
              {GATES.map((gate) => {
                const assigned = activeStaff.filter((member) => member.gate === gate).length;
                return (
                  <div key={gate} className="flex items-center justify-between text-[11px]">
                    <span className="text-foreground-600">{gate}</span>
                    <span className={assigned ? "font-semibold text-accent-700" : "text-primary-700"}>
                      {assigned ? `${assigned} scanner${assigned > 1 ? "s" : ""}` : "Uncovered"}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-foreground-500">
              Aim for one scanner per 400 expected guests at peak entry.
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-sm font-bold text-foreground-950">How staff sign in</p>
            <ol className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-foreground-600">
              <li>1. You enter their name, phone number, password and gate.</li>
              <li>2. A scanner account is created instantly — no email needed.</li>
              <li>3. They open <span className="font-semibold text-foreground-900">/gate-login</span> on their phone.</li>
              <li>4. They scan tickets with your password until you revoke it.</li>
            </ol>
          </Card>
        </div>
      </div>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite gate staff"
        description="You create their login now — phone number and password are all they need."
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitInvite} disabled={busy}>
              {busy ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-shield-keyhole-line" />}
              {busy ? "Creating login…" : "Create scanner login"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="staff-name">Full name</Label>
            <Input id="staff-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Mercy Achieng" />
          </div>
          <div>
            <Label htmlFor="staff-phone">Phone number</Label>
            <Input
              id="staff-phone"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="+254 712 345 678"
            />
            <p className="mt-1 text-[10px] text-foreground-500">This becomes their username. Include the country code.</p>
          </div>
          <div>
            <Label htmlFor="staff-password">Password</Label>
            <div className="flex gap-2">
              <Input
                id="staff-password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="At least 8 characters"
                className="min-w-0 flex-1"
              />
              <Button variant="outline" size="sm" onClick={() => setForm({ ...form, password: randomPassword() })}>
                <i className="ri-refresh-line" /> New
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <Label htmlFor="staff-gate">Assign gate</Label>
              <Select id="staff-gate" value={form.gate} onChange={(event) => setForm({ ...form, gate: event.target.value })}>
                {GATES.map((gate) => (
                  <option key={gate}>{gate}</option>
                ))}
              </Select>
            </div>
            <div className="min-w-0">
              <Label htmlFor="staff-event">Event</Label>
              <Select id="staff-event" value={form.eventId} onChange={(event) => setForm({ ...form, eventId: event.target.value })}>
                <option value="">All my events</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {formError && (
            <p className="rounded-md border border-accent-200 bg-accent-50 px-3 py-2 text-[11px] leading-relaxed text-accent-900">
              {formError}
            </p>
          )}

          <div className="rounded-md bg-background-100 p-3 text-[11px] leading-relaxed text-foreground-600">
            The account can only scan tickets. It cannot reach your dashboard, sales or payouts — and you
            can revoke it instantly at any time.
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        title="Revoke scanner access?"
        description="The staff member is signed out of the scanner immediately."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRevokeTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void handleRevoke()}>
              Revoke access
            </Button>
          </>
        }
      >
        <p className="text-xs leading-relaxed text-foreground-700">
          {revokeTarget?.full_name} will not be able to sign in again until you restore access. Tickets
          already scanned remain valid in the attendance record.
        </p>
      </Modal>

      <Modal
        open={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title="Set a new password"
        description="Use this when a staff member forgets their password."
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetTarget(null)}>
              Cancel
            </Button>
            <Button onClick={() => void handleReset()}>Save password</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs leading-relaxed text-foreground-700">
            New password for {resetTarget?.full_name} ({resetTarget ? `+${resetTarget.phone}` : ""}).
          </p>
          <div className="flex gap-2">
            <Input value={resetValue} onChange={(event) => setResetValue(event.target.value)} className="min-w-0 flex-1" />
            <Button variant="outline" size="sm" onClick={() => setResetValue(randomPassword())}>
              <i className="ri-refresh-line" /> New
            </Button>
          </div>
        </div>
      </Modal>
      <Toaster />
    </DashboardShell>
  );
}
