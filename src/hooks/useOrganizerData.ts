import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchEventsByOrganizer } from "@/lib/eventsApi";
import { useAuth } from "@/store/AuthProvider";
import type { EventItem, OrderRecord } from "@/types";

export type OrganizerOrder = OrderRecord & { eventId: string; eventTitle: string };
export type OrganizerTicket = {
  id: string;
  eventId: string;
  code: string | null;
  tier: string;
  attendee: string;
  status: string;
  paymentStatus: string;
  scannedAt: string | null;
  createdAt: string;
};

export function useOrganizerData() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [orders, setOrders] = useState<OrganizerOrder[]>([]);
  const [tickets, setTickets] = useState<OrganizerTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user?.id) {
        setEvents([]);
        setOrders([]);
        setTickets([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [eventRows, orderResult, ticketResult] = await Promise.all([
          fetchEventsByOrganizer(user.id),
          supabase
            .from("orders")
            .select("id,reference,event_id,buyer,phone,tier,quantity,total,commission,status,channel,created_at,events!inner(title,slug)")
            .eq("events.organizer_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("tickets")
            .select("id,event_id,qr_code,tier_name,attendee,buyer_name,status,payment_status,scanned_at,created_at,events!inner(organizer_id)")
            .eq("events.organizer_id", user.id)
            .in("payment_status", ["completed", "paid"])
            .order("created_at", { ascending: false }),
        ]);
        if (orderResult.error) throw orderResult.error;
        if (ticketResult.error) throw ticketResult.error;
        if (!active) return;
        setEvents(eventRows);
        setOrders((orderResult.data ?? []).map((raw) => {
          const row = raw as Record<string, unknown>;
          const event = row.events as { title?: string; slug?: string } | null;
          const state = String(row.status ?? "pending").toLowerCase();
          return {
            id: String(row.id), reference: String(row.reference ?? row.id), eventId: String(row.event_id),
            eventSlug: String(event?.slug ?? row.event_id), eventTitle: String(event?.title ?? "Event"),
            buyer: String(row.buyer ?? ""), phone: String(row.phone ?? ""), tier: String(row.tier ?? "General"),
            quantity: Number(row.quantity ?? 1), total: Number(row.total ?? 0), commission: Number(row.commission ?? 0),
            status: state === "paid" || state === "completed" ? "Paid" : state === "refunded" ? "Refunded" : state === "failed" ? "Failed" : "Pending",
            channel: String(row.channel ?? ""), createdAt: String(row.created_at ?? ""),
          };
        }));
        setTickets((ticketResult.data ?? []).map((raw) => {
          const row = raw as Record<string, unknown>;
          return {
            id: String(row.id), eventId: String(row.event_id), code: row.qr_code ? String(row.qr_code) : null,
            tier: String(row.tier_name ?? "General"), attendee: String(row.attendee ?? row.buyer_name ?? "Ticket holder"),
            status: String(row.status ?? ""), paymentStatus: String(row.payment_status ?? ""),
            scannedAt: row.scanned_at ? String(row.scanned_at) : null, createdAt: String(row.created_at ?? ""),
          };
        }));
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Organizer data could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [user?.id]);

  return { events, orders, tickets, loading, error };
}
