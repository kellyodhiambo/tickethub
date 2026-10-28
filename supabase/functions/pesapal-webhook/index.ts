import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Retired legacy integration. It accepted unsigned callbacks and targeted a
// schema that no longer exists. Keep the URL fail-closed until a verified
// payment provider callback contract is implemented and configured.
serve((request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  return Response.json({ error: "Payment callback is not configured" }, { status: 503 });
});
