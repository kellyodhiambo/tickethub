import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";
import { Link, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/feature/Toaster";
import { cn } from "@/lib/helpers";
import { loadScanSession, scanTicket, type ScanSession } from "@/lib/staffApi";
import { useAuth } from "@/store/AuthProvider";

type ScanResult = {
  result: "valid" | "duplicate" | "invalid" | "pending";
  code: string;
  attendee?: string | null;
  tier?: string | null;
  reason?: string;
  at: string;
};

/**
 * The gate scanner is an always-dark kiosk surface.
 * It deliberately uses fixed black / white tones (with luminance + icon
 * differences) instead of theme tokens, so it never inverts mid-event.
 */
const resultStyle: Record<
  string,
  { panel: string; iconPanel: string; icon: string; label: string; title: string; body: string }
> = {
  valid: {
    panel: "bg-white text-black",
    iconPanel: "bg-white text-black",
    icon: "ri-checkbox-circle-fill",
    label: "Entry approved",
    title: "Entry approved",
    body: "Valid ticket — this guest may enter.",
  },
  duplicate: {
    panel: "bg-white text-black",
    iconPanel: "bg-neutral-700 text-white",
    icon: "ri-error-warning-fill",
    label: "Already scanned",
    title: "Already scanned",
    body: "This ticket has already been used. Do not admit.",
  },
  invalid: {
    panel: "bg-white text-black",
    iconPanel: "bg-black text-white",
    icon: "ri-close-circle-fill",
    label: "Invalid ticket",
    title: "Invalid ticket",
    body: "Code not found or not valid for this gate. Escalate to a supervisor.",
  },
  pending: {
    panel: "bg-white text-black",
    iconPanel: "bg-neutral-400 text-black",
    icon: "ri-time-fill",
    label: "Pending verification",
    title: "Pending verification",
    body: "Network unavailable. Queued for sync when you reconnect.",
  },
};

function nowStamp() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

export default function ScannerPage() {
  const navigate = useNavigate();
  const { session: authSession, profile, loading: authLoading, signOut } = useAuth();

  const [session, setSession] = useState<ScanSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);

  const [gate, setGate] = useState("Gate A — Main");
  const [manual, setManual] = useState("");
  const [online, setOnline] = useState(true);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [recent, setRecent] = useState<{ code: string | null; attendee: string | null; gate: string | null; at: string | null; result: string }[]>([]);
  const [summary, setSummary] = useState({ issued: 0, scanned: 0, remaining: 0 });
  const [busy, setBusy] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const cameraResultHandledRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBlocked(null);
    try {
      const response = await loadScanSession();
      if (response.error) {
        setBlocked(response.error);
        setSession(null);
        return;
      }
      const data = response.data;
      setSession(data);
      if (data?.staff?.gate) setGate(data.staff.gate);
      if (data?.summary) setSummary(data.summary);
      if (data?.recent) {
        setRecent(
          data.recent.map((item) => ({
            code: item.code,
            attendee: item.attendee,
            gate: item.gate,
            at: item.at,
            result: "valid",
          }))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your scanning session.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!authSession) {
      setLoading(false);
      setBlocked("Sign in with the phone number and password your organizer gave you.");
      return;
    }
    void load();
  }, [authLoading, authSession, load]);

  const runScan = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setResult({ result: "invalid", code: "—", reason: "No ticket code was read.", at: nowStamp() });
      return;
    }

    if (!online) {
      setResult({ result: "pending", code: trimmed.toUpperCase(), at: nowStamp() });
      setManual("");
      return;
    }

    setBusy(true);
    try {
      const response = await scanTicket(trimmed, gate);
      if (response.error) {
        setResult({ result: "invalid", code: trimmed.toUpperCase(), reason: response.error, at: nowStamp() });
        return;
      }
      const outcome = response.data;
      if (!outcome) {
        setResult({ result: "invalid", code: trimmed.toUpperCase(), reason: "No response from the gate server.", at: nowStamp() });
        return;
      }

      const stamp = outcome.at ? outcome.at.slice(0, 16).replace("T", " ") : nowStamp();
      setResult({
        result: outcome.result,
        code: outcome.code || trimmed.toUpperCase(),
        attendee: outcome.attendee,
        tier: outcome.tier,
        reason: outcome.reason,
        at: stamp,
      });

      if (outcome.result === "valid") {
        setSummary((current) => ({
          ...current,
          scanned: current.scanned + 1,
          remaining: Math.max(0, current.remaining - 1),
        }));
      }

      setRecent((current) =>
        [
          {
            code: outcome.code || trimmed.toUpperCase(),
            attendee: outcome.attendee ?? null,
            gate: outcome.gate ?? gate,
            at: stamp,
            result: outcome.result,
          },
          ...current,
        ].slice(0, 8)
      );
      setManual("");
    } catch (err) {
      setResult({
        result: "invalid",
        code: trimmed.toUpperCase(),
        reason: err instanceof Error ? err.message : "Scan failed.",
        at: nowStamp(),
      });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!cameraActive || !online || !session || !videoRef.current) return;
    let active = true;
    cameraResultHandledRef.current = false;
    setCameraError(null);
    const video = videoRef.current;
    void import("@zxing/browser").then(({ BrowserMultiFormatReader }) => {
      if (!active || !video) return;
      const reader = new BrowserMultiFormatReader();
      return reader.decodeFromVideoDevice(undefined, video, (decoded, _error, controls) => {
        scannerControlsRef.current = controls;
        if (!active || !decoded || busy || cameraResultHandledRef.current) return;
        cameraResultHandledRef.current = true;
        setCameraActive(false);
        void runScan(decoded.getText());
      });
    }).catch((cameraFailure: unknown) => {
      if (!active) return;
      setCameraActive(false);
      setCameraError(cameraFailure instanceof Error
        ? `Camera could not start: ${cameraFailure.message}`
        : "Camera access failed. Allow camera access or enter the ticket code manually.");
    });

    return () => {
      active = false;
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = null;
    };
    }, [cameraActive, online, session, busy]);

  const style = result ? resultStyle[result.result] : null;
  const staffName = session?.staff?.name ?? profile?.full_name ?? "Gate staff";
  const roleLabel = session?.preview ? "organizer preview" : "scanner only";
  const eventTitle = session?.event?.title ?? "No event assigned";

  const headerBack = useMemo(() => (session?.preview ? "/organizer" : "/"), [session]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <i className="ri-loader-4-line animate-spin text-2xl" />
          <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/60">Opening scanner</p>
        </div>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="w-full max-w-sm rounded-card border border-white/15 bg-white/[0.05] p-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10">
            <i className="ri-lock-2-line text-xl" />
          </span>
          <p className="mt-3 text-base font-bold">Scanner access required</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-white/60">{blocked}</p>
          <div className="mt-4 space-y-2">
            <Link
              to="/gate-login"
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-btn bg-white text-xs font-bold uppercase tracking-[0.08em] text-black hover:bg-white/85"
            >
              <i className="ri-qr-scan-2-line" /> Staff sign in
            </Link>
            {authSession && (
              <button
                onClick={async () => {
                  await signOut();
                  navigate("/gate-login", { replace: true });
                }}
                className="h-10 w-full cursor-pointer rounded-btn border border-white/25 text-[11px] font-bold uppercase tracking-[0.08em] text-white/75 hover:bg-white/10"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/95 backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Link
            to={headerBack}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-white/20 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Exit scanner"
          >
            <i className="ri-arrow-left-line" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold uppercase tracking-[0.14em]">Dala Gate Scanner</p>
            <p className="truncate text-[10px] text-white/45">
              {staffName} · {roleLabel}
            </p>
          </div>
          <button
            onClick={() => setOnline((value) => !value)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors",
              online ? "border-white/25 bg-white text-black" : "border-white/30 bg-transparent text-white/70"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                online ? "bg-black" : "animate-pulse border border-white/70 bg-transparent"
              )}
            />
            {online ? "Online" : "Offline"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 px-3 pb-2.5">
          <div className="flex h-9 min-w-0 items-center rounded-md border border-white/20 bg-white/5 px-2">
            <span className="truncate text-[11px] text-white/80">{eventTitle}</span>
          </div>
          <select
            value={gate}
            onChange={(event_) => setGate(event_.target.value)}
            disabled={Boolean(session?.staff && !session.preview)}
            className="h-9 cursor-pointer rounded-md border border-white/20 bg-white/5 px-2 text-[11px] text-white outline-none disabled:cursor-not-allowed disabled:opacity-70"
          >
            <option className="bg-neutral-900 text-white">Gate A — Main</option>
            <option className="bg-neutral-900 text-white">Gate B — Main</option>
            <option className="bg-neutral-900 text-white">VIP Entrance</option>
            <option className="bg-neutral-900 text-white">Gate C — Staff</option>
            <option className="bg-neutral-900 text-white">Gate D — Overflow</option>
          </select>
        </div>
      </header>

      <main className="flex-1 px-3 pb-6 pt-3">
        <div className="mx-auto w-full max-w-md">
          {error && (
            <div className="mb-3 rounded-md border border-white/25 bg-white/[0.06] p-3">
              <p className="text-[11px] text-white/80">{error}</p>
              <button onClick={() => void load()} className="mt-2 cursor-pointer text-[10px] font-bold uppercase tracking-[0.1em] text-white underline">
                Retry
              </button>
            </div>
          )}

          {!result ? (
            <>
              <div className="relative overflow-hidden rounded-card border border-white/15 bg-white/[0.04] p-3">
                <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-black ring-1 ring-inset ring-white/10">
                  <video ref={videoRef} className={cn("absolute inset-0 h-full w-full object-cover", cameraActive ? "block" : "hidden")} autoPlay muted playsInline />
                  <div className="absolute inset-8 rounded-md border border-white/10" />
                  <div className="absolute left-6 top-6 h-10 w-10 rounded-tl-lg border-l-2 border-t-2 border-white" />
                  <div className="absolute right-6 top-6 h-10 w-10 rounded-tr-lg border-r-2 border-t-2 border-white" />
                  <div className="absolute bottom-6 left-6 h-10 w-10 rounded-bl-lg border-b-2 border-l-2 border-white" />
                  <div className="absolute bottom-6 right-6 h-10 w-10 rounded-br-lg border-b-2 border-r-2 border-white" />
                  <div className="absolute inset-x-10 h-0.5 animate-pulse bg-white/70" style={{ top: "50%" }} />
                  {!cameraActive && <div className="px-8 text-center">
                    <i className="ri-qr-scan-2-line text-3xl text-white/70" />
                    <p className="mt-2 text-[11px] font-semibold text-white">
                      Camera scanner is ready
                    </p>
                    <p className="mt-1 text-[10px] leading-relaxed text-white/40">
                      Aim the rear camera at a Dala Tickets QR code, or enter its ticket code manually.
                    </p>
                  </div>}
                  {cameraActive && <div className="pointer-events-none absolute inset-8 rounded-md border-2 border-white/75" />}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setCameraActive(false);
                      document.getElementById("manual-code")?.focus();
                    }}
                    className="h-10 cursor-pointer whitespace-nowrap rounded-btn bg-white text-[11px] font-bold uppercase tracking-[0.08em] text-black transition-colors hover:bg-white/85"
                  >
                    <i className="ri-keyboard-line mr-1" /> Type code
                  </button>
                  <button
                    onClick={() => {
                      if (!online) {
                        setCameraError("Reconnect before scanning tickets.");
                        return;
                      }
                      setCameraError(null);
                      setCameraActive((value) => !value);
                    }}
                    className="h-10 cursor-pointer whitespace-nowrap rounded-btn border border-white/25 text-[11px] font-bold uppercase tracking-[0.08em] text-white/80 transition-colors hover:bg-white/10"
                  >
                    <i className={cn("mr-1", cameraActive ? "ri-stop-circle-line" : "ri-camera-line")} /> {cameraActive ? "Stop camera" : "Camera"}
                  </button>
                </div>
                {cameraError && <p className="mt-2 rounded-md border border-white/20 bg-white/10 px-2.5 py-2 text-[10px] text-white/80">{cameraError}</p>}
              </div>

              <div className="mt-3 rounded-card border border-white/15 bg-white/[0.04] p-3">
                <p className="text-[10px] font-label font-bold uppercase tracking-[0.18em] text-white/40">
                  Manual code entry
                </p>
                <div className="mt-2 flex gap-2">
                  <input
                    id="manual-code"
                    value={manual}
                    onChange={(event_) => setManual(event_.target.value)}
                    onKeyDown={(event_) => {
                      if (event_.key === "Enter") void runScan(manual);
                    }}
                    placeholder="DLA-8F42KD-VIP-01"
                    className="h-11 min-w-0 flex-1 rounded-md border border-white/20 bg-black px-3 text-sm uppercase text-white outline-none placeholder:text-white/30 focus:border-white/60"
                  />
                  <button
                    onClick={() => void runScan(manual)}
                    disabled={busy}
                    className="h-11 flex-none cursor-pointer whitespace-nowrap rounded-btn bg-white px-4 text-xs font-bold uppercase tracking-[0.08em] text-black hover:bg-white/85 disabled:opacity-40"
                  >
                    {busy ? <i className="ri-loader-4-line animate-spin" /> : "Check"}
                  </button>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-white/40">
                  Codes are validated against live ticket records for {session?.event?.title ?? "your event"}.
                </p>
              </div>
            </>
          ) : (
            <div className="animate-pop-in overflow-hidden rounded-card bg-white ring-1 ring-white/40">
              <div className={cn("px-4 py-6 text-center", style?.iconPanel)}>
                <i className={cn(style?.icon, "text-5xl")} />
                <p className="mt-2 text-[10px] font-label font-bold uppercase tracking-[0.3em] opacity-60">
                  {style?.label}
                </p>
                <p className="mt-1 text-xl font-extrabold uppercase tracking-[0.02em]">{style?.title}</p>
                <p className="mt-1.5 text-[11px] opacity-70">{result.reason ?? style?.body}</p>
              </div>
              <div className="border-t border-black/10 bg-white p-4 text-black">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between border-b border-black/10 pb-1.5">
                    <span className="text-black/45">Ticket</span>
                    <span className="font-num font-semibold">{result.code}</span>
                  </div>
                  {result.attendee && (
                    <div className="flex justify-between border-b border-black/10 pb-1.5">
                      <span className="text-black/45">Attendee</span>
                      <span className="font-semibold">{result.attendee}</span>
                    </div>
                  )}
                  {result.tier && (
                    <div className="flex justify-between border-b border-black/10 pb-1.5">
                      <span className="text-black/45">Category</span>
                      <span className="font-semibold">{result.tier}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-black/10 pb-1.5">
                    <span className="text-black/45">Event</span>
                    <span className="max-w-[60%] truncate text-right font-semibold">{eventTitle}</span>
                  </div>
                  <div className="flex justify-between border-b border-black/10 pb-1.5">
                    <span className="text-black/45">Gate</span>
                    <span className="font-semibold">{gate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/45">Time</span>
                    <span className="font-num font-semibold">{result.at}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setResult(null);
                    setManual("");
                  }}
                  className="mt-3 h-12 w-full cursor-pointer whitespace-nowrap rounded-btn bg-black text-sm font-bold uppercase tracking-[0.1em] text-white hover:bg-neutral-900"
                >
                  Next scan
                </button>
                {result.result === "duplicate" && (
                  <p className="mt-2 text-center text-[10px] leading-relaxed text-black/50">
                    Show the original scan details to the guest and direct them to the supervisor desk.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "Scanned", value: String(summary.scanned) },
              { label: "Valid left", value: String(summary.remaining) },
              { label: "Issued", value: String(summary.issued) },
            ].map((item) => (
              <div key={item.label} className="rounded-md border border-white/15 bg-white/[0.04] p-2 text-center">
                <p className="font-num text-base font-bold text-white">{item.value}</p>
                <p className="text-[9px] uppercase tracking-[0.12em] text-white/40">{item.label}</p>
              </div>
            ))}
          </div>

          {!online && (
            <div className="mt-3 rounded-md border border-white/25 bg-white/[0.06] p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white">
                <i className="ri-plug-line" /> Offline mode active
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-white/55">
                Scans are queued locally and stay pending until reconnected. Separate offline devices
                cannot guarantee global duplicate prevention while disconnected.
              </p>
            </div>
          )}

          <div className="mt-3 rounded-card border border-white/15 bg-white/[0.04] p-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-label font-bold uppercase tracking-[0.18em] text-white/40">
                Recent scans
              </p>
              <span className="rounded-full border border-white/25 px-2 py-0.5 font-num text-[10px] text-white/70">
                {recent.length}
              </span>
            </div>
            <div className="mt-2 space-y-1.5">
              {recent.length === 0 && (
                <p className="rounded-md bg-white/[0.05] px-2 py-2 text-[10px] text-white/40">
                  No scans recorded yet for this event.
                </p>
              )}
              {recent.map((scan, index) => (
                <div key={`${scan.code}-${index}`} className="flex items-center gap-2 rounded-md bg-white/[0.05] px-2 py-1.5">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 flex-none rounded-full",
                      scan.result === "valid"
                        ? "bg-white"
                        : scan.result === "duplicate"
                          ? "bg-white/60"
                          : scan.result === "pending"
                            ? "bg-white/40"
                            : "bg-white/25"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-num text-[10px] text-white/90">{scan.code ?? "—"}</p>
                    <p className="truncate text-[9px] text-white/40">
                      {scan.attendee ? `${scan.attendee} · ` : ""}
                      {scan.gate ?? gate}
                    </p>
                  </div>
                  <span className="flex-none text-[9px] uppercase tracking-[0.1em] text-white/55">
                    {scan.result}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={async () => {
              await signOut();
              navigate("/gate-login", { replace: true });
            }}
            className="mt-3 h-10 w-full cursor-pointer rounded-btn border border-white/20 text-[10px] font-bold uppercase tracking-[0.12em] text-white/55 hover:bg-white/10 hover:text-white"
          >
            Sign out of scanner
          </button>

          <p className="mt-3 text-center text-[10px] leading-relaxed text-white/35">
            Duplicate scans are rejected server-side. Wristbands and re-entry rules are configured per
            event by the organizer.
          </p>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
