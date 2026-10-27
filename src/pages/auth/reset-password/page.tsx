import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Label } from "@/components/base/ui";
import AuthShell from "@/components/feature/AuthShell";
import { describeAuthError } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setHasSession(Boolean(data.session));
      })
      .catch(() => {
        if (active) setHasSession(false);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those two passwords do not match.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(describeAuthError(updateError.message));
        return;
      }
      setDone(true);
      await supabase.auth.signOut();
      window.setTimeout(() => navigate("/signin", { replace: true }), 1200);
    } catch (err) {
      setError(describeAuthError(err instanceof Error ? err.message : "Could not update your password."));
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <AuthShell title="Checking your recovery link">
        <p className="flex items-center gap-2 text-sm text-foreground-600">
          <i className="ri-loader-4-line animate-spin" /> One moment…
        </p>
      </AuthShell>
    );
  }

  if (!hasSession) {
    return (
      <AuthShell
        eyebrow="Link expired"
        title="Request a fresh code"
        subtitle="Recovery links are single-use and expire quickly. Start again to get a new six-digit code."
      >
        <Button block size="lg" onClick={() => navigate("/forgot-password", { replace: true })}>
          Send a new reset code
        </Button>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="You can now sign in with your new password.">
        <Button block size="lg" onClick={() => navigate("/signin", { replace: true })}>
          Go to sign in
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Almost there"
      title="Set a new password"
      subtitle="Choose something you have not used on this account before."
    >
      <form onSubmit={submit} className="space-y-3" noValidate>
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="Repeat password"
          />
        </div>

        {error && (
          <p className="rounded-md border border-accent-200 bg-accent-50 px-3 py-2 text-[11px] leading-relaxed text-accent-900">
            {error}
          </p>
        )}

        <Button block size="lg" type="submit" disabled={busy}>
          {busy ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-lock-password-line" />}
          {busy ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </AuthShell>
  );
}