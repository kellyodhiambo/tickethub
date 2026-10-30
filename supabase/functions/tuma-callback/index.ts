import { createClient } from "jsr:@supabase/supabase-js@2";

const hash = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const result = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(result)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  try {
    const token = new URL(req.url).searchParams.get("token") ?? "";
    if (!/^[a-f0-9]{64}$/.test(token)) return Response.json({ error: "Invalid callback" }, { status: 401 });
    const payload = await req.json();
    const checkoutId = String(payload.checkout_request_id ?? "");
    if (!checkoutId) return Response.json({ error: "Missing checkout request" }, { status: 400 });
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const tokenHash = await hash(token);
    const { data: attempt, error } = await admin.from("ticket_payment_attempts")
      .select("id,callback_token_hash,checkout_request_id,status,amount")
      .eq("callback_token_hash", tokenHash).maybeSingle();
    if (error || !attempt || (attempt.checkout_request_id && attempt.checkout_request_id !== checkoutId)) return Response.json({ error: "Payment attempt not found" }, { status: 404 });
    if (!attempt.checkout_request_id) {
      const { error: bindError } = await admin.from("ticket_payment_attempts")
        .update({ checkout_request_id: checkoutId })
        .eq("id", attempt.id).is("checkout_request_id", null);
      if (bindError) return Response.json({ error: "Could not reconcile callback" }, { status: 409 });
    }
    if (attempt.status === "paid") return Response.json({ success: true, message: "Already processed" });
    const resultCode = Number(payload.result_code);
    const amount = payload.amount == null && Number(payload.result_code) !== 0 ? Number(attempt.amount) : Number(payload.amount);
    const receipt = String(payload.mpesa_receipt_number ?? "");
    const description = String(payload.result_desc ?? payload.failure_reason ?? payload.status ?? "").slice(0, 500);
    if (!Number.isInteger(resultCode) || !Number.isFinite(amount)) return Response.json({ error: "Invalid callback details" }, { status: 400 });
    const { data: accepted, error: finalizeError } = await admin.rpc("finalize_tuma_ticket_payment", {
      p_attempt_id: attempt.id, p_checkout_request_id: checkoutId, p_amount: amount,
      p_receipt_number: receipt, p_result_code: resultCode, p_result_desc: description,
    });
    if (finalizeError || accepted !== true) {
      console.error("Tuma callback finalization failed", finalizeError);
      return Response.json({ error: "Callback could not be reconciled" }, { status: 409 });
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error("Tuma callback error", error);
    return Response.json({ error: "Invalid callback" }, { status: 400 });
  }
});
