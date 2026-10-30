import { createClient } from "jsr:@supabase/supabase-js@2";

const hash = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const result = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(result)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: cors });
  try {
    const { attemptId, statusToken } = await req.json();
    if (typeof attemptId !== "string" || typeof statusToken !== "string") return Response.json({ error: "Invalid status request" }, { status: 400, headers: cors });
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const { data, error } = await admin.from("ticket_payment_attempts").select("id,status,result_desc")
      .eq("id", attemptId).eq("status_token_hash", await hash(statusToken)).maybeSingle();
    if (error || !data) return Response.json({ error: "Payment attempt not found" }, { status: 404, headers: cors });
    return Response.json({ status: data.status, message: data.result_desc }, { headers: cors });
  } catch {
    return Response.json({ error: "Invalid status request" }, { status: 400, headers: cors });
  }
});
