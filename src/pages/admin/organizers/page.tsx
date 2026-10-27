import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import DashboardShell from "@/components/feature/DashboardShell";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, Card, Modal, TableWrap, Td, Th, Textarea } from "@/components/base/ui";
import { adminMobileNav, adminNav } from "@/pages/organizer/nav";
import {
  fetchVerificationQueue,
  reviewVerification,
  type VerificationQueueItem,
} from "@/lib/verificationApi";
import { initialsOf } from "@/lib/helpers";
import { useAuth } from "@/store/AuthProvider";
import { useApp } from "@/store/AppStore";

const statusTone = (status: string) =>
  status === "approved" ? "success" : status === "rejected" ? "danger" : "warning";

export default function AdminOrganizersPage() {
  const { user, profile, loading: authLoading, isAdmin } = useAuth();
  const { pushToast } = useApp();

  const [items, setItems] = useState<VerificationQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<VerificationQueueItem | null>(null);
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: invokeError } = await fetchVerificationQueue();
      if (invokeError) {
        setError(invokeError);
        return;
      }
      setItems(data?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the verification queue.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () => ({
      pending: items.filter((item) => item.status === "pending").length,
      approved: items.filter((item) => item.status === "approved").length,
      rejected: items.filter((item) => item.status === "rejected").length,
    }),
    [items]
  );

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.status === filter)),
    [items, filter]
  );

  const submitReview = async () => {
    if (!active || !decision) return;
    setBusy(true);
    try {
      const { error: reviewError } = await reviewVerification(active.id, decision, notes);
      if (reviewError) {
        pushToast(reviewError, "danger");
        return;
      }
      pushToast(
        decision === "approve"
          ? `${active.business_name} is now a verified organizer.`
          : `${active.business_name} was not approved.`,
        decision === "approve" ? "success" : "warning"
      );
      setActive(null);
      setDecision(null);
      setNotes("");
      await load();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Could not record that decision.", "danger");
    } finally {
      setBusy(false);
    }
  };

  const shell = (children: ReactNode) => (
    <DashboardShell
      variant="admin"
      nav={adminNav}
      mobileNav={adminMobileNav}
      userName={profile?.full_name ?? user?.email ?? "Platform Admin"}
      userRole={isAdmin ? "Platform admin" : "Organizer review"}
      initials={initialsOf(profile?.full_name ?? user?.email ?? "Dala")}
      title="Organizers"
      description="Verification queue — only platform admins can approve or reject"
    >
      {children}
      <Toaster />
    </DashboardShell>
  );

  if (authLoading) {
    return shell(
      <Card className="p-6">
        <p className="flex items-center gap-2 text-xs text-foreground-600">
          <i className="ri-loader-4-line animate-spin" /> Checking your access…
        </p>
      </Card>
    );
  }

  if (!user) {
    return shell(
      <Card className="mx-auto max-w-md p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-background-100 text-foreground-800">
          <i className="ri-lock-2-line text-xl" />
        </span>
        <p className="mt-3 text-sm font-bold text-foreground-950">Admin sign-in required</p>
        <p className="mt-1 text-[11px] leading-relaxed text-foreground-600">
          Organizer applications contain business documents, so the review queue is restricted to
          signed-in platform administrators.
        </p>
        <Link
          to="/signin?next=%2Fadmin%2Forganizers"
          className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center rounded-btn bg-primary-500 px-4 text-xs font-semibold text-background-50 hover:bg-primary-600 dark:text-foreground-50"
        >
          Sign in as admin
        </Link>
      </Card>
    );
  }

  if (error) {
    const denied = error.toLowerCase().includes("platform admins");
    return shell(
      <Card className={denied ? "mx-auto max-w-md p-6 text-center" : "mx-auto max-w-md p-6 text-center"}>
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 text-accent-800">
          <i className={denied ? "ri-shield-keyhole-line text-xl" : "ri-error-warning-line text-xl"} />
        </span>
        <p className="mt-3 text-sm font-bold text-foreground-950">
          {denied ? "This account is not a platform admin" : "Could not load the queue"}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-foreground-600">
          {denied
            ? `You are signed in as ${profile?.role ?? "a member"}. Only accounts with the admin role can review organizer verification.`
            : error}
        </p>
        <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
          <Button variant="outline" onClick={load}>
            <i className="ri-refresh-line" /> Try again
          </Button>
          <Link
            to="/account"
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-btn border border-background-300 px-4 text-xs font-semibold text-foreground-800 hover:bg-background-100"
          >
            Back to my account
          </Link>
        </div>
      </Card>
    );
  }

  return shell(
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Awaiting review", value: counts.pending, icon: "ri-time-line" },
          { label: "Verified organizers", value: counts.approved, icon: "ri-verified-badge-line" },
          { label: "Rejected", value: counts.rejected, icon: "ri-close-circle-line" },
        ].map((stat) => (
          <Card key={stat.label} className="flex items-center justify-between p-4">
            <div>
              <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-foreground-500">
                {stat.label}
              </p>
              <p className="mt-1 font-num text-2xl font-extrabold text-foreground-950">{stat.value}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-background-100 text-foreground-700">
              <i className={stat.icon} />
            </span>
          </Card>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 rounded-full border border-background-300 bg-background-100 p-1">
        {(["all", "pending", "approved", "rejected"] as const).map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-semibold capitalize transition-colors ${
              filter === item ? "bg-background-50 text-foreground-950" : "text-foreground-600 hover:text-foreground-900"
            }`}
          >
            {item}
          </button>
        ))}
        <button
          onClick={load}
          className="ml-auto flex cursor-pointer items-center gap-1 px-2 text-[11px] font-semibold text-foreground-600 hover:text-foreground-950"
        >
          <i className="ri-refresh-line" /> Refresh
        </button>
      </div>

      <div className="mt-4">
        {loading ? (
          <Card className="p-6">
            <p className="flex items-center gap-2 text-xs text-foreground-600">
              <i className="ri-loader-4-line animate-spin" /> Loading applications…
            </p>
          </Card>
        ) : visible.length === 0 ? (
          <Card className="p-8 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-background-100 text-foreground-700">
              <i className="ri-inbox-line text-xl" />
            </span>
            <p className="mt-3 text-sm font-bold text-foreground-950">No applications in this view</p>
            <p className="mt-1 text-[11px] text-foreground-600">
              When an organizer submits their business details, the request appears here for review.
            </p>
          </Card>
        ) : (
          <>
            <div className="hidden lg:block">
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Organizer</Th>
                    <Th>City</Th>
                    <Th>Category</Th>
                    <Th>Submitted</Th>
                    <Th>Status</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => (
                    <tr key={item.id} className="hover:bg-background-50">
                      <Td>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-foreground-950">{item.business_name}</p>
                          <p className="truncate text-[10px] text-foreground-500">
                            {item.user?.full_name ?? "—"} · {item.user?.email ?? "—"}
                          </p>
                        </div>
                      </Td>
                      <Td className="text-xs">{item.city || "—"}</Td>
                      <Td className="text-xs">{item.category || "—"}</Td>
                      <Td className="text-xs">{new Date(item.created_at).toLocaleDateString("en-KE")}</Td>
                      <Td>
                        <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                      </Td>
                      <Td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setActive(item);
                              setDecision(null);
                              setNotes(item.review_notes ?? "");
                            }}
                            className="cursor-pointer text-[11px] font-semibold text-foreground-900"
                          >
                            Review
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </div>

            <div className="space-y-2.5 lg:hidden">
              {visible.map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-foreground-950">{item.business_name}</p>
                      <p className="truncate text-[10px] text-foreground-500">
                        {item.city || "—"} · {item.category || "—"}
                      </p>
                    </div>
                    <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[10px] text-foreground-500">
                      {new Date(item.created_at).toLocaleDateString("en-KE")}
                    </p>
                    <button
                      onClick={() => {
                        setActive(item);
                        setDecision(null);
                        setNotes(item.review_notes ?? "");
                      }}
                      className="cursor-pointer text-[11px] font-semibold text-foreground-900"
                    >
                      Review application
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <Card className="mt-4 border-secondary-200 bg-secondary-100 p-4">
        <p className="text-xs font-bold text-secondary-900">How approval works</p>
        <p className="mt-1 text-[11px] leading-relaxed text-secondary-800">
          Approving sets the organizer role, marks the account verified, and unlocks withdrawals.
          Rejecting keeps the account active but leaves it unverified, and your note is shown to the
          applicant so they can fix and resubmit.
        </p>
      </Card>

      <Modal
        open={Boolean(active)}
        onClose={() => {
          setActive(null);
          setDecision(null);
        }}
        title={active?.business_name ?? "Application"}
        description="Review the submitted business details before deciding."
        width="max-w-2xl"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setActive(null);
                setDecision(null);
              }}
            >
              Close
            </Button>
            {active?.status !== "approved" && (
              <>
                <Button variant="danger" onClick={() => setDecision("reject")} disabled={busy}>
                  Reject
                </Button>
                <Button onClick={() => setDecision("approve")} disabled={busy}>
                  Approve & verify
                </Button>
              </>
            )}
            {active?.status === "approved" && (
              <Button variant="outline" onClick={() => setDecision("reject")} disabled={busy}>
                Revoke verification
              </Button>
            )}
          </>
        }
      >
        {active && (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { label: "Applicant", value: active.user?.full_name ?? "—" },
                { label: "Account email", value: active.user?.email ?? "—" },
                { label: "Phone", value: active.phone || "—" },
                { label: "City", value: active.city || "—" },
                { label: "Category", value: active.category || "—" },
                { label: "Registration", value: active.registration_number || "—" },
                { label: "Website", value: active.website || "—" },
                {
                  label: "Submitted",
                  value: new Date(active.created_at).toLocaleDateString("en-KE"),
                },
              ].map((item) => (
                <div key={item.label} className="rounded-md border border-background-200 p-2.5">
                  <p className="text-[9.5px] font-label font-semibold uppercase tracking-wider text-foreground-500">
                    {item.label}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-foreground-950">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-md border border-background-200 bg-background-100 p-3">
              <p className="text-[9.5px] font-label font-semibold uppercase tracking-wider text-foreground-500">
                What they run
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-foreground-700">
                {active.reason || "No description provided."}
              </p>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-label font-semibold uppercase tracking-wider text-foreground-500">
                Review note (shown to the organizer)
              </p>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={400}
                placeholder="Documents checked against the business register."
              />
            </div>

            {decision && (
              <div className="rounded-md border border-background-300 bg-background-50 p-3">
                <p className="text-[11px] font-semibold text-foreground-950">
                  {decision === "approve" ? "Confirm approval" : "Confirm rejection"}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-foreground-600">
                  {decision === "approve"
                    ? "This marks the account verified, sets the organizer role and unlocks withdrawals."
                    : "The account stays active but unverified. The organizer can correct details and resubmit."}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setDecision(null)} disabled={busy}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant={decision === "approve" ? "primary" : "danger"}
                    onClick={submitReview}
                    disabled={busy}
                  >
                    {busy ? <i className="ri-loader-4-line animate-spin" /> : null}
                    {busy ? "Saving…" : decision === "approve" ? "Yes, verify" : "Yes, reject"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}