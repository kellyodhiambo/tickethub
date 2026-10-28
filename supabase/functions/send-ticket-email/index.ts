import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// This legacy endpoint accepted arbitrary ticket ids and queried columns
// removed from the current schema. Disable it until authenticated delivery is
// rebuilt around a verified paid order.
serve((request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  return Response.json({ error: "Ticket email delivery is not configured" }, { status: 503 });
});
