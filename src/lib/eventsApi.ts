import { supabase } from "@/lib/supabase";
import type { EventItem, TicketTier } from "@/types";

const EVENT_COLUMNS = [
  "id",
  "status",
  "slug",
  "title",
  "description",
  "cover_image",
  "date",
  "end_date",
  "start_time",
  "end_time",
  "time",
  "venue",
  "address",
  "city",
  "county",
  "category",
  "organizer_id",
  "organizer_name",
  "capacity",
  "tickets_sold",
  "price_from",
  "verified",
  "featured",
  "trending",
  "is_free",
  "sold_out",
  "age_limit",
  "requirements",
  "refund_policy",
  "ticket_tiers",
  "gallery",
  "lineup",
  "schedule",
  "policies",
].join(", ");

type EventRow = {
  id: string;
  status?: string | null;
  slug: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  time: string | null;
  venue: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  category: string | null;
  organizer_id: string | null;
  organizer_name: string | null;
  capacity: number | null;
  tickets_sold: number | null;
  price_from: number | null;
  verified: boolean | null;
  featured: boolean | null;
  trending: boolean | null;
  is_free: boolean | null;
  sold_out: boolean | null;
  age_limit: string | null;
  requirements: string | null;
  refund_policy: string | null;
  ticket_tiers: unknown;
  gallery: unknown;
  lineup: unknown;
  schedule: unknown;
  policies: unknown;
};

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const toDateOnly = (value: string | null, fallback: string): string => {
  if (!value) return fallback;
  return value.slice(0, 10);
};

const mapTier = (raw: unknown, index: number): TicketTier => {
  const tier = (raw ?? {}) as Record<string, unknown>;
  const quantity = Number(tier.quantity ?? 0);
  const sold = Number(tier.sold ?? 0);
  return {
    id: String(tier.id ?? `tier-${index}`),
    name: String(tier.name ?? "General"),
    price: Number(tier.price ?? 0),
    quantity,
    sold,
    salesEnd: String(tier.salesEnd ?? ""),
    maxPerOrder: Number(tier.maxPerOrder ?? 6),
    minPerOrder: Number(tier.minPerOrder ?? 1),
    description: String(tier.description ?? ""),
    perks: asArray<string>(tier.perks).map(String),
  };
};

export const mapEventRow = (row: EventRow): EventItem => {
  const date = toDateOnly(row.date, new Date().toISOString().slice(0, 10));
  const tiers = asArray<unknown>(row.ticket_tiers).map(mapTier);
  const priceFrom =
    row.price_from ??
    (tiers.length > 0 ? Math.min(...tiers.map((tier) => tier.price)) : 0);

  return {
    id: row.id,
    status: row.status ?? "upcoming",
    slug: row.slug,
    title: row.title,
    category: row.category ?? "Concerts",
    city: row.city ?? "",
    county: row.county ?? "",
    venue: row.venue ?? "",
    address: row.address ?? "",
    date,
    endDate: toDateOnly(row.end_date, date),
    startTime: row.start_time || row.time || "",
    endTime: row.end_time || "",
    image: row.cover_image ?? "",
    gallery: asArray<string>(row.gallery).map(String).filter(Boolean),
    priceFrom,
    organizerId: row.organizer_id ?? "",
    organizerName: row.organizer_name ?? "",
    verified: Boolean(row.verified),
    featured: Boolean(row.featured),
    trending: Boolean(row.trending),
    free: Boolean(row.is_free) || priceFrom === 0,
    soldOut: Boolean(row.sold_out),
    capacity: row.capacity ?? 0,
    ticketsSold: row.tickets_sold ?? 0,
    description: row.description ?? "",
    lineup: asArray<{ name: string; role: string; time: string }>(row.lineup),
    schedule: asArray<{ time: string; label: string }>(row.schedule),
    ageLimit: row.age_limit ?? "",
    requirements: row.requirements ?? "",
    refundPolicy: row.refund_policy ?? "",
    policies: asArray<string>(row.policies).map(String),
    tiers,
  };
};

export async function fetchEvents(): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .in("status", ["upcoming", "ongoing"])
    .order("date", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapEventRow(row as unknown as EventRow));
}

export async function fetchEventsByOrganizer(organizerId: string): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("organizer_id", organizerId)
    .order("date", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapEventRow(row as unknown as EventRow));
}

export async function fetchEventBySlug(slug: string): Promise<EventItem | null> {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("slug", slug)
    .in("status", ["upcoming", "ongoing"])
    .limit(1);

  if (error) throw new Error(error.message);
  const row = (data ?? [])[0];
  return row ? mapEventRow(row as unknown as EventRow) : null;
}

export type EventTierInput = {
  name: string;
  price: number;
  quantity: number;
  salesEnd: string;
  maxPerOrder: number;
  description: string;
};

export type CreateEventInput = {
  title: string;
  category: string;
  description: string;
  coverImage: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  city: string;
  address: string;
  organizerId: string;
  organizerName: string;
  verified: boolean;
  tiers: EventTierInput[];
  refundPolicy: string;
  cancellation: string;
  ageLimit: string;
  requirements: string;
  status: "upcoming" | "draft";
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "event";

const EAT_OFFSET = "+03:00";

const toTimestamp = (date: string, time: string): string => {
  const safeTime = /^\d{2}:\d{2}$/.test(time) ? time : "18:00";
  return new Date(`${date}T${safeTime}:00${EAT_OFFSET}`).toISOString();
};

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase.from("events").select("id").eq("slug", candidate).limit(1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * Creates an event owned by the signed-in organizer. The poster URL saved on
 * `cover_image` is what the catalogue, the event page and every ticket render.
 */
export async function createEvent(input: CreateEventInput): Promise<{ id: string; slug: string }> {
  const slug = await uniqueSlug(input.title);
  const startIso = toTimestamp(input.date, input.startTime);
  const endsNextDay = input.endTime <= input.startTime;
  const endDate = endsNextDay
    ? new Date(new Date(`${input.date}T00:00:00${EAT_OFFSET}`).getTime() + 86400000)
        .toISOString()
        .slice(0, 10)
    : input.date;
  const endIso = toTimestamp(endDate, input.endTime);

  const tiers = input.tiers.map((tier, index) => ({
    id: `tier-${index + 1}`,
    name: tier.name,
    price: tier.price,
    quantity: tier.quantity,
    sold: 0,
    salesEnd: tier.salesEnd,
    maxPerOrder: tier.maxPerOrder,
    minPerOrder: 1,
    description: tier.description,
    perks: [],
  }));

  const capacity = tiers.reduce((sum, tier) => sum + tier.quantity, 0);
  const priceFrom =
    tiers.length > 0 ? Math.min(...tiers.map((tier) => tier.price)) : 0;

  const payload = {
    title: input.title.trim(),
    slug,
    description: input.description,
    cover_image: input.coverImage,
    category: input.category,
    city: input.city,
    county: input.city,
    date: input.date,
    start_date: startIso,
    end_date: endIso,
    time: input.startTime,
    start_time: input.startTime,
    end_time: input.endTime,
    venue: input.venue,
    address: input.address,
    venue_address: input.address,
    organizer: input.organizerName,
    organizer_id: input.organizerId,
    organizer_name: input.organizerName,
    verified: input.verified,
    status: input.status,
    capacity,
    total_capacity: capacity,
    price_from: priceFrom,
    is_free: priceFrom === 0,
    ticket_tiers: tiers,
    age_limit: input.ageLimit,
    requirements: input.requirements,
    refund_policy: input.refundPolicy,
    policies: [input.refundPolicy, input.cancellation].filter(Boolean),
    gallery: [],
    lineup: [],
    schedule: [],
  };

  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select("id, slug")
    .limit(1);

  if (error) throw new Error(error.message);
  const row = (data ?? [])[0] as { id: string; slug: string } | undefined;
  if (!row) throw new Error("The event was saved but could not be read back. Please try again.");
  return row;
}
