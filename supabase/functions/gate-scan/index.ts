import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const USED_STATUSES = ["used", "scanned", "checked_in", "checked-in", "admitted"];
const DEAD_STATUSES = ["cancelled", "canceled", "refunded", "invalid", "void"];

function isUsed(status: string | null, scannedAt: string | null) {
  if (scannedAt) return true;
  return Boolean(status && USED_STATUSES.includes(status.toLowerCase()));
}

function isDead(status: string | null) {
  return Boolean(status && DEAD_STATUSES.includes(status.toLowerCase()));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Sign in to scan." }, 401);

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user: caller },
    error: callerError,
  } = await authClient.auth.getUser();
  if (callerError || !caller) return json({ error: "Your session expired. Sign in again." }, 401);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const action = String(body.action ?? "scan");

  // Resolve the scanning identity: a gate staff row, or an organizer previewing.
  const { data: staff, error: staffError } = await admin
    .from("gate_staff")
    .select("id, organizer_id, event_id, full_name, gate, role, status, scans")
    .eq("user_id", caller.id)
    .maybeSingle();

  if (staffError) return json({ error: staffError.message }, 500);

  const { data: profile } = await admin
    .from("users")
    .select("id, full_name, role, verified")
    .eq("id", caller.id)
    .maybeSingle();

  const role = profile?.role ?? "";
  const isOrganizerPreview = !staff && (role === "admin" || (["organizer", "creator"].includes(role) && profile?.verified === true));

  if (staff && staff.status !== "Active") {
    return json({ error: "Your scanner access has been revoked. Contact the organizer." }, 403);
  }
  if (!staff && !isOrganizerPreview) {
    return json({ error: "This account is not assigned to gate scanning." }, 403);
  }

  const organizerId = staff?.organizer_id ?? caller.id;
  const staffEventId = staff?.event_id ?? null;

  async function loadSession() {
    let eventId = staffEventId;
    let event: { id: string; title: string; slug: string; start_date: string | null; venue: string | null } | null = null;

    if (!eventId) {
      const { data: nextEvent } = await admin
        .from("events")
        .select("id, title, slug, start_date, venue, tickets_sold")
        .eq("organizer_id", organizerId)
        .in("status", ["upcoming", "ongoing"])
        .order("tickets_sold", { ascending: false })
        .order("start_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      event = nextEvent ?? null;
      eventId = nextEvent?.id ?? null;
    } else {
      const { data: assigned } = await admin
        .from("events")
        .select("id, title, slug, start_date, venue")
        .eq("id", eventId)
        .maybeSingle();
      event = assigned ?? null;
    }

    if (!eventId) {
      return {
        staff: staff
          ? { id: staff.id, name: staff.full_name, gate: staff.gate, role: staff.role, scans: staff.scans }
          : null,
        event: null,
        summary: { issued: 0, scanned: 0, remaining: 0 },
        recent: [],
      };
    }

    const { data: rows } = await admin
      .from("tickets")
      .select("qr_code, attendee, buyer_name, ticket_name, tier_name, status, payment_status, scanned_at, gate")
      .eq("event_id", eventId)
      .order("scanned_at", { ascending: false, nullsFirst: false })
      .limit(500);

    const tickets = (rows ?? []).filter((row) => ["completed", "paid"].includes(String(row.payment_status ?? "").toLowerCase()));
    const scanned = tickets.filter((row) => isUsed(row.status, row.scanned_at));
    return {
      staff: staff
        ? { id: staff.id, name: staff.full_name, gate: staff.gate, role: staff.role, scans: staff.scans }
        : { id: "preview", name: profile?.full_name ?? "Organizer", gate: "Gate A — Main", role: "Organizer view", scans: 0 },
      event,
      summary: { issued: tickets.length, scanned: scanned.length, remaining: tickets.length - scanned.length },
      recent: scanned.slice(0, 8).map((row) => ({
        code: row.qr_code,
        attendee: row.attendee ?? row.buyer_name ?? null,
        tier: row.ticket_name ?? row.tier_name ?? null,
        gate: row.gate ?? null,
        at: row.scanned_at,
      })),
    };
  }

  if (action === "session") {
    const payload = await loadSession();
    return json({ ...payload, preview: isOrganizerPreview });
  }

  if (action !== "scan") return json({ error: "Unknown action." }, 400);

  const code = String(body.qrCode ?? "").trim();
  const gate = String(body.gate ?? staff?.gate ?? "Gate A — Main").trim();
  if (!code) {
    return json({ result: "invalid", reason: "No ticket code was read.", code: "" });
  }

  const { data: ticket, error: ticketError } = await admin
    .from("tickets")
    .select("id, event_id, qr_code, status, payment_status, scanned_at, gate, attendee, buyer_name, ticket_name, tier_name, events!inner(organizer_id)")
    .eq("qr_code", code)
    .maybeSingle();

  if (ticketError) return json({ error: ticketError.message }, 500);

  if (!ticket) {
    return json({
      result: "invalid",
      code,
      reason: "No ticket with that code exists.",
    });
  }

  const expectedEventId = staffEventId;
  if (expectedEventId && ticket.event_id !== expectedEventId) {
    return json({
      result: "invalid",
      code: ticket.qr_code ?? code,
      reason: "This ticket belongs to a different event.",
      attendee: ticket.attendee ?? ticket.buyer_name ?? null,
      tier: ticket.ticket_name ?? ticket.tier_name ?? null,
    });
  }

  const ticketEvent = Array.isArray(ticket.events) ? ticket.events[0] : ticket.events;
  if (role !== "admin" && ticketEvent?.organizer_id !== organizerId) {
    return json({ result: "invalid", code: ticket.qr_code ?? code, reason: "This ticket belongs to another organizer." });
  }

  if (!["completed", "paid"].includes(String(ticket.payment_status ?? "").toLowerCase())) {
    return json({ result: "invalid", code: ticket.qr_code ?? code, reason: "Payment has not been confirmed for this ticket." });
  }

  const attendee = ticket.attendee ?? ticket.buyer_name ?? null;
  const tier = ticket.ticket_name ?? ticket.tier_name ?? null;

  if (isUsed(ticket.status, ticket.scanned_at)) {
    return json({
      result: "duplicate",
      code: ticket.qr_code ?? code,
      reason: "This ticket was already scanned.",
      attendee,
      tier,
      gate: ticket.gate,
      at: ticket.scanned_at,
    });
  }

  if (isDead(ticket.status)) {
    return json({
      result: "invalid",
      code: ticket.qr_code ?? code,
      reason: "This ticket was cancelled or refunded.",
      attendee,
      tier,
    });
  }

  // Atomic lock: only the first scan that sees scanned_at = null wins.
  const scannedAt = new Date().toISOString();
  const { data: locked, error: lockError } = await admin
    .from("tickets")
    .update({ status: "used", scanned_at: scannedAt, gate })
    .eq("id", ticket.id)
    .in("payment_status", ["completed", "paid"])
    .is("scanned_at", null)
    .select("id")
    .maybeSingle();

  if (lockError) return json({ error: lockError.message }, 500);

  if (!locked) {
    const { data: fresh } = await admin
      .from("tickets")
      .select("scanned_at, gate")
      .eq("id", ticket.id)
      .maybeSingle();
    return json({
      result: "duplicate",
      code: ticket.qr_code ?? code,
      reason: "This ticket was scanned a moment ago on another device.",
      attendee,
      tier,
      gate: fresh?.gate ?? null,
      at: fresh?.scanned_at ?? null,
    });
  }

  if (staff) {
    await admin
      .from("gate_staff")
      .update({ scans: staff.scans + 1, last_scan_at: scannedAt })
      .eq("id", staff.id);
  }

  return json({
    result: "valid",
    code: ticket.qr_code ?? code,
    attendee,
    tier,
    gate,
    at: scannedAt,
  });
});
