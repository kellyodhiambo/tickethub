import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STAFF_DOMAIN = "staff.dalalive.app";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhone(input: unknown): string {
  return String(input ?? "").replace(/[^\d]/g, "");
}

function loginEmailFor(phoneDigits: string): string {
  return `${phoneDigits}@${STAFF_DOMAIN}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Sign in to manage gate staff." }, 401);

  // Anon client is used ONLY to resolve the caller's identity.
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user: caller },
    error: callerError,
  } = await authClient.auth.getUser();

  if (callerError || !caller) return json({ error: "Your session expired. Sign in again." }, 401);

  // Service role client is used for privileged reads and writes only.
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const action = String(body.action ?? "");

  const { data: callerProfile, error: callerProfileError } = await admin
    .from("users")
    .select("id, role, verified")
    .eq("id", caller.id)
    .maybeSingle();

  if (callerProfileError) return json({ error: callerProfileError.message }, 500);

  const callerRole = callerProfile?.role ?? "";
  const canManage = callerRole === "admin" || (["organizer", "creator"].includes(callerRole) && callerProfile?.verified === true);
  if (!canManage) return json({ error: "Only verified organizers can manage gate staff." }, 403);

  if (action === "invite") {
    const fullName = String(body.fullName ?? "").trim();
    const phone = normalizePhone(body.phone);
    const password = String(body.password ?? "");
    const gate = String(body.gate ?? "Gate A — Main").trim() || "Gate A — Main";
    const role = "Scanner";
    const eventId = body.eventId ? String(body.eventId) : null;

    if (!fullName) return json({ error: "Add the staff member's full name." }, 400);
    if (phone.length < 9) return json({ error: "Enter a valid phone number with the country code." }, 400);
    if (password.length < 8) return json({ error: "Give them a password with at least 8 characters." }, 400);

    if (eventId && callerRole !== "admin") {
      const { data: ownedEvent, error: eventError } = await admin
        .from("events")
        .select("id")
        .eq("id", eventId)
        .eq("organizer_id", caller.id)
        .maybeSingle();
      if (eventError) return json({ error: eventError.message }, 500);
      if (!ownedEvent) return json({ error: "You can only assign gate staff to your own events." }, 403);
    }

    const loginEmail = loginEmailFor(phone);

    const { data: existing, error: existingError } = await admin
      .from("gate_staff")
      .select("id")
      .eq("login_email", loginEmail)
      .maybeSingle();

    if (existingError) return json({ error: existingError.message }, 500);
    if (existing) {
      return json(
        { error: "That phone number already has gate staff access. Reset its password instead." },
        409,
      );
    }

    const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
      email: loginEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: "gate_staff", phone },
    });

    if (createError || !createdUser.user) {
      return json({ error: createError?.message ?? "Could not create the staff login." }, 400);
    }

    const staffUserId = createdUser.user.id;

    const { error: profileError } = await admin.from("users").upsert(
      {
        id: staffUserId,
        email: loginEmail,
        full_name: fullName,
        role: "gate_staff",
        verified: false,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      await admin.auth.admin.deleteUser(staffUserId);
      return json({ error: profileError.message }, 500);
    }

    const { data: staffRow, error: staffError } = await admin
      .from("gate_staff")
      .insert({
        organizer_id: caller.id,
        user_id: staffUserId,
        event_id: eventId,
        full_name: fullName,
        phone,
        login_email: loginEmail,
        gate,
        role,
        status: "Active",
      })
      .select("id, full_name, phone, gate, role, status, scans, event_id, invited_at")
      .single();

    if (staffError) {
      await admin.auth.admin.deleteUser(staffUserId);
      return json({ error: staffError.message }, 500);
    }

    return json({
      staff: staffRow,
      credentials: { phone, loginEmail, gate },
    });
  }

  if (action === "revoke" || action === "restore" || action === "reset_password") {
    const staffId = String(body.staffId ?? "");
    if (!staffId) return json({ error: "Missing staff member." }, 400);

    const { data: staff, error: staffLookupError } = await admin
      .from("gate_staff")
      .select("id, user_id, organizer_id")
      .eq("id", staffId)
      .maybeSingle();

    if (staffLookupError) return json({ error: staffLookupError.message }, 500);
    if (!staff) return json({ error: "Gate staff member not found." }, 404);
    if (staff.organizer_id !== caller.id && callerRole !== "admin") {
      return json({ error: "This staff member belongs to another organizer." }, 403);
    }

    if (action === "reset_password") {
      const password = String(body.password ?? "");
      if (password.length < 8) return json({ error: "Use a password with at least 8 characters." }, 400);
      if (!staff.user_id) return json({ error: "This staff member has no login yet." }, 400);
      const { error } = await admin.auth.admin.updateUserById(staff.user_id, { password });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    const nextStatus = action === "revoke" ? "Revoked" : "Active";
    const { error: updateError } = await admin
      .from("gate_staff")
      .update({ status: nextStatus })
      .eq("id", staffId);

    if (updateError) return json({ error: updateError.message }, 500);

    if (staff.user_id) {
      // Banning forces an immediate sign-out and blocks new sign-ins.
      await admin.auth.admin.updateUserById(staff.user_id, {
        ban_duration: action === "revoke" ? "876000h" : "none",
      });
    }

    return json({ ok: true, status: nextStatus });
  }

  if (action === "list") {
    const { data, error } = await admin
      .from("gate_staff")
      .select("id, full_name, phone, gate, role, status, scans, event_id, invited_at, last_scan_at")
      .eq("organizer_id", caller.id)
      .order("invited_at", { ascending: false });

    if (error) return json({ error: error.message }, 500);
    return json({ staff: data ?? [] });
  }

  return json({ error: "Unknown action." }, 400);
});
