import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/base/ui";
import { BrandMark } from "@/components/feature/PublicLayout";
import { OAUTH_NEXT_STORAGE_KEY, validateOrdinaryPostAuthNext } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      const code = params.get("code");
      let storedNext: string | null = null;
      try {
        storedNext = window.sessionStorage.getItem(OAUTH_NEXT_STORAGE_KEY);
        window.sessionStorage.removeItem(OAUTH_NEXT_STORAGE_KEY);
      } catch {
        // The callback query can still supply a safe next path.
      }
      const next = params.get("next") ?? storedNext;

      try {
        if (!code) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            navigate(validateOrdinaryPostAuthNext(next), { replace: true });
            return;
          }
          setError("This link is missing its verification code. Request a new email and try again.");
          return;
        }

        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }

        const redirectType = (data as { redirectType?: string } | null)?.redirectType;
        if (redirectType === "recovery") {
          navigate("/auth/reset-password", { replace: true });
          return;
        }

        navigate(validateOrdinaryPostAuthNext(next), { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "We could not complete that sign-in link.");
      }
    };

    void run();
  }, [navigate, params]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center">
          <BrandMark />
        </div>

        {error ? (
          <div className="mt-8 rounded-card border border-background-200 bg-background-100 p-5">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent-100 text-accent-800">
              <i className="ri-error-warning-line text-lg" />
            </span>
            <h1 className="mt-3 text-base font-bold text-foreground-950">Link could not be used</h1>
            <p className="mt-1 text-xs leading-relaxed text-foreground-600">{error}</p>
            <div className="mt-4 flex flex-col gap-2">
              <Button onClick={() => navigate("/signin", { replace: true })}>Back to sign in</Button>
              <Button variant="outline" onClick={() => navigate("/forgot-password", { replace: true })}>
                Send a new code
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-card border border-background-200 bg-background-50 p-6">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-background-100">
              <i className="ri-loader-4-line animate-spin text-lg text-foreground-800" />
            </span>
            <h1 className="mt-3 text-base font-bold text-foreground-950">Signing you in</h1>
            <p className="mt-1 text-xs leading-relaxed text-foreground-600">
              Verifying your secure link. This usually takes a second.
            </p>
          </div>
        )}

        <p className="mt-4 text-[10px] text-foreground-500">
          Trouble? <Link to="/organizer/support" className="cursor-pointer underline">Contact support</Link>
        </p>
      </div>
    </div>
  );
}
