import { useState } from "react";
import DashboardShell from "@/components/feature/DashboardShell";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, Card, Input, Label, Modal, Select, Textarea } from "@/components/base/ui";
import { organizerMobileNav, organizerNav } from "@/pages/organizer/nav";
import { useApp } from "@/store/AppStore";
import VerificationPanel from "./components/VerificationPanel";

const tabs = [
  { id: "profile", label: "Profile" },
  { id: "verification", label: "Verification" },
  { id: "payouts", label: "Payouts" },
  { id: "notifications", label: "Notifications" },
  { id: "danger", label: "Danger zone" },
];

export default function OrganizerSettingsPage() {
  const { pushToast } = useApp();
  const [tab, setTab] = useState("profile");
  const [closeOpen, setCloseOpen] = useState(false);
  const [prefs, setPrefs] = useState([
    { id: "sales", label: "New sale alerts", body: "Notify me for every confirmed order.", on: true },
    { id: "payouts", label: "Payout updates", body: "Status changes on withdrawals.", on: true },
    { id: "scans", label: "Gate scan issues", body: "Duplicate or invalid scans at the gate.", on: true },
    { id: "weekly", label: "Weekly summary", body: "Sales and attendance digest each Monday.", on: false },
  ]);

  return (
    <DashboardShell
      variant="organizer"
      nav={organizerNav}
      mobileNav={organizerMobileNav}
      userName="DalaLive Events"
      userRole="Verified organizer · Kisumu"
      initials="DL"
      title="Settings"
      description="Organizer profile, verification and payout details"
    >
      <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
        <aside>
          <Card className="p-2">
            {tabs.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`mb-0.5 w-full cursor-pointer rounded-md px-2.5 py-2 text-left text-[11px] font-medium transition-colors ${
                  tab === item.id
                    ? "bg-foreground-950 text-background-50"
                    : item.id === "danger"
                    ? "text-primary-700 hover:bg-primary-50"
                    : "text-foreground-700 hover:bg-background-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </Card>
        </aside>

        <div className="min-w-0 space-y-3">
          {tab === "profile" && (
            <>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground-950">Organizer profile</p>
                  <Button size="sm" variant="outline" onClick={() => pushToast("Profile saved.", "success")}>
                    Save changes
                  </Button>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground-950 text-sm font-bold text-background-50">
                    DL
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-foreground-900">Organizer logo</p>
                    <p className="text-[10px] text-foreground-500">PNG or JPG, at least 400×400</p>
                    <Button size="sm" variant="ghost" className="mt-1 h-7 px-0" onClick={() => pushToast("Upload opens in production.", "info")}>
                      Upload new logo
                    </Button>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="min-w-0">
                    <Label htmlFor="business">Business name</Label>
                    <Input id="business" defaultValue="DalaLive Events" />
                  </div>
                  <div className="min-w-0">
                    <Label htmlFor="email">Contact email</Label>
                    <Input id="email" defaultValue="dala.live@example.co.ke" />
                  </div>
                  <div className="min-w-0">
                    <Label htmlFor="phone">Phone number</Label>
                    <Input id="phone" defaultValue="+254 712 000 118" />
                  </div>
                  <div className="min-w-0">
                    <Label htmlFor="city">Home city</Label>
                    <Select id="city" defaultValue="Kisumu">
                      <option>Kisumu</option>
                      <option>Nairobi</option>
                      <option>Mombasa</option>
                      <option>Nakuru</option>
                      <option>Eldoret</option>
                    </Select>
                  </div>
                </div>
                <div className="mt-3">
                  <Label htmlFor="bio">About your events</Label>
                  <Textarea id="bio" defaultValue="Lakeside concert and festival producers running the biggest open-air stages in western Kenya since 2016." maxLength={500} />
                </div>
              </Card>

              <Card className="p-4">
                <p className="text-sm font-bold text-foreground-950">Public links</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" defaultValue="https://dalalive.co.ke" />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input id="instagram" defaultValue="@dalalive" />
                  </div>
                </div>
              </Card>
            </>
          )}

          {tab === "verification" && <VerificationPanel />}

          {tab === "payouts" && (
            <>
              <Card className="p-4">
                <p className="text-sm font-bold text-foreground-950">Payout accounts</p>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between rounded-md border border-background-200 p-3">
                    <div>
                      <p className="text-[11px] font-semibold text-foreground-900">M-Pesa · +254 712 000 118</p>
                      <p className="text-[10px] text-foreground-500">Primary · DalaLive Events</p>
                    </div>
                    <Badge tone="success">Verified</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-background-200 p-3">
                    <div>
                      <p className="text-[11px] font-semibold text-foreground-900">KCB ·•••• 4471</p>
                      <p className="text-[10px] text-foreground-500">Secondary · DalaLive Events Ltd</p>
                    </div>
                    <Badge tone="neutral">Active</Badge>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => pushToast("Changing payout details requires re-verification.", "warning")}>
                  Add payout account
                </Button>
              </Card>
              <Card className="p-4">
                <p className="text-sm font-bold text-foreground-950">Commission</p>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-foreground-600">Your platform commission</span>
                  <span className="font-semibold text-foreground-950">10%</span>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-foreground-500">
                  Commission rates are set by the platform admin. Event-specific overrides require
                  approval and are disclosed before publishing.
                </p>
              </Card>
            </>
          )}

          {tab === "notifications" && (
            <Card className="p-4">
              <p className="text-sm font-bold text-foreground-950">Notification preferences</p>
              <div className="mt-3 space-y-2">
                {prefs.map((pref) => (
                  <div key={pref.id} className="flex items-center justify-between gap-3 rounded-md border border-background-200 p-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground-900">{pref.label}</p>
                      <p className="text-[11px] text-foreground-500">{pref.body}</p>
                    </div>
                    <button
                      onClick={() =>
                        setPrefs((current) =>
                          current.map((item) => (item.id === pref.id ? { ...item, on: !item.on } : item))
                        )
                      }
                      className={`relative h-6 w-11 flex-none cursor-pointer rounded-full transition-colors ${
                        pref.on ? "bg-primary-500" : "bg-background-300"
                      }`}
                      aria-label={`Toggle ${pref.label}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background-50 transition-all ${pref.on ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === "danger" && (
            <>
              <Card className="border-primary-300 p-4">
                <p className="text-sm font-bold text-primary-900">Pause all ticket sales</p>
                <p className="mt-1 text-[11px] leading-relaxed text-foreground-600">
                  Temporarily stops sales on every live event. Already-issued tickets stay valid and gate
                  scanning continues to work.
                </p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => pushToast("All ticket sales paused.", "warning")}>
                  Pause all sales
                </Button>
              </Card>
              <Card className="border-primary-300 p-4">
                <p className="text-sm font-bold text-primary-900">Close organizer account</p>
                <p className="mt-1 text-[11px] leading-relaxed text-foreground-600">
                  Closing your account cancels future events and starts refunds for paid orders. Outstanding
                  payouts are reviewed by finance first.
                </p>
                <Button size="sm" variant="danger" className="mt-2" onClick={() => setCloseOpen(true)}>
                  Request account closure
                </Button>
              </Card>
            </>
          )}
        </div>
      </div>

      <Modal
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        title="Request account closure"
        description="This is a serious financial action and needs a second confirmation."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCloseOpen(false)}>
              Keep my account
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setCloseOpen(false);
                pushToast("Closure request submitted to platform support.", "warning");
              }}
            >
              Submit request
            </Button>
          </>
        }
      >
        <p className="text-xs leading-relaxed text-foreground-700">
          An account manager will contact you to confirm event cancellations, refund obligations and any
          outstanding balance before the account is closed.
        </p>
      </Modal>
      <Toaster />
    </DashboardShell>
  );
}