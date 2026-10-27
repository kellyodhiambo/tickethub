import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Label } from "@/components/base/ui";
import AuthShell from "@/components/feature/AuthShell";
import VerifyCodeForm from "@/components/feature/VerifyCodeForm";
import { authCallbackUrl, describeAuthError } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      setError("Enter the email address on your account.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${authCallbackUrl}?next=/auth/reset-password`,
      });
      if (resetError) {
        setError(describeAuthError(resetError.message));
        return;
      }
      setSent(true);
    } catch (err) {
      setError(describeAuthError(err instanceof Error ? err.message : "Could not send the recovery email."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account recovery"
      title={sent ? "Check your email" : "Reset your password"}
      subtitle={
        sent
          ? "Use the six-digit code below to prove it is you, then set a new password."
          : "We will email a six-digit code plus a reset link to the address on your account."
      }
    >
      {sent ? (
        <VerifyCodeForm
          email={email.trim()}
          type="recovery"
          hint="The code expires shortly, so use it soon."
          onBack={() => setSent(false)}
          onVerified={() => navigate("/auth/reset-password", { replace: true })}
        />
      ) : (
        <form onSubmit={submit} className="space-y-3" noValidate>
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.co.ke"
            />
          </div>

          {error && (
            <p className="rounded-md border border-accent-200 bg-accent-50 px-3 py-2 text-[11px] leading-relaxed text-accent-900">
              {error}
            </p>
          )}

          <Button block size="lg" type="submit" disabled={busy}>
            {busy ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-mail-send-line" />}
            {busy ? "Sending…" : "Send reset code"}
          </Button>

          <p className="text-[11px] text-foreground-600">
            Remembered it?{" "}
            <Link to="/signin" className="cursor-pointer font-semibold text-foreground-950 underline">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}