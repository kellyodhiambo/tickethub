import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PublicLayout from "@/components/feature/PublicLayout";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, Card } from "@/components/base/ui";
import AppearancePicker from "@/components/feature/AppearancePicker";
import { notifications } from "@/mocks/dashboard";
import { formatKsh, initialsOf } from "@/lib/helpers";
import { useApp } from "@/store/AppStore";
import { useAuth } from "@/store/AuthProvider";
import { supabase } from "@/lib/supabase";

const toggles = [
  { id: "reminders", label: "Event reminders", body: "A reminder 24 hours before doors open.", on: true },
  { id: "soldout", label: "Sold-out alerts", body: "Tell me when a saved event releases tickets.", on: true },
  { id: "promos", label: "Promotions", body: "Occasional offers from organizers I follow.", on: false },
  { id: "sms", label: "SMS notifications", body: "Ticket codes and gate changes by SMS.", on: true },
];

export default function AccountPage() {
  const navigate = useNavigate();
  const { orders, tickets, pushToast } = useApp();
  const { user, profile, loading: authLoading, refreshProfile, signOut } = useAuth();
  const [prefs, setPrefs] = useState(toggles);
  const [form, setForm] = useState({ full_name: "", location: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name ?? "", location: profile.location ?? "" });
  }, [profile]);

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: form.full_name.trim(),
          location: form.location.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) {
        pushToast(error.message, "danger");
        return;
      }
      await refreshProfile();
      pushToast("Profile changes saved.", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Could not save your profile.", "danger");
    } finally {
      setSaving(false);
    }
  };

  const spent = orders.filter((order) => order.status === "Paid").reduce((sum, order) => sum + order.total, 0);

  if (authLoading) {
    return (
      <PublicLayout>
        <div className="mx-auto flex w-full max-w-[1400px] items-center gap-2 px-4 py-20 text-sm text-foreground-600 md:px-6">
          <i className="ri-loader-4-line animate-spin" /> Loading your account…
        </div>
      </PublicLayout>
    );
  }

  if (!user) {
    return (
      <PublicLayout>
        <div className="mx-auto w-full max-w-md px-4 py-16 md:px-6 md:py-24">
          <Card className="p-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-background-100 text-foreground-800">
              <i className="ri-user-3-line text-xl" />
            </span>
            <h1 className="mt-3 text-lg font-bold text-foreground-950">Sign in to see your account</h1>
            <p className="mt-1.5 text-xs leading-relaxed text-foreground-600">
              Tickets, saved events and preferences live on your Dala account. Sign in or create one in
              under a minute.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link to="/signin" className="flex h-11 flex-1 cursor-pointer items-center justify-center rounded-btn bg-primary-500 text-xs font-semibold text-background-50 hover:bg-primary-600 dark:text-foreground-50">
                Sign in
              </Link>
              <Link to="/signup" className="flex h-11 flex-1 cursor-pointer items-center justify-center rounded-btn border border-background-300 text-xs font-semibold text-foreground-800 hover:bg-background-100">
                Create account
              </Link>
            </div>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 md:py-9">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-background-50">
                  {initialsOf(profile?.full_name || user.email || "Dala")}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground-950">{profile?.full_name ?? "Your account"}</p>
                  <p className="truncate text-[11px] text-foreground-500">{user.email}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge tone={profile?.verified ? "success" : "neutral"}>
                  {profile?.verified ? "Verified" : profile?.role ?? "Member"}
                </Badge>
                {profile?.location && <Badge tone="neutral">{profile.location}</Badge>}
              </div>

              <nav className="mt-4 flex flex-col">
                {[
                  { label: "My tickets", to: "/tickets", icon: "ri-ticket-2-line" },
                  { label: "Saved events", to: "/favorites", icon: "ri-heart-3-line" },
                  { label: "Organizer dashboard", to: "/organizer", icon: "ri-store-3-line" },
                  { label: "Admin console", to: "/admin", icon: "ri-shield-star-line" },
                  { label: "Gate scanner", to: "/scanner", icon: "ri-qr-scan-line" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="flex cursor-pointer items-center justify-between border-b border-background-100 py-2.5 text-xs font-medium text-foreground-800 last:border-0 hover:text-primary-700"
                  >
                    <span className="flex items-center gap-2">
                      <i className={`${item.icon} text-foreground-400`} />
                      {item.label}
                    </span>
                    <i className="ri-arrow-right-s-line text-foreground-300" />
                  </Link>
                ))}
              </nav>

              <Button
                variant="outline"
                block
                size="sm"
                className="mt-3"
                onClick={async () => {
                  await signOut();
                  pushToast("Signed out of your account.", "info");
                  navigate("/signin");
                }}
              >
                <i className="ri-logout-box-r-line" /> Sign out
              </Button>
            </Card>

            <Card className="mt-3 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-500">Lifetime</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <p className="font-num text-lg font-extrabold text-foreground-950">{tickets.length}</p>
                  <p className="text-[10px] text-foreground-500">Tickets held</p>
                </div>
                <div>
                  <p className="font-num text-lg font-extrabold text-foreground-950">{formatKsh(spent, { compact: true })}</p>
                  <p className="text-[10px] text-foreground-500">Total spent</p>
                </div>
              </div>
            </Card>
          </aside>

          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-foreground-950">Account</h1>
            <p className="mt-1 text-sm text-foreground-600">
              Manage your details, delivery channels and notification preferences.
            </p>

            <Card className="mt-4 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground-950">Profile details</p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={saveProfile}
                >
                  {saving ? <i className="ri-loader-4-line animate-spin" /> : null}
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-foreground-500">
                    Full name
                  </p>
                  <input
                    value={form.full_name}
                    onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                    placeholder="Your full name"
                    className="mt-1 w-full box-border rounded-field border border-background-300 bg-background-50 px-3 py-2 text-sm text-foreground-950 focus:border-primary-400 focus:outline-none"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-foreground-500">
                    Email address
                  </p>
                  <input
                    value={user.email ?? ""}
                    readOnly
                    className="mt-1 w-full box-border cursor-not-allowed rounded-field border border-background-200 bg-background-100 px-3 py-2 text-sm text-foreground-600"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-foreground-500">
                    Account role
                  </p>
                  <input
                    value={profile?.role ?? "member"}
                    readOnly
                    className="mt-1 w-full box-border cursor-not-allowed rounded-field border border-background-200 bg-background-100 px-3 py-2 text-sm capitalize text-foreground-600"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-foreground-500">
                    City
                  </p>
                  <input
                    value={form.location}
                    onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                    placeholder="Nairobi"
                    className="mt-1 w-full box-border rounded-field border border-background-300 bg-background-50 px-3 py-2 text-sm text-foreground-950 focus:border-primary-400 focus:outline-none"
                  />
                </div>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-foreground-500">
                Your email address is your sign-in identity and can only be changed through a verification
                email from account security.
              </p>
            </Card>

            <Card className="mt-3 p-4">
              <p className="text-sm font-bold text-foreground-950">Notifications</p>
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
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-background-50 transition-all ${
                          pref.on ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="mt-3 overflow-hidden p-0">
              <div className="p-4 pb-0">
                <p className="text-sm font-bold text-foreground-950">Display</p>
              </div>
              <AppearancePicker />
            </Card>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Card className="p-4">
                <p className="text-sm font-bold text-foreground-950">Payment methods</p>
                <p className="mt-1 text-[11px] text-foreground-500">
                  Saved methods are never stored on the device in production.
                </p>
                <div className="mt-3 flex items-center gap-3 rounded-md border border-background-200 p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-100 text-accent-700">
                    <i className="ri-smartphone-line" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground-900">M-Pesa ···· 908</p>
                    <p className="text-[10px] text-foreground-500">Primary collection number</p>
                  </div>
                  <Badge tone="success">Default</Badge>
                </div>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => pushToast("Add a payment method at checkout.", "info")}>
                  <i className="ri-add-line" /> Add method
                </Button>
              </Card>

              <Card className="p-4">
                <p className="text-sm font-bold text-foreground-950">Recent notifications</p>
                <div className="mt-2 space-y-2">
                  {notifications.slice(0, 3).map((item) => (
                    <div key={item.id} className="rounded-md bg-background-100 p-2.5">
                      <p className="text-[11px] font-semibold text-foreground-900">{item.title}</p>
                      <p className="mt-0.5 text-[10px] text-foreground-500">{item.time}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="mt-3 border-primary-200 bg-primary-50 p-4">
              <p className="text-xs font-bold text-primary-900">Security</p>
              <p className="mt-1 text-[11px] leading-relaxed text-primary-800">
                This account is protected by Supabase authentication. Sign-in codes are emailed to
                <span className="font-semibold"> {user.email}</span> and sessions refresh automatically on
                this device.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  to="/forgot-password"
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-btn border border-primary-300 bg-background-50 px-3 text-[11px] font-semibold text-foreground-900 hover:bg-primary-100"
                >
                  <i className="ri-lock-password-line" /> Change password
                </Link>
                <Link
                  to="/organizer/settings"
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-btn border border-primary-300 bg-background-50 px-3 text-[11px] font-semibold text-foreground-900 hover:bg-primary-100"
                >
                  <i className="ri-shield-check-line" /> Organizer verification
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <Toaster />
    </PublicLayout>
  );
}
