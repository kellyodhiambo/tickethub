import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button, Input, Label } from "@/components/base/ui";
import { authCallbackUrl, describeAuthError } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type CodeType = "signup" | "email" | "recovery";

type Props = {
  email: string;
  type: CodeType;
  onVerified: () => void;
  onBack: () => void;
  hint?: string;
};

const RESEND_SECONDS = 45;

export default function VerifyCodeForm({ email, type, onVerified, onBack, hint }: Props) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const token = code.replace(/\D/g, "");
    if (token.length < 6) {
      setError("Enter the six-digit code from the email.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type,
      });
      if (verifyError) {
        setError(describeAuthError(verifyError.message));
        return;
      }
      onVerified();
    } catch (err) {
      setError(describeAuthError(err instanceof Error ? err.message : "Could not verify that code."));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0 || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      let resendError: string | null = null;

      if (type === "signup") {
        const { error: err } = await supabase.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: authCallbackUrl },
        });
        resendError = err?.message ?? null;
      } else if (type === "recovery") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${authCallbackUrl}?next=/auth/reset-password`,
        });
        resendError = err?.message ?? null;
      } else {
        const { error: err } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false, emailRedirectTo: authCallbackUrl },
        });
        resendError = err?.message ?? null;
      }

      if (resendError) {
        setError(describeAuthError(resendError));
        return;
      }
      setNotice("A fresh code is on its way. Check your inbox and spam folder.");
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(describeAuthError(err instanceof Error ? err.message : "Could not resend the code."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="rounded-md border border-background-200 bg-background-100 p-3">
        <p className="text-[11px] leading-relaxed text-foreground-700">
          We sent a six-digit code to <span className="font-semibold text-foreground-950">{email}</span>.
          {hint ? ` ${hint}` : " Enter it below to continue."}
        </p>
      </div>

      <div>
        <Label htmlFor="code">Six-digit code</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="123456"
          className="text-center font-num text-xl tracking-[0.5em]"
        />
      </div>

      {error && (
        <p className="rounded-md border border-accent-200 bg-accent-50 px-3 py-2 text-[11px] leading-relaxed text-accent-900">
          {error}
        </p>
      )}
      {notice && !error && (
        <p className="rounded-md border border-background-300 bg-background-100 px-3 py-2 text-[11px] leading-relaxed text-foreground-700">
          {notice}
        </p>
      )}

      <Button block size="lg" type="submit" disabled={busy}>
        {busy ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-shield-check-line" />}
        {busy ? "Verifying…" : "Verify and continue"}
      </Button>

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer whitespace-nowrap text-[11px] font-semibold text-foreground-600 hover:text-foreground-900"
        >
          <i className="ri-arrow-left-line" /> Change email
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || busy}
          className="cursor-pointer whitespace-nowrap text-[11px] font-semibold text-foreground-700 hover:text-foreground-950 disabled:cursor-not-allowed disabled:text-foreground-400"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>

      <p className="text-[10px] leading-relaxed text-foreground-500">
        The email also contains a link. If you open it on this device you&apos;ll land back here signed in.
        Still stuck? <Link to="/organizer/support" className="cursor-pointer underline">Contact support</Link>.
      </p>
    </form>
  );
}