import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { WalletTicket, ScanEntry, StaffMember, Withdrawal, OrderRecord } from "@/types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/AuthProvider";

type Toast = { id: string; message: string; tone: "success" | "danger" | "warning" | "info" };
export type AppNotification = { id: string; title: string; body: string; link: string | null; read: boolean; created_at: string };

type AppState = {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  tickets: WalletTicket[];
  orders: OrderRecord[];
  scans: ScanEntry[];
  staff: StaffMember[];
  withdrawals: Withdrawal[];
  notificationsRead: string[];
  notifications: AppNotification[];
  markNotificationsRead: () => void;
  validateTicket: (code: string, gate: string) => { result: ScanEntry["result"]; entry: ScanEntry; ticket?: WalletTicket };
  inviteStaff: (member: { name: string; phone: string; gate: string }) => void;
  revokeStaff: (id: string) => void;
  requestWithdrawal: (amount: number, method: string, destination: string) => void;
  toasts: Toast[];
  pushToast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: string) => void;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [tickets, setTickets] = useState<WalletTicket[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [notificationsRead, setNotificationsRead] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user?.id) {
        setFavorites([]);
        setTickets([]);
        setOrders([]);
        setWithdrawals([]);
        setNotifications([]);
        return;
      }
      const [favoriteResult, ticketResult, orderResult, withdrawalResult, notificationResult] = await Promise.all([
        supabase.from("event_favorites").select("event_id").eq("user_id", user.id),
        supabase.from("tickets").select("id,event_id,tier_name,qr_code,status,payment_status,payment_reference,order_reference,attendee,buyer_name,total_amount,price,created_at,gate,scanned_at,events(slug)").eq("user_id", user.id).in("payment_status", ["completed", "paid"]).not("qr_code", "is", null).order("created_at", { ascending: false }),
        supabase.from("orders").select("id,reference,event_id,buyer,phone,tier,quantity,total,commission,status,channel,created_at,events(slug)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("organizer_withdrawals").select("*").eq("organizer_id", user.id).order("requested_at", { ascending: false }),
        supabase.from("notifications").select("id,title,body,link,read,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      ]);
      if (!active) return;
      if (!favoriteResult.error) setFavorites((favoriteResult.data ?? []).map((row) => row.event_id));
      if (!ticketResult.error) setTickets((ticketResult.data ?? []).map((raw) => {
        const row = raw as Record<string, unknown>;
        const event = row.events as { slug?: string } | null;
        const state = String(row.status ?? "").toLowerCase();
        return {
          id: String(row.id), eventId: String(row.event_id), price: Number(row.total_amount ?? row.price ?? 0), code: String(row.qr_code),
          orderReference: String(row.order_reference ?? row.payment_reference ?? ""),
          eventSlug: String(event?.slug ?? row.event_id ?? ""), tier: String(row.tier_name ?? "General"),
          attendee: String(row.attendee ?? row.buyer_name ?? "Ticket holder"),
          status: state === "used" || Boolean(row.scanned_at) ? "Used" : state === "cancelled" ? "Cancelled" : "Valid",
          issuedAt: String(row.created_at ?? "").slice(0, 10),
          gate: row.gate ? String(row.gate) : undefined,
          scannedAt: row.scanned_at ? String(row.scanned_at) : undefined,
        };
      }));
      if (!orderResult.error) setOrders((orderResult.data ?? []).map((raw) => {
        const row = raw as Record<string, unknown>;
        const event = row.events as { slug?: string } | null;
        const state = String(row.status ?? "pending").toLowerCase();
        return {
          id: String(row.id), reference: String(row.reference ?? row.id),
          eventSlug: String(event?.slug ?? row.event_id ?? ""), buyer: String(row.buyer ?? ""),
          phone: String(row.phone ?? ""), tier: String(row.tier ?? "General"), quantity: Number(row.quantity ?? 1),
          total: Number(row.total ?? 0), commission: Number(row.commission ?? 0),
          status: state === "paid" || state === "completed" ? "Paid" : state === "refunded" ? "Refunded" : state === "failed" ? "Failed" : "Pending",
          channel: String(row.channel ?? ""), createdAt: String(row.created_at ?? "").slice(0, 16).replace("T", " "),
        };
      }));
      if (!withdrawalResult.error) setWithdrawals((withdrawalResult.data ?? []).map((row) => ({
        id: row.id, reference: row.reference, amount: Number(row.amount), method: row.method,
        destination: row.destination, status: row.status, requestedAt: String(row.requested_at).slice(0, 10),
        note: row.note ?? undefined,
      })));
      if (!notificationResult.error) setNotifications((notificationResult.data ?? []).map((row) => ({ ...row, link: row.link ?? null, read: Boolean(row.read) })));
    };
    void load();
    return () => { active = false; };
  }, [user?.id]);

  const toggleFavorite = useCallback((id: string) => {
    if (!user?.id) {
      pushToast("Sign in to save events to your account.", "warning");
      return;
    }
    const saved = favorites.includes(id);
    void (async () => {
      const result = saved
        ? await supabase.from("event_favorites").delete().eq("user_id", user.id).eq("event_id", id)
        : await supabase.from("event_favorites").insert({ user_id: user.id, event_id: id });
      if (result.error) {
        pushToast(result.error.message, "danger");
        return;
      }
      setFavorites((current) => saved ? current.filter((item) => item !== id) : [...current, id]);
    })();
  }, [favorites, pushToast, user?.id]);

  const markNotificationsRead = useCallback(() => {
    if (!user?.id) return;
    void (async () => {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
      if (error) { pushToast(error.message, "danger"); return; }
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
      setNotificationsRead((current) => [...new Set([...current, ...notifications.map((item) => item.id)])]);
    })();
  }, [notifications, pushToast, user?.id]);

  const validateTicket = useCallback(
    (code: string, gate: string) => {
      const normalized = code.trim().toUpperCase();
      const ticket = tickets.find((item) => item.code.toUpperCase() === normalized);
      const at = new Date().toISOString().slice(0, 16).replace("T", " ");
      let result: ScanEntry["result"] = "invalid";

      if (!ticket) {
        result = "invalid";
      } else if (ticket.status === "Used") {
        result = "duplicate";
      } else if (ticket.status === "Cancelled") {
        result = "invalid";
      } else {
        result = "valid";
        setTickets((current) =>
          current.map((item) =>
            item.id === ticket.id
              ? { ...item, status: "Used", gate, scannedAt: at }
              : item
          )
        );
      }

      const entry: ScanEntry = {
        id: `scan-${Date.now()}`,
        code: normalized || "—",
        eventSlug: ticket?.eventSlug ?? "sound-factory-nairobi",
        gate,
        staff: "Mercy Achieng",
        result,
        at,
      };
      setScans((current) => [entry, ...current]);
      return { result, entry, ticket };
    },
    [tickets]
  );

  const inviteStaff = useCallback((member: { name: string; phone: string; gate: string }) => {
    setStaff((current) => [
      {
        id: `staff-${Date.now()}`,
        name: member.name,
        phone: member.phone,
        gate: member.gate,
        role: "Scanner only",
        status: "Invited",
        scans: 0,
      },
      ...current,
    ]);
  }, []);

  const revokeStaff = useCallback((id: string) => {
    setStaff((current) =>
      current.map((item) => (item.id === id ? { ...item, status: "Revoked" } : item))
    );
  }, []);

  const requestWithdrawal = useCallback(
    (amount: number, method: string, destination: string) => {
      if (!user?.id) {
        pushToast("Sign in to request a withdrawal.", "warning");
        return;
      }
      void (async () => {
        const { data, error } = await supabase.from("organizer_withdrawals").insert({
          organizer_id: user.id, amount, method, destination,
        }).select("*").single();
        if (error) {
          pushToast(error.message, "danger");
          return;
        }
        setWithdrawals((current) => [{
          id: data.id, reference: data.reference, amount: Number(data.amount), method: data.method,
          destination: data.destination, status: data.status,
          requestedAt: String(data.requested_at).slice(0, 10),
        }, ...current]);
      })();
    },
    [pushToast, user?.id]
  );

  const value = useMemo<AppState>(
    () => ({
      favorites,
      toggleFavorite,
      tickets,
      orders,
      scans,
      staff,
      withdrawals,
      notificationsRead,
      notifications,
      markNotificationsRead,
      validateTicket,
      inviteStaff,
      revokeStaff,
      requestWithdrawal,
      toasts,
      pushToast,
      dismissToast,
    }),
    [
      favorites,
      toggleFavorite,
      tickets,
      orders,
      scans,
      staff,
      withdrawals,
      notificationsRead,
      notifications,
      markNotificationsRead,
      validateTicket,
      inviteStaff,
      revokeStaff,
      requestWithdrawal,
      toasts,
      pushToast,
      dismissToast,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
