import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { WalletTicket, ScanEntry, StaffMember, Withdrawal, OrderRecord } from "@/types";
import { seedScans, staffMembers, walletTickets, withdrawals as seedWithdrawals, orders as seedOrders } from "@/mocks/dashboard";
import { makeReference, makeTicketCode } from "@/lib/helpers";

type Toast = { id: string; message: string; tone: "success" | "danger" | "warning" | "info" };

type PurchasePayload = {
  eventSlug: string;
  tierName: string;
  quantity: number;
  attendee: string;
  buyer: string;
  phone: string;
  total: number;
  commission: number;
};

type AppState = {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  tickets: WalletTicket[];
  orders: OrderRecord[];
  scans: ScanEntry[];
  staff: StaffMember[];
  withdrawals: Withdrawal[];
  notificationsRead: string[];
  markNotificationsRead: () => void;
  issueTickets: (payload: PurchasePayload) => WalletTicket[];
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
  const [favorites, setFavorites] = useState<string[]>(["evt-1", "evt-2"]);
  const [tickets, setTickets] = useState<WalletTicket[]>(walletTickets);
  const [orders, setOrders] = useState<OrderRecord[]>(seedOrders);
  const [scans, setScans] = useState<ScanEntry[]>(seedScans);
  const [staff, setStaff] = useState<StaffMember[]>(staffMembers);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(seedWithdrawals);
  const [notificationsRead, setNotificationsRead] = useState<string[]>([]);
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

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }, []);

  const markNotificationsRead = useCallback(() => {
    setNotificationsRead(["n-1", "n-2", "n-3", "n-4"]);
  }, []);

  const issueTickets = useCallback((payload: PurchasePayload) => {
    const reference = makeReference();
    const created: WalletTicket[] = Array.from({ length: payload.quantity }).map((_, index) => ({
      id: `${reference}-${index}`,
      code: makeTicketCode(reference, payload.tierName, index + 1),
      orderReference: reference,
      eventSlug: payload.eventSlug,
      tier: payload.tierName,
      attendee: index === 0 ? payload.attendee : `Guest ${index + 1} (${payload.attendee.split(" ")[0]})`,
      status: "Valid",
      issuedAt: new Date().toISOString().slice(0, 10),
    }));
    setTickets((current) => [...created, ...current]);
    setOrders((current) => [
      {
        id: reference,
        reference,
        eventSlug: payload.eventSlug,
        buyer: payload.buyer,
        phone: payload.phone,
        tier: payload.tierName,
        quantity: payload.quantity,
        total: payload.total,
        commission: payload.commission,
        status: "Paid",
        channel: "M-Pesa",
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
      ...current,
    ]);
    return created;
  }, []);

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
      setWithdrawals((current) => [
        {
          id: `wd-${Date.now()}`,
          reference: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          amount,
          method,
          destination,
          status: "Pending",
          requestedAt: new Date().toISOString().slice(0, 10),
        },
        ...current,
      ]);
    },
    []
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
      markNotificationsRead,
      issueTickets,
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
      markNotificationsRead,
      issueTickets,
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
