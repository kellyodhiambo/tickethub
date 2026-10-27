import type { DashNavItem } from "@/components/feature/DashboardShell";

export const organizerNav: DashNavItem[] = [
  { label: "Overview", to: "/organizer", icon: "ri-dashboard-3-line", end: true },
  { label: "My Events", to: "/organizer/events", icon: "ri-calendar-2-line" },
  { label: "Create Event", to: "/organizer/events/new", icon: "ri-add-box-line" },
  { label: "Orders", to: "/organizer/orders", icon: "ri-shopping-bag-3-line", badge: "10" },
  { label: "Attendees", to: "/organizer/attendees", icon: "ri-group-line" },
  { label: "Ticket Scanner", to: "/scanner", icon: "ri-qr-scan-2-line" },
  { label: "Gate Staff", to: "/organizer/staff", icon: "ri-shield-user-line" },
  { label: "Earnings", to: "/organizer/earnings", icon: "ri-wallet-3-line" },
  { label: "Withdrawals", to: "/organizer/withdrawals", icon: "ri-bank-card-line", badge: "2" },
  { label: "Promoters", to: "/organizer/promoters", icon: "ri-megaphone-line" },
  { label: "Analytics", to: "/organizer/analytics", icon: "ri-bar-chart-2-line" },
  { label: "Settings", to: "/organizer/settings", icon: "ri-settings-4-line" },
  { label: "Help & Support", to: "/organizer/support", icon: "ri-customer-service-2-line" },
];

export const organizerMobileNav = [
  { label: "Overview", to: "/organizer", icon: "ri-dashboard-3-line" },
  { label: "Events", to: "/organizer/events", icon: "ri-calendar-2-line" },
  { label: "Scan", to: "/scanner", icon: "ri-qr-scan-2-line", accent: true },
  { label: "Earnings", to: "/organizer/earnings", icon: "ri-wallet-3-line" },
  { label: "Account", to: "/organizer/settings", icon: "ri-user-3-line" },
];

export const adminNav: DashNavItem[] = [
  { label: "Platform Overview", to: "/admin", icon: "ri-dashboard-3-line", end: true },
  { label: "Users", to: "/admin/users", icon: "ri-group-line" },
  { label: "Organizers", to: "/admin/organizers", icon: "ri-store-3-line", badge: "2" },
  { label: "Events", to: "/admin/events", icon: "ri-calendar-2-line" },
  { label: "Transactions", to: "/admin/transactions", icon: "ri-exchange-dollar-line" },
  { label: "Commissions", to: "/admin/commissions", icon: "ri-percent-line" },
  { label: "Payouts", to: "/admin/payouts", icon: "ri-bank-line", badge: "2" },
  { label: "Refunds", to: "/admin/refunds", icon: "ri-refund-2-line" },
  { label: "Reports", to: "/admin/reports", icon: "ri-file-chart-2-line" },
  { label: "Settings", to: "/admin/settings", icon: "ri-settings-4-line" },
];

export const adminMobileNav = [
  { label: "Overview", to: "/admin", icon: "ri-dashboard-3-line" },
  { label: "Users", to: "/admin/users", icon: "ri-group-line" },
  { label: "Events", to: "/admin/events", icon: "ri-calendar-2-line" },
  { label: "Finance", to: "/admin/payouts", icon: "ri-bank-line" },
  { label: "More", to: "/admin/settings", icon: "ri-more-2-line" },
];