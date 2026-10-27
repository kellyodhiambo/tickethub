import { supabase } from "@/lib/supabase";

/**
 * Gate staff sign in with a phone number, but Supabase auth is email based.
 * The organizer's invitation creates an account on a reserved staff domain,
 * so the phone number itself becomes the login identifier.
 */
export const STAFF_LOGIN_DOMAIN = "staff.dalalive.app";

export function normalizePhone(value: string): string {
  return value.replace(/[^\d]/g, "");
}

export function staffLoginEmail(phone: string): string {
  return `${normalizePhone(phone)}@${STAFF_LOGIN_DOMAIN}`;
}

export type GateStaffRow = {
  id: string;
  full_name: string;
  phone: string;
  gate: string;
  role: string;
  status: "Active" | "Revoked" | string;
  scans: number;
  event_id: string | null;
  invited_at: string;
  last_scan_at: string | null;
};

type InvokeResult<T> = { data: T | null; error: string | null };

async function invoke<T>(slug: string, body: Record<string, unknown>): Promise<InvokeResult<T>> {
  const { data, error } = await supabase.functions.invoke(slug, { body });

  if (error) {
    let message = error.message;
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === "function") {
      try {
        const parsed = await context.json();
        if (parsed && typeof parsed.error === "string") message = parsed.error;
      } catch {
        // keep the original message
      }
    }
    return { data: null, error: message };
  }

  if (data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string") {
    return { data: null, error: (data as { error: string }).error };
  }

  return { data: (data ?? null) as T | null, error: null };
}

export type InvitePayload = {
  fullName: string;
  phone: string;
  password: string;
  gate: string;
  eventId: string | null;
};

export type InviteCredentials = {
  staff: GateStaffRow;
  credentials: { phone: string; loginEmail: string; gate: string };
};

export async function listGateStaff() {
  return invoke<{ staff: GateStaffRow[] }>("gate-staff", { action: "list" });
}

export async function inviteGateStaff(payload: InvitePayload) {
  return invoke<InviteCredentials>("gate-staff", { action: "invite", ...payload });
}

export async function revokeGateStaff(staffId: string) {
  return invoke<{ ok: boolean; status: string }>("gate-staff", { action: "revoke", staffId });
}

export async function restoreGateStaff(staffId: string) {
  return invoke<{ ok: boolean; status: string }>("gate-staff", { action: "restore", staffId });
}

export async function resetStaffPassword(staffId: string, password: string) {
  return invoke<{ ok: boolean }>("gate-staff", { action: "reset_password", staffId, password });
}

export type ScanSession = {
  preview: boolean;
  staff: { id: string; name: string; gate: string; role: string; scans: number } | null;
  event: { id: string; title: string; slug: string; start_date: string | null; venue: string | null } | null;
  summary: { issued: number; scanned: number; remaining: number };
  recent: { code: string | null; attendee: string | null; tier: string | null; gate: string | null; at: string | null }[];
};

export async function loadScanSession() {
  return invoke<ScanSession>("gate-scan", { action: "session" });
}

export type ScanOutcome = {
  result: "valid" | "duplicate" | "invalid";
  code: string;
  reason?: string;
  attendee?: string | null;
  tier?: string | null;
  gate?: string | null;
  at?: string | null;
};

export async function scanTicket(qrCode: string, gate: string) {
  return invoke<ScanOutcome>("gate-scan", { action: "scan", qrCode, gate });
}