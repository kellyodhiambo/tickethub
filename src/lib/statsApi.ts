import { supabase } from "@/lib/supabase";

export type PlatformStats = {
  eventsListed: number;
  ticketsSold: number;
  verifiedOrganizers: number;
  averageRating: number;
  updatedAt: string | null;
};

type StatsRow = {
  events_listed: number | null;
  tickets_sold: number | null;
  verified_organizers: number | null;
  average_rating: number | string | null;
  updated_at: string | null;
};

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const { data, error } = await supabase
    .from("platform_stats")
    .select("events_listed, tickets_sold, verified_organizers, average_rating, updated_at")
    .eq("id", "marketplace")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Platform totals have not been published yet.");

  const row = data as StatsRow;
  return {
    eventsListed: Number(row.events_listed ?? 0),
    ticketsSold: Number(row.tickets_sold ?? 0),
    verifiedOrganizers: Number(row.verified_organizers ?? 0),
    averageRating: Number(row.average_rating ?? 0),
    updatedAt: row.updated_at,
  };
}

/** 250000 -> "250k+", 1200 -> "1.2k+", 900 -> "900+". */
export function formatCompactStat(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}M+`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}k+`;
  }
  return `${value}+`;
}