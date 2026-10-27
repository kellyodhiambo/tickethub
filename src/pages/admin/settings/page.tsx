import { useState } from "react";
import DashboardShell from "@/components/feature/DashboardShell";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, Card, Input, Label, Modal, Select } from "@/components/base/ui";
import { adminMobileNav, adminNav } from "@/pages/organizer/nav";
import { useApp } from "@/store/AppStore";

const featureFlags = [
  { id: "waitlist", label: "Waitlists for sold-out events", body: "Let attendees join a queue and notify them on release.", on: true },
  { id: "transfers", label: "Ticket transfers", body: "Allow buyers to request a name change where organizers permit it.", on: true },
  { id: "promoters", label: "Promoter commissions", body: "Enable referral codes and campaign tracking.", on: true },
  { id: "offline", label: "Offline scanner mode", body: "Queue scans locally when the network drops.", on: true },
  { id: "reviews", label: "Public organizer reviews", body: "Only visible after a verified attendance.", on: false },
];

export default function AdminSettingsPage() {
  const { pushToast } = useApp();
  const [flags, setFlags] = useState(featureFlags);
  const [dangerOpen, setDangerOpen] = useState(false);

  return (
    <DashboardShell
      variant="admin"
      nav={adminNav}
      mobileNav={adminMobileNav}
      userName="Platform Admin"
      userRole="Super admin · Nairobi"
      initials="PA"
      title="Settings"
      description="Marketplace configuration, payment providers and security"
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm font-bold text-foreground-950">Marketplace</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <Label htmlFor="brand">Platform name</Label>
              <Input id="brand" defaultValue="Dala Tickets" />
            </div>
            <div className="min-w-0">
              <Label htmlFor="currency">Currency</Label>
              <Select id="currency" defaultValue="KES">
                <option value="KES">KES — Kenyan Shilling</option>
              </Select>
            </div>
            <div className="min-w-0">
              <Label htmlFor="timezone">Time zone</Label>
              <Select id="timezone" defaultValue="EAT">
                <option value="EAT">East Africa Time (UTC+3)</option>
              </Select>
            </div>
            <div className="min-w-0">
              <Label htmlFor="fee">Service fee (%)</Label>
              <Input id="fee" defaultValue="2" inputMode="numeric" />
            </div>
          </div>
          <Button size="sm" className="mt-3" onClick={() => pushToast("Marketplace settings saved.", "success")}>
            Save settings
          </Button>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-bold text-foreground-950">Payment providers</p>
          <div className="mt-3 space-y-2">
            {[
              { name: "M-Pesa (Daraja)", status: "Not configured", body: "STK Push collection requires approved business products." },
              { name: "Card payments", status: "Not configured", body: "Provider onboarding and 3DS support required." },
              { name: "Bank payouts", status: "Not configured", body: "Settlement model agreement with the provider required." },
            ].map((provider) => (
              <div key={provider.name} className="rounded-md border border-background-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground-900">{provider.name}</p>
                  <Badge tone="warning">{provider.status}</Badge>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-foreground-500">{provider.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-foreground-500">
            No payment method is shown as live until credentials are configured server-side and a test
            transaction has been verified end to end.
          </p>
        </Card>
      </div>

      <Card className="mt-3 p-4">
        <p className="text-sm font-bold text-foreground-950">Feature flags</p>
        <div className="mt-3 space-y-2">
          {flags.map((flag) => (
            <div key={flag.id} className="flex items-center justify-between gap-3 rounded-md border border-background-200 p-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground-900">{flag.label}</p>
                <p className="text-[11px] text-foreground-500">{flag.body}</p>
              </div>
              <button
                onClick={() =>
                  setFlags((current) =>
                    current.map((item) => (item.id === flag.id ? { ...item, on: !item.on } : item))
                  )
                }
                className={`relative h-6 w-11 flex-none cursor-pointer rounded-full transition-colors ${
                  flag.on ? "bg-primary-500" : "bg-background-300"
                }`}
                aria-label={`Toggle ${flag.label}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background-50 transition-all ${flag.on ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm font-bold text-foreground-950">Security</p>
          <div className="mt-2 space-y-2 text-[11px]">
            {[
              "Row Level Security is enabled on every table in production.",
              "Service-role and payment secrets stay in server-side functions only.",
              "Financial actions require a second confirmation and are audited.",
              "Gate staff accounts are scanner-scoped and can be revoked instantly.",
            ].map((item) => (
              <p key={item} className="flex items-start gap-2 text-foreground-600">
                <i className="ri-shield-check-line mt-0.5 text-accent-600" /> {item}
              </p>
            ))}
          </div>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => pushToast("Security review checklist opened.", "info")}>
            Open security checklist
          </Button>
        </Card>

        <Card className="border-primary-300 p-4">
          <p className="text-sm font-bold text-primary-900">Danger zone</p>
          <p className="mt-1 text-[11px] leading-relaxed text-foreground-600">
            Platform-wide actions affect every organizer and attendee. These require owner approval and
            are always written to the audit log.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button size="sm" variant="outline" onClick={() => pushToast("Ticket sales paused platform-wide.", "warning")}>
              Pause all sales
            </Button>
            <Button size="sm" variant="danger" onClick={() => setDangerOpen(true)}>
              Disable live payments
            </Button>
          </div>
        </Card>
      </div>

      <Modal
        open={dangerOpen}
        onClose={() => setDangerOpen(false)}
        title="Disable live payments?"
        description="Checkout will fall back to registration-only while disabled."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDangerOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDangerOpen(false);
                pushToast("Live payments disabled. Checkout is now registration-only.", "warning");
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-xs leading-relaxed text-foreground-700">
          Existing tickets remain valid and scanning continues to work. Organizers are notified
          automatically and payouts are frozen until payments are re-enabled.
        </p>
      </Modal>
      <Toaster />
    </DashboardShell>
  );
}
