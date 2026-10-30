import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json" },
});
const sha256 = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};
const randomToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};
const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith("7")) return `254${digits}`;
  throw new Error("Enter a valid Kenyan M-Pesa phone number.");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const businessEmail = Deno.env.get("TUMA_BUSINESS_EMAIL");
    const apiKey = Deno.env.get("TUMA_API_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "Payment service is unavailable." }, 503);
    if (!businessEmail || !apiKey) return json({ error: "Tuma payments are not configured yet. Please try again later." }, 503);

    const auth = req.headers.get("Authorization") ?? "";
    let userId: string | null = null;
    if (auth.startsWith("Bearer ")) {
      const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
      const { data, error } = await userClient.auth.getUser();
      if (error || !data.user) return json({ error: "Your session expired. Sign in and try again." }, 401);
      userId = data.user.id;
    }

    const body = await req.json();
    const eventSlug = String(body.eventSlug ?? "");
    const tierId = String(body.tierId ?? "");
    const quantity = Number(body.quantity);
    const buyerName = String(body.name ?? "").trim().slice(0, 160);
    const buyerEmail = String(body.email ?? "").trim().slice(0, 254).toLowerCase();
    const phone = normalizePhone(String(body.phone ?? ""));
    if (!eventSlug || !tierId || !Number.isInteger(quantity) || quantity < 1 || quantity > 10 || !buyerName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      return json({ error: "Check your event, ticket quantity, name and email." }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: event, error: eventError } = await admin.from("events")
      .select("id,title,status,ticket_tiers,capacity,tickets_sold")
      .eq("slug", eventSlug).maybeSingle();
    if (eventError || !event) return json({ error: "This event is not available for booking." }, 404);
    if (!["upcoming", "ongoing"].includes(String(event.status))) return json({ error: "This event is not open for booking." }, 409);
    const tiers = Array.isArray(event.ticket_tiers) ? event.ticket_tiers as Record<string, unknown>[] : [];
    const tier = tiers.find((item) => String(item.id ?? "") === tierId);
    if (!tier) return json({ error: "That ticket type is no longer available." }, 409);
    const unitPrice = Number(tier.price);
    const available = Number(tier.quantity ?? 0) - Number(tier.sold ?? 0);
    if (!Number.isFinite(unitPrice) || unitPrice < 1 || quantity > available) return json({ error: "Not enough tickets are available for this quantity." }, 409);

    const subtotal = Math.round(unitPrice * quantity);
    const fee = Math.round(subtotal * 0.02);
    const discount = String(body.promo ?? "").trim().toUpperCase() === "DALA10" ? Math.round(subtotal * 0.1) : 0;
    const amount = Math.max(1, subtotal + fee - discount);
    const orderReference = `DLA-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
    const callbackToken = randomToken();
    const statusToken = randomToken();
    const callbackUrl = `${supabaseUrl}/functions/v1/tuma-callback?token=${callbackToken}`;

    const { data: order, error: orderError } = await admin.from("orders").insert({
      reference: orderReference, user_id: userId, event_id: event.id, buyer: buyerName,
      phone, tier: String(tier.name ?? "General"), quantity, subtotal, fee, total: amount,
      commission: Math.round(subtotal * 0.1), status: "pending", channel: "M-Pesa",
    }).select("id").single();
    if (orderError || !order) throw new Error(`Could not start order: ${orderError?.message ?? "database error"}`);

    const { data: attempt, error: attemptError } = await admin.from("ticket_payment_attempts").insert({
      order_id: order.id, event_id: event.id, order_reference: orderReference,
      callback_token_hash: await sha256(callbackToken), status_token_hash: await sha256(statusToken),
      amount, unit_price: unitPrice, quantity, tier_id: tierId, tier_name: String(tier.name ?? "General"),
      attendee_names: Array.isArray(body.attendees) ? body.attendees.slice(0, quantity).map((x: unknown) => String(x).trim().slice(0, 160)) : [],
      buyer_name: buyerName, buyer_email: buyerEmail, buyer_phone: phone,
    }).select("id").single();
    if (attemptError || !attempt) {
      await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
      throw new Error("Could not prepare the payment. Please try again.");
    }
    const failAttempt = async (message: string) => {
      await admin.from("ticket_payment_attempts").update({ status: "failed", result_desc: message.slice(0, 500) }).eq("id", attempt.id);
      await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
    };

    let authResponse: Response;
    try {
      authResponse = await fetch("https://api.tuma.co.ke/auth/token", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: businessEmail, api_key: apiKey }),
      });
    } catch {
      await failAttempt("Could not reach Tuma. Please retry checkout.");
      throw new Error("Could not reach Tuma. Please try again.");
    }
    const authJson = await authResponse.json().catch(() => ({}));
    const bearer = authJson?.data?.token;
    if (!authResponse.ok || authJson?.success !== true || !bearer) {
      const message = String(authJson?.message || "Tuma authentication failed.");
      await failAttempt(message);
      throw new Error(message);
    }

    let paymentResponse: Response;
    try {
      paymentResponse = await fetch("https://api.tuma.co.ke/payment/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearer}` },
        body: JSON.stringify({ amount, phone, description: `Ticket ${orderReference} - ${event.title}`.slice(0, 255), callback_url: callbackUrl }),
      });
    } catch {
      await failAttempt("Could not reach Tuma. Please retry checkout.");
      throw new Error("Could not reach Tuma. Please try again.");
    }
    const paymentJson = await paymentResponse.json().catch(() => ({}));
    const paymentData = paymentJson?.data;
    if (!paymentResponse.ok || paymentJson?.success !== true || !paymentData?.checkout_request_id) {
      await failAttempt(String(paymentJson?.message ?? "Tuma rejected payment"));
      throw new Error(paymentJson?.message || "Tuma could not start the M-Pesa prompt.");
    }
    const { error: updateError } = await admin.from("ticket_payment_attempts").update({
      checkout_request_id: String(paymentData.checkout_request_id),
      merchant_request_id: paymentData.merchant_request_id ? String(paymentData.merchant_request_id) : null,
    }).eq("id", attempt.id);
    if (updateError) throw new Error("Payment started but could not be tracked. Contact support before retrying.");

    return json({ success: true, attemptId: attempt.id, statusToken, message: paymentData.customer_message ?? "Check your phone for the M-Pesa prompt." });
  } catch (error) {
    console.error("Tuma checkout error", error);
    return json({ error: error instanceof Error ? error.message : "Could not start the payment." }, 400);
  }
});
