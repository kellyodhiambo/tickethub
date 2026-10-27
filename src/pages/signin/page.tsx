import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Input, Label } from "@/components/base/ui";
import AuthShell from "@/components/feature/AuthShell";
import VerifyCodeForm from "@/components/feature/VerifyCodeForm";
import { Toaster } from "@/components/feature/Toaster";
import { authCallbackUrl, describeAuthError, validateOrdinaryPostAuthNext } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/AuthProvider";

export default function SignInPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { session, profile, loading, signOut } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const destination = validateOrdinaryPostAuthNext(params.get("next"));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        if (signInError.message.toLowerCase().includes("email not confirmed")) {
          setConfirming(true);
          setError(describeAuthError(signInError.message));
          return;
        }
        setError(describeAuthError(signInError.message));
        return;
      }

      navigate(destination, { replace: true });
    } catch (err) {
      setError(describeAuthError(err instanceof Error ? err.message : "Could not sign you in."));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setError(null);
    try {
      const suffix = destination !== "/account" ? `?next=${encodeURIComponent(destination)}` : "";
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${authCallbackUrl}${suffix}` },
      });
      if (oauthError) setError(describeAuthError(oauthError.message));
    } catch (err) {
      setError(describeAuthError(err instanceof Error ? err.message : "Google sign-in is unavailable."));
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

  if (session) {
    return (
      <AuthShell
        eyebrow="Already signed in"
        title={`Hi ${profile?.full_name?.split(" ")[0] ?? "again"}`}
        subtitle="This device already has an active session for your account."
      >
        <div className="space-y-3">
          <div className="rounded-md border border-background-200 bg-background-100 p-3">
            <p className="text-xs font-semibold text-foreground-950">{profile?.full_name ?? "Dala account"}</p>
            <p className="mt-0.5 text-[11px] text-foreground-600">{session.user.email}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-foreground-500">
              Role · {profile?.role ?? "member"}
            </p>
          </div>
          <Button block size="lg" onClick={() => navigate(destination, { replace: true })}>
            Continue to my account
          </Button>
          <Button
            block
            variant="outline"
            onClick={async () => {
              await signOut();
            }}
          >
            <i className="ri-logout-box-r-line" /> Sign out of this device
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <>
      <AuthShell
        eyebrow="Welcome back"
        title={confirming ? "Confirm your email" : "Sign in"}
        subtitle={
          confirming
            ? "Your email is not confirmed yet. Verify the code we sent to finish signing in."
            : "Reach your tickets, saved events and organizer tools in seconds."
        }
      >
        {confirming ? (
          <VerifyCodeForm
            email={email.trim()}
            type="signup"
            hint="Your account becomes active the moment it is verified."
            onBack={() => {
              setConfirming(false);
              setError(null);
            }}
            onVerified={() => navigate(destination, { replace: true })}
          />
        ) : (
          <>
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
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="mb-1.5 cursor-pointer text-[11px] font-semibold text-foreground-600 hover:text-foreground-950"
                  >
                    Forgot?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="rounded-md border border-accent-200 bg-accent-50 px-3 py-2 text-[11px] leading-relaxed text-accent-900">
                  {error}
                </p>
              )}

              <Button block size="lg" type="submit" disabled={busy}>
                {busy ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-login-box-line" />}
                {busy ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-background-200" />
              <span className="text-[10px] uppercase tracking-wider text-foreground-400">or</span>
              <span className="h-px flex-1 bg-background-200" />
            </div>

            <Button variant="outline" block onClick={google} disabled={busy}>
              <i className="ri-google-fill" /> Continue with Google
            </Button>

            <p className="mt-4 text-[11px] text-foreground-600">
              New to Dala Tickets?{" "}
              <Link to="/signup" className="cursor-pointer font-semibold text-foreground-950 underline">
                Create an account
              </Link>
            </p>

            <p className="mt-2 text-[11px] text-foreground-600">
              Working the gate?{" "}
              <Link to="/gate-login" className="cursor-pointer font-semibold text-foreground-950 underline">
                Staff scanner sign in
              </Link>
            </p>
          </>
        )}
      </AuthShell>
      <Toaster />
    </>
  );
}
