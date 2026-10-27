import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, Input, Label, Select, Textarea } from "@/components/base/ui";
import { fetchMyVerification, submitVerification, type VerificationRequest } from "@/lib/verificationApi";
import { useApp } from "@/store/AppStore";
import { useAuth } from "@/store/AuthProvider";

const categories = [
  "Concerts & live music",
  "Festivals",
  "Comedy & spoken word",
  "Conferences & business",
  "Sports & fitness",
  "Community & campus",
];

const emptyForm = {
  businessName: "",
  contactEmail: "",
  phone: "",
  city: "",
  category: categories[0],
  website: "",
  registrationNumber: "",
  reason: "",
};

export default function VerificationPanel() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { pushToast } = useApp();

  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: invokeError } = await fetchMyVerification();
      if (invokeError) {
        setError(invokeError);
        return;
      }
      setRequest(data?.request ?? null);
      if (data?.request) {
        setForm({
          businessName: data.request.business_name ?? "",
          contactEmail: data.request.contact_email ?? user.email ?? "",
          phone: data.request.phone ?? "",
          city: data.request.city ?? "",
          category: data.request.category || categories[0],
          website: data.request.website ?? "",
          registrationNumber: data.request.registration_number ?? "",
          reason: data.request.reason ?? "",
        });
      } else {
        setForm((current) => ({ ...current, contactEmail: current.contactEmail || user.email || "" }));
      }
      setShowForm(!data?.request || data.request.status === "rejected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your verification status.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.businessName.trim().length < 2) {
      pushToast("Enter the name of your business or brand.", "danger");
      return;
    }

    setBusy(true);
    try {
      const { data, error: invokeError } = await submitVerification(form);
      if (invokeError) {
        pushToast(invokeError, "danger");
        return;
      }
      setRequest(data?.request ?? null);
      setShowForm(false);
      await refreshProfile();
      pushToast("Application submitted. A platform admin will review it.", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Could not submit your application.", "danger");
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Card className="p-6">
        <p className="flex items-center gap-2 text-xs text-foreground-600">
          <i className="ri-loader-4-line animate-spin" /> Loading verification status…
        </p>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="p-6">
        <p className="text-sm font-bold text-foreground-950">Sign in to manage verification</p>
        <p className="mt-1 text-[11px] leading-relaxed text-foreground-600">
          Verification is tied to your account so only you can submit your business details.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/signin"
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-btn bg-primary-500 px-4 text-xs font-semibold text-background-50 hover:bg-primary-600 dark:text-foreground-50"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-btn border border-background-300 px-4 text-xs font-semibold text-foreground-800 hover:bg-background-100"
          >
            Create organizer account
          </Link>
        </div>
      </Card>
    );
  }

  const status = profile?.verified ? "verified" : request?.status ?? "not_submitted";

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground-950">Verification status</p>
            <p className="mt-1 text-[11px] text-foreground-500">
              {status === "verified" && "Your business documents were approved by a platform admin."}
              {status === "pending" &&
                `Submitted ${new Date(request?.created_at ?? Date.now()).toLocaleDateString("en-KE")} · waiting for admin review.`}
              {status === "rejected" && "Your last application was not approved. You can correct it and resubmit."}
              {status === "not_submitted" && "Submit your business details to be reviewed for the verified badge."}
            </p>
          </div>
          {status === "verified" && <Badge tone="success">Verified</Badge>}
          {status === "pending" && <Badge tone="warning">Under review</Badge>}
          {status === "rejected" && <Badge tone="danger">Rejected</Badge>}
          {status === "not_submitted" && <Badge tone="neutral">Not submitted</Badge>}
        </div>

        {request?.review_notes && (
          <div className="mt-3 rounded-md border border-background-200 bg-background-100 p-3">
            <p className="text-[10px] font-label font-bold uppercase tracking-wider text-foreground-500">
              Admin note
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-foreground-700">{request.review_notes}</p>
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-md border border-accent-200 bg-accent-50 px-3 py-2 text-[11px] text-accent-900">
            {error}
          </p>
        )}

        {status === "pending" && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-[10px] leading-relaxed text-foreground-500">
              You can update your details while the review is open.
            </p>
            <Button size="sm" variant="outline" onClick={() => setShowForm((value) => !value)}>
              {showForm ? "Hide form" : "Update application"}
            </Button>
          </div>
        )}

        {status === "verified" && (
          <p className="mt-3 text-[10px] leading-relaxed text-foreground-500">
            The verified badge is displayed publicly on your events. Only platform administrators can
            approve or revoke it.
          </p>
        )}

        {status === "rejected" && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            Resubmit application
          </Button>
        )}

        {status === "not_submitted" && !showForm && (
          <Button size="sm" className="mt-3" onClick={() => setShowForm(true)}>
            Start verification
          </Button>
        )}
      </Card>

      {showForm && status !== "verified" && (
        <Card className="p-4">
          <p className="text-sm font-bold text-foreground-950">Organizer verification application</p>
          <p className="mt-1 text-[11px] text-foreground-600">
            Everything below goes to the platform admin review queue. Nothing is published publicly.
          </p>

          <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <Label htmlFor="businessName">Business or brand name</Label>
              <Input
                id="businessName"
                value={form.businessName}
                onChange={(event) => setForm((current) => ({ ...current, businessName: event.target.value }))}
                placeholder="DalaLive Events"
                required
              />
            </div>
            <div className="min-w-0">
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))}
                placeholder="you@example.co.ke"
              />
            </div>
            <div className="min-w-0">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="+254 712 000 118"
              />
            </div>
            <div className="min-w-0">
              <Label htmlFor="city">Home city</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                placeholder="Nairobi"
              />
            </div>
            <div className="min-w-0">
              <Label htmlFor="category">Main category</Label>
              <Select
                id="category"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>
            <div className="min-w-0">
              <Label htmlFor="registration">Business registration / permit</Label>
              <Input
                id="registration"
                value={form.registrationNumber}
                onChange={(event) => setForm((current) => ({ ...current, registrationNumber: event.target.value }))}
                placeholder="PVT-XXXXXXX"
              />
            </div>
            <div className="min-w-0 sm:col-span-2">
              <Label htmlFor="website">Website or social page</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
                placeholder="https://dalalive.co.ke"
              />
            </div>
            <div className="min-w-0 sm:col-span-2">
              <Label htmlFor="reason">What kind of events do you run?</Label>
              <Textarea
                id="reason"
                maxLength={500}
                value={form.reason}
                onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                placeholder="Lakeside concerts and festivals in western Kenya since 2016."
              />
              <p className="mt-1 text-right text-[10px] text-foreground-400">{form.reason.length}/500</p>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-send-plane-line" />}
                {busy ? "Submitting…" : "Submit for review"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="border-primary-200 bg-primary-50 p-4">
        <p className="text-xs font-bold text-primary-900">Need to update documents?</p>
        <p className="mt-1 text-[11px] leading-relaxed text-primary-800">
          Resubmitting moves your application back into the queue. Existing events stay live while the
          review is in progress, and your account keeps selling.
        </p>
      </Card>
    </div>
  );
}