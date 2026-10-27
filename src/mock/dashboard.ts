import type { OrderRecord, ScanEntry, StaffMember, WalletTicket, Withdrawal } from "@/types";

export const organizerKpis = {
  grossSales: 4826000,
  commission: 482600,
  providerFees: 96520,
  netEarnings: 4246880,
  pendingSettlement: 612400,
  availableBalance: 1384200,
  ticketsSold: 6420,
  checkedIn: 4310,
  eventsLive: 4,
  eventsDraft: 2,
  avgTicket: 752,
  refunds: 74500,
};

export const salesTrend = [
  { label: "12 Oct", sales: 184000, tickets: 210 },
  { label: "14 Oct", sales: 226000, tickets: 268 },
  { label: "16 Oct", sales: 198000, tickets: 231 },
  { label: "18 Oct", sales: 312000, tickets: 388 },
  { label: "20 Oct", sales: 421000, tickets: 512 },
  { label: "22 Oct", sales: 388000, tickets: 470 },
  { label: "24 Oct", sales: 512000, tickets: 640 },
  { label: "26 Oct", sales: 468000, tickets: 571 },
];

export const categorySales = [
  { label: "Regular", value: 2180000, color: "primary" },
  { label: "Early Bird", value: 1240000, color: "accent" },
  { label: "VIP", value: 986000, color: "secondary" },
  { label: "Group", value: 420000, color: "foreground" },
];

export const eventPerformance = [
  { name: "Sound Factory Nairobi", sold: 4310, capacity: 6000, revenue: 2418000, attendance: 92 },
  { name: "Lakeside Festival Kisumu", sold: 5120, capacity: 9000, revenue: 1892000, attendance: 81 },
  { name: "Nakuru Comedy Night", sold: 388, capacity: 420, revenue: 612000, attendance: 97 },
  { name: "Naivasha Weekend Pass", sold: 1500, capacity: 1500, revenue: 924000, attendance: 88 },
];

export const orders: OrderRecord[] = [
  { id: "o-1", reference: "DLA-8F42KD", eventSlug: "sound-factory-nairobi", buyer: "Amina Wanjiru", phone: "+254 712 445 908", tier: "VIP", quantity: 2, total: 12000, commission: 1200, status: "Paid", channel: "M-Pesa", createdAt: "2026-10-26 21:14" },
  { id: "o-2", reference: "DLA-2C91MB", eventSlug: "sound-factory-nairobi", buyer: "Brian Otieno", phone: "+254 733 112 004", tier: "Regular", quantity: 3, total: 7500, commission: 750, status: "Paid", channel: "M-Pesa", createdAt: "2026-10-26 20:02" },
  { id: "o-3", reference: "DLA-77QXAP", eventSlug: "lakeside-festival-kisumu", buyer: "Faith Chepkoech", phone: "+254 721 890 336", tier: "Weekend Pass", quantity: 2, total: 7000, commission: 700, status: "Paid", channel: "M-Pesa", createdAt: "2026-10-26 18:47" },
  { id: "o-4", reference: "DLA-1KLP9C", eventSlug: "nakuru-comedy-night", buyer: "Kevin Mwangi", phone: "+254 715 220 118", tier: "Advance", quantity: 4, total: 4800, commission: 480, status: "Paid", channel: "M-Pesa", createdAt: "2026-10-26 16:20" },
  { id: "o-5", reference: "DLA-9WQ3TR", eventSlug: "naivasha-weekend-pass", buyer: "Grace Achieng", phone: "+254 700 556 901", tier: "Weekend Pass", quantity: 2, total: 7000, commission: 700, status: "Paid", channel: "Card", createdAt: "2026-10-25 22:05" },
  { id: "o-6", reference: "DLA-4MN7VB", eventSlug: "sound-factory-nairobi", buyer: "Samuel Kariuki", phone: "+254 728 664 220", tier: "VVIP Table (6)", quantity: 1, total: 36000, commission: 3600, status: "Paid", channel: "M-Pesa", createdAt: "2026-10-25 19:38" },
  { id: "o-7", reference: "DLA-6PL2ZX", eventSlug: "lakeside-festival-kisumu", buyer: "Janet Njeri", phone: "+254 710 331 447", tier: "Day Pass", quantity: 2, total: 4000, commission: 400, status: "Pending", channel: "M-Pesa", createdAt: "2026-10-25 17:12" },
  { id: "o-8", reference: "DLA-3ZR8HN", eventSlug: "nakuru-comedy-night", buyer: "Peter Wekesa", phone: "+254 799 442 016", tier: "Regular", quantity: 1, total: 1800, commission: 180, status: "Failed", channel: "M-Pesa", createdAt: "2026-10-25 15:55" },
  { id: "o-9", reference: "DLA-5TB4QC", eventSlug: "sound-factory-nairobi", buyer: "Lucy Mutua", phone: "+254 722 118 663", tier: "Regular", quantity: 2, total: 5000, commission: 500, status: "Paid", channel: "M-Pesa", createdAt: "2026-10-24 21:41" },
  { id: "o-10", reference: "DLA-0HX6JY", eventSlug: "naivasha-weekend-pass", buyer: "Dennis Barasa", phone: "+254 705 993 274", tier: "Lodge Weekend", quantity: 1, total: 12500, commission: 1250, status: "Refunded", channel: "M-Pesa", createdAt: "2026-10-24 12:09" },
];

export const walletTickets: WalletTicket[] = [
  { id: "w-1", code: "DLA-8F42KD-VIP-01", orderReference: "DLA-8F42KD", eventSlug: "sound-factory-nairobi", tier: "VIP", attendee: "Amina Wanjiru", status: "Valid", issuedAt: "2026-10-26" },
  { id: "w-2", code: "DLA-8F42KD-VIP-02", orderReference: "DLA-8F42KD", eventSlug: "sound-factory-nairobi", tier: "VIP", attendee: "Yusuf Ali", status: "Valid", issuedAt: "2026-10-26" },
  { id: "w-3", code: "DLA-77QXAP-WKND-01", orderReference: "DLA-77QXAP", eventSlug: "lakeside-festival-kisumu", tier: "Weekend Pass", attendee: "Amina Wanjiru", status: "Valid", issuedAt: "2026-10-26" },
  { id: "w-4", code: "DLA-3ZR8HN-REG-01", orderReference: "DLA-3ZR8HN", eventSlug: "nakuru-comedy-night", tier: "Regular", attendee: "Amina Wanjiru", status: "Used", issuedAt: "2026-10-20", gate: "Gate B", scannedAt: "2026-10-25 19:42" },
];

export const staffMembers: StaffMember[] = [
  { id: "s-1", name: "Mercy Achieng", phone: "+254 712 004 118", gate: "Gate A — Main", role: "Scanner only", status: "Active", scans: 1840 },
  { id: "s-2", name: "Collins Kiptoo", phone: "+254 733 887 220", gate: "Gate B — Main", role: "Scanner only", status: "Active", scans: 1622 },
  { id: "s-3", name: "Halima Noor", phone: "+254 700 112 664", gate: "VIP Entrance", role: "Scanner only", status: "Active", scans: 640 },
  { id: "s-4", name: "Brian Wekesa", phone: "+254 721 550 903", gate: "Gate C — Staff", role: "Scanner only", status: "Invited", scans: 0 },
  { id: "s-5", name: "Ann Wambui", phone: "+254 799 331 448", gate: "Gate D — Overflow", role: "Scanner only", status: "Revoked", scans: 208 },
];

export const withdrawals: Withdrawal[] = [
  { id: "wd-1", reference: "PO-2026-1042", amount: 450000, method: "M-Pesa", destination: "+254 712 000 118", status: "Completed", requestedAt: "2026-10-18", note: "Settled in 2 working days" },
  { id: "wd-2", reference: "PO-2026-1031", amount: 268000, method: "M-Pesa", destination: "+254 712 000 118", status: "Completed", requestedAt: "2026-10-04" },
  { id: "wd-3", reference: "PO-2026-1055", amount: 312400, method: "Bank transfer", destination: "KCB •••• 4471", status: "Processing", requestedAt: "2026-10-24" },
  { id: "wd-4", reference: "PO-2026-1058", amount: 96000, method: "M-Pesa", destination: "+254 712 000 118", status: "Pending", requestedAt: "2026-10-26" },
  { id: "wd-5", reference: "PO-2026-1019", amount: 150000, method: "Bank transfer", destination: "KCB •••• 4471", status: "Rejected", requestedAt: "2026-09-22", note: "Destination account name did not match organizer records" },
];

export const promoters = [
  { id: "p-1", name: "Campus Ambassadors", code: "CAMPUS10", rate: 5, clicks: 4820, sales: 1280000, tickets: 512, earned: 64000, status: "Active" },
  { id: "p-2", name: "Nairobi Nightlife Blog", code: "NIGHTLIFE", rate: 7, clicks: 2140, sales: 940000, tickets: 376, earned: 65800, status: "Active" },
  { id: "p-3", name: "DJ Kace Fan Club", code: "KACEFANS", rate: 4, clicks: 1360, sales: 420000, tickets: 168, earned: 16800, status: "Active" },
  { id: "p-4", name: "Kisumu Riders", code: "LAKESIDE", rate: 5, clicks: 640, sales: 150000, tickets: 60, earned: 7500, status: "Paused" },
];

export const ledgerEntries = [
  { id: "le-1", reference: "DLA-8F42KD", type: "Ticket sale", gross: 12000, commission: 1200, fee: 240, net: 10560, at: "2026-10-26 21:14", status: "Settled" },
  { id: "le-2", reference: "DLA-2C91MB", type: "Ticket sale", gross: 7500, commission: 750, fee: 150, net: 6600, at: "2026-10-26 20:02", status: "Settled" },
  { id: "le-3", reference: "DLA-4MN7VB", type: "Ticket sale", gross: 36000, commission: 3600, fee: 720, net: 31680, at: "2026-10-25 19:38", status: "Pending settlement" },
  { id: "le-4", reference: "DLA-0HX6JY", type: "Refund", gross: -12500, commission: -1250, fee: 0, net: -11250, at: "2026-10-24 13:20", status: "Adjusted" },
  { id: "le-5", reference: "PO-2026-1058", type: "Withdrawal", gross: -96000, commission: 0, fee: 0, net: -96000, at: "2026-10-26 09:05", status: "Pending" },
];

export const seedScans: ScanEntry[] = [
  { id: "sc-1", code: "DLA-77QXAP-WKND-01", eventSlug: "lakeside-festival-kisumu", gate: "Gate A — Main", staff: "Mercy Achieng", result: "valid", at: "2026-12-12 12:04" },
  { id: "sc-2", code: "DLA-8F42KD-VIP-02", eventSlug: "sound-factory-nairobi", gate: "VIP Entrance", staff: "Halima Noor", result: "valid", at: "2026-11-21 19:12" },
  { id: "sc-3", code: "DLA-8F42KD-VIP-02", eventSlug: "sound-factory-nairobi", gate: "Gate B — Main", staff: "Collins Kiptoo", result: "duplicate", at: "2026-11-21 19:40" },
  { id: "sc-4", code: "DLA-000XXX-INVALID", eventSlug: "sound-factory-nairobi", gate: "Gate A — Main", staff: "Mercy Achieng", result: "invalid", at: "2026-11-21 20:02" },
];

export const notifications = [
  { id: "n-1", title: "Payout PO-2026-1058 is pending review", body: "Your M-Pesa withdrawal of KSh 96,000 is waiting for finance approval.", time: "2h ago", unread: true, tone: "pending" },
  { id: "n-2", title: "Naivasha Weekend Pass is sold out", body: "1,500 of 1,500 tickets sold. The waitlist is now collecting requests.", time: "5h ago", unread: true, tone: "warning" },
  { id: "n-3", title: "6 duplicate scans rejected at Gate B", body: "Review the scan log for Sound Factory Nairobi before doors open.", time: "1d ago", unread: false, tone: "danger" },
  { id: "n-4", title: "Your organizer verification was approved", body: "The verified badge is now live on DalaLive Events.", time: "3d ago", unread: false, tone: "success" },
];