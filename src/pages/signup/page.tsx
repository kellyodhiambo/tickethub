import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Label } from "@/components/base/ui";
import AuthShell from "@/components/feature/AuthShell";
import VerifyCodeForm from "@/components/feature/VerifyCodeForm";
import { authCallbackUrl, describeAuthError } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/AuthProvider";
import { cn } from "@/lib/helpers";

type Intent = "member" | "organizer";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  const [intent, setIntent] = useState<Intent>("member");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [awaitingCode, setAwaitingCode] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (fullName.trim().length < 2) {
      setError("Tell us your full name so tickets carry the right attendee.");
      return;
    }
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: authCallbackUrl,
          data: {
            full_name: fullName.trim(),
            role: intent === "organizer" ? "organizer" : "member",
          },
        },
      });

      if (signUpError) {
        setError(describeAuthError(signUpError.message));
        return;
      }

      if (data.session) {
        navigate("/account", { replace: true });
        return;
      }

      setAwaitingCode(true);
    } catch (err) {
      setError(describeAuthError(err instanceof Error ? err.message : "Could not create your account."));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AuthShell title="Checking your session">
        <p className="flex items-center gap-2 text-sm text-foreground-600">
          <i className="ri-loader-4-line animate-spin" /> One moment…
        </p>
      </AuthShell>
    );
  }

  if (session && !awaitingCode) {
    return (
      <AuthShell
        eyebrow="Already signed in"
        title="You already have an account"
        subtitle="Continue to your account, or sign out first if you want to register a different person."
      >
        <Button block size="lg" onClick={() => navigate("/account", { replace: true })}>
          Go to my account
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={awaitingCode ? "One last step" : "Join Dala Tickets"}
      title={awaitingCode ? "Confirm your email" : "Create your account"}
      subtitle={
        awaitingCode
          ? "Enter the six-digit code we just sent to activate your account."
          : "Buy tickets in a few taps, or start selling with a verified organizer profile."
      }
    >
      {awaitingCode ? (
        <VerifyCodeForm
          email={email.trim()}
          type="signup"
          hint="Your password is already saved — verifying the code signs you in."
          onBack={() => setAwaitingCode(false)}
          onVerified={() => navigate("/account", { replace: true })}
        />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {[
              { id: "member" as Intent, label: "I want tickets", icon: "ri-ticket-2-line" },
              { id: "organizer" as Intent, label: "I run events", icon: "ri-store-3-line" },
            ].map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setIntent(item.id)}
                className={cn(
                  "flex cursor-pointer flex-col items-start gap-1 rounded-md border px-3 py-2.5 text-left transition-colors",
                  intent === item.id
                    ? "border-foreground-950 bg-foreground-950 text-background-50"
                    : "border-background-300 bg-background-50 text-foreground-700 hover:border-foreground-400"
                )}
              >
                <i className={cn(item.icon, "text-base")} />
                <span className="text-[11px] font-semibold">{item.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3" noValidate>
            <div>
              <Label htmlFor="fullname">Full name</Label>
              <Input
                id="fullname"
                name="fullname"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Amina Wanjiru"
                autoComplete="name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.co.ke"
                autoComplete="email"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  name="confirm"
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {intent === "organizer" && (
              <p className="rounded-md border border-secondary-200 bg-secondary-100 px-3 py-2 text-[11px] leading-relaxed text-secondary-900">
                Organizer accounts can create events right away. Verification — business documents and
                a payout account — is reviewed separately before the verified badge appears on your events.
              </p>
            )}

            {error && (
              <p className="rounded-md border border-accent-200 bg-accent-50 px-3 py-2 text-[11px] leading-relaxed text-accent-900">
                {error}
              </p>
            )}

            <Button block size="lg" type="submit" disabled={busy}>
              {busy ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-user-add-line" />}
              {busy ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-4 text-[11px] text-foreground-600">
            Already have an account?{" "}
            <Link to="/signin" className="cursor-pointer font-semibold text-foreground-950 underline">
              Sign in
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}