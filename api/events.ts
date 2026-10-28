import { createClient } from "@supabase/supabase-js";

type ApiRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): ApiResponse;
  json(body: unknown): ApiResponse;
  end(): ApiResponse;
};

const EVENT_COLUMNS = [
  "id", "status", "slug", "title", "description", "cover_image", "date", "end_date",
  "start_time", "end_time", "time", "venue", "address", "city", "county", "category",
  "organizer_id", "organizer_name", "capacity", "tickets_sold", "price_from", "verified",
  "featured", "trending", "is_free", "sold_out", "age_limit", "requirements", "refund_policy",
  "ticket_tiers", "gallery", "lineup", "schedule", "policies",
].join(",");
const PAGE_SIZE = 24;

const cacheHeaders = (res: ApiResponse) => {
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.setHeader("Vercel-CDN-Cache-Control", "public, max-age=30, stale-while-revalidate=120");
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const slugValue = req.query.slug;
  if (Array.isArray(slugValue)) return res.status(400).json({ error: "Invalid event slug" });
  const slug = slugValue?.trim();
  if (slug && (slug.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) {
    return res.status(400).json({ error: "Invalid event slug" });
  }

  const offsetValue = req.query.offset;
  if (Array.isArray(offsetValue)) return res.status(400).json({ error: "Invalid page" });
  const paginated = offsetValue !== undefined;
  const offset = paginated ? Number(offsetValue) : 0;
  if (paginated && (!Number.isSafeInteger(offset) || offset < 0 || offset > 10000)) {
    return res.status(400).json({ error: "Invalid page" });
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return res.status(503).json({ error: "Event catalogue is temporarily unavailable" });
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    let query = supabase.from("events").select(EVENT_COLUMNS).in("status", ["upcoming", "ongoing"]);
    if (slug) {
      query = query.eq("slug", slug).limit(1);
    } else if (paginated) {
      query = query
        .order("date", { ascending: true })
        .order("id", { ascending: true })
        .range(offset, offset + PAGE_SIZE);
    } else {
      query = query
        .order("date", { ascending: true })
        .order("id", { ascending: true })
        .limit(1000);
    }

    const { data, error } = await query;
    if (error) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(503).json({ error: "Event catalogue is temporarily unavailable" });
    }

    cacheHeaders(res);
    if (paginated) {
      const rows = data ?? [];
      return res.status(200).json({
        events: rows.slice(0, PAGE_SIZE),
        hasMore: rows.length > PAGE_SIZE,
        nextOffset: offset + PAGE_SIZE,
      });
    }
    return res.status(200).json({ events: data ?? [] });
  } catch {
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).json({ error: "Event catalogue is temporarily unavailable" });
  }
}
