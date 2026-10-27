import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Label } from "@/components/base/ui";
import AuthShell from "@/components/feature/AuthShell";
import { Toaster } from "@/components/feature/Toaster";
import { describeAuthError } from "@/lib/auth";
import { staffLoginEmail } from "@/lib/staffApi";
import { supabase } from "@/lib/supabase";

/**
 * Gate staff do not use email. The organizer hands them a phone number and a
 * password, and this screen turns that phone number into their staff login.
 */
export default function GateLoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const digits = phone.replace(/[^\d]/g, "");
    if (digits.length < 9 || !password) {
      setError("Enter the phone number and password your organizer gave you.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: staffLoginEmail(phone),
        password,
      });

      if (signInError) {
        const message = signInError.message.toLowerCase();
        if (message.includes("banned")) {
          setError("Your scanner access has been revoked. Speak to the event organizer.");
        } else if (message.includes("invalid login credentials")) {
          setError("Those details do not match a staff account. Check the phone number and password.");
        } else {
          setError(describeAuthError(signInError.message));
        }
        return;
      }

      navigate("/scanner", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign you in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AuthShell
        eyebrow="Gate staff"
        title="Scanner sign in"
        subtitle="Use the phone number and password your organizer issued to you. No email needed."
      >
        <form onSubmit={submit} className="space-y-3" noValidate>
          <div>
            <Label htmlFor="staff-phone">Phone number</Label>
            <Input
              id="staff-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+254 712 345 678"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="staff-password">Password</Label>
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="mb-1.5 cursor-pointer text-[11px] font-semibold text-foreground-600 hover:text-foreground-950"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <Input
              id="staff-password"
              name="password"
              type={showPassword ? "text" : "password"}
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
            {busy ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-qr-scan-2-line" />}
            {busy ? "Opening scanner…" : "Open scanner"}
          </Button>
        </form>

        <div className="mt-4 space-y-1.5 rounded-md border border-background-200 bg-background-100 p-3">
          <p className="text-[11px] font-semibold text-foreground-900">Issued by your organizer</p>
          <p className="text-[11px] leading-relaxed text-foreground-600">
            Scanner accounts can only validate tickets at the gate. They cannot see sales, payouts or
            attendee lists, and access can be revoked at any time.
          </p>
        </div>

        <p className="mt-4 text-[11px] text-foreground-600">
          Looking for your tickets?{" "}
          <Link to="/signin" className="cursor-pointer font-semibold text-foreground-950 underline">
            Sign in with email
          </Link>
        </p>
      </AuthShell>
      <Toaster />
    </>
  );
}