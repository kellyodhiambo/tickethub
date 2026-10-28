import { supabase } from "@/lib/supabase";

export type AdminListKind = "users" | "organizers" | "events" | "transactions" | "payouts" | "refunds";
export type AdminRow = Record<string, string | number>;

const dateOnly = (value: unknown) => String(value ?? "").slice(0, 10);

export async function fetchAdminRows(kind: AdminListKind): Promise<AdminRow[]> {
  if (kind === "users") {
    const [userResult, orderResult] = await Promise.all([
      supabase.from("users").select("id,full_name,email,role,status,created_at").order("created_at", { ascending: false }),
      supabase.from("orders").select("user_id"),
    ]);
    if (userResult.error) throw userResult.error;
    if (orderResult.error) throw orderResult.error;
    const counts = new Map<string, number>();
    for (const order of orderResult.data ?? []) if (order.user_id) counts.set(order.user_id, (counts.get(order.user_id) ?? 0) + 1);
    return (userResult.data ?? []).map((row) => ({ id: row.id, name: row.full_name ?? "", email: row.email, role: row.role ?? "member", orders: counts.get(row.id) ?? 0, joined: dateOnly(row.created_at), status: row.status ?? "active" }));
  }
  if (kind === "organizers") {
    const [userResult, eventResult, orderResult] = await Promise.all([
      supabase.from("users").select("id,full_name,location,verified,created_at").eq("role", "organizer").order("created_at", { ascending: false }),
      supabase.from("events").select("id,organizer_id"),
      supabase.from("orders").select("event_id,total,commission,status"),
    ]);
    if (userResult.error) throw userResult.error;
    if (eventResult.error) throw eventResult.error;
    if (orderResult.error) throw orderResult.error;
    const eventOwners = new Map<string, string>();
    const eventCounts = new Map<string, number>();
    for (const event of eventResult.data ?? []) {
      eventOwners.set(event.id, event.organizer_id ?? "");
      if (event.organizer_id) eventCounts.set(event.organizer_id, (eventCounts.get(event.organizer_id) ?? 0) + 1);
    }
    const financials = new Map<string, { gmv: number; commission: number }>();
    for (const order of orderResult.data ?? []) {
      if (!(["paid", "completed"].includes(String(order.status).toLowerCase()))) continue;
      const owner = eventOwners.get(order.event_id);
      if (!owner) continue;
      const value = financials.get(owner) ?? { gmv: 0, commission: 0 };
      value.gmv += Number(order.total ?? 0);
      value.commission += Number(order.commission ?? 0);
      financials.set(owner, value);
    }
    return (userResult.data ?? []).map((row) => {
      const totals = financials.get(row.id) ?? { gmv: 0, commission: 0 };
      return { id: row.id, name: row.full_name ?? "", city: row.location ?? "", events: eventCounts.get(row.id) ?? 0, gmv: totals.gmv, commission: totals.gmv ? Math.round((totals.commission / totals.gmv) * 100) : 0, status: row.verified ? "Verified" : "Pending review", submitted: dateOnly(row.created_at) };
    });
  }
  if (kind === "events") {
    const [eventResult, orderResult] = await Promise.all([
      supabase.from("events").select("id,title,organizer_name,organizer_id,city,date,start_date,tickets_sold,capacity,status").order("created_at", { ascending: false }),
      supabase.from("orders").select("event_id,total,status"),
    ]);
    if (eventResult.error) throw eventResult.error;
    if (orderResult.error) throw orderResult.error;
    const revenue = new Map<string, number>();
    for (const order of orderResult.data ?? []) if (["paid", "completed"].includes(String(order.status).toLowerCase())) revenue.set(order.event_id, (revenue.get(order.event_id) ?? 0) + Number(order.total ?? 0));
    return (eventResult.data ?? []).map((row) => ({ id: row.id, title: row.title, organizer: row.organizer_name ?? row.organizer_id ?? "", city: row.city ?? "", date: dateOnly(row.date ?? row.start_date), sold: Number(row.tickets_sold ?? 0), revenue: revenue.get(row.id) ?? 0, status: row.status ?? "upcoming" }));
  }
  if (kind === "transactions") {
    const { data, error } = await supabase.from("orders").select("id,reference,buyer,event_id,total,commission,status,channel,created_at,events(title)").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => {
      const event = row.events as unknown as { title?: string } | null;
      return { id: row.id, reference: row.reference ?? row.id, buyer: row.buyer ?? "", event: event?.title ?? row.event_id, gross: Number(row.total ?? 0), commission: Number(row.commission ?? 0), provider: row.channel ?? "", status: row.status ?? "pending", at: dateOnly(row.created_at) };
    });
  }
  if (kind === "payouts") {
    const { data, error } = await supabase.from("organizer_withdrawals").select("id,reference,organizer_id,amount,method,destination,status,requested_at,users!organizer_withdrawals_organizer_id_fkey(full_name)").order("requested_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => {
      const user = row.users as unknown as { full_name?: string } | null;
      return { id: row.id, reference: row.reference, organizer: user?.full_name ?? row.organizer_id, amount: Number(row.amount), method: row.method, destination: row.destination, requested: dateOnly(row.requested_at), status: row.status };
    });
  }
  if (kind === "refunds") {
    const { data, error } = await supabase.from("ticket_refund_requests").select("id,reference,ticket_id,user_id,event_id,amount,reason,status,created_at").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({ id: row.id, reference: row.reference, order: row.ticket_id, buyer: row.user_id, event: row.event_id, amount: Number(row.amount), reason: row.reason, status: row.status, requested: dateOnly(row.created_at) }));
  }
  return [];
}
