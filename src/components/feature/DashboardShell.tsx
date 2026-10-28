import { useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/helpers";
import { BrandMark } from "@/components/feature/PublicLayout";
import ThemeToggle from "@/components/base/ThemeToggle";
import { useApp } from "@/store/AppStore";
import { useAuth } from "@/store/AuthProvider";

export type DashNavItem = {
  label: string;
  to: string;
  icon: string;
  badge?: string;
  end?: boolean;
};

type DashboardShellProps = {
  variant: "organizer" | "admin";
  nav: DashNavItem[];
  mobileNav: { label: string; to: string; icon: string; accent?: boolean }[];
  userName: string;
  userRole: string;
  initials: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function DashboardShell({
  variant,
  nav,
  mobileNav,
  userName,
  initials,
  title,
  description,
  actions,
  children,
}: DashboardShellProps) {
  const location = useLocation();
  const { notifications, notificationsRead, markNotificationsRead } = useApp();
  const { user, profile } = useAuth();
  const displayName = profile?.full_name || user?.email || userName;
  const displayRole = variant === "admin" ? "Platform administrator" : profile?.verified ? "Verified organizer" : "Organizer";
  const displayInitials = profile?.full_name
    ? profile.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || initials;
  const [notifOpen, setNotifOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const unread = notifications.filter((item) => !item.read && !notificationsRead.includes(item.id)).length;
  const accentClass = variant === "admin" ? "bg-foreground-900" : "bg-secondary-900";

  return (
    <div className="min-h-screen bg-background-100">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-background-200 bg-background-50 lg:flex">
        <div className="flex h-16 items-center border-b border-background-200 px-5">
          <BrandMark />
        </div>
        <div className="flex items-center gap-2 px-5 pt-4">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-label font-bold uppercase tracking-wider",
              variant === "admin"
                ? "bg-foreground-900 text-background-50"
                : "bg-secondary-200 text-secondary-900"
            )}
          >
            <i className={variant === "admin" ? "ri-shield-star-line" : "ri-store-3-line"} />
            {variant === "admin" ? "Admin console" : "Organizer workspace"}
          </span>
        </div>
        <nav className="mt-3 flex-1 overflow-y-auto px-3 pb-4 no-scrollbar">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "mb-0.5 flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-foreground-950 text-background-50"
                    : "text-foreground-700 hover:bg-background-100 hover:text-foreground-950"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <i className={cn(item.icon, "text-base", isActive ? "text-primary-400" : "text-foreground-500")} />
                  <span className="flex-1 whitespace-nowrap">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        isActive ? "bg-background-50/15 text-background-50" : "bg-primary-100 text-primary-800"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-background-200 p-3">
          <div className="flex items-center gap-2.5 rounded-md bg-background-100 p-2.5">
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-background-50", accentClass)}>
              {displayInitials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground-950">{displayName}</p>
              <p className="truncate text-[10px] text-foreground-500">{displayRole}</p>
            </div>
            <Link to="/" className="cursor-pointer text-foreground-400 hover:text-foreground-900" aria-label="Back to site">
              <i className="ri-logout-box-r-line text-sm" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button className="absolute inset-0 bg-foreground-950/50" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />
          <div className="relative h-full w-[280px] animate-slide-in overflow-y-auto bg-background-50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <BrandMark />
              <button onClick={() => setSidebarOpen(false)} className="cursor-pointer text-foreground-500">
                <i className="ri-close-line text-xl" />
              </button>
            </div>
            <nav className="grid grid-cols-2 gap-2">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 text-[12px] font-medium",
                      isActive
                        ? "border-foreground-950 bg-foreground-950 text-background-50"
                        : "border-background-200 text-foreground-700"
                    )
                  }
                >
                  <i className={cn(item.icon, "text-sm")} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="lg:pl-[248px]">
        {/* Top header */}
        <header className="sticky top-0 z-30 border-b border-background-200 bg-background-50/95 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 md:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-background-200 text-foreground-800 lg:hidden"
              aria-label="Open navigation"
            >
              <i className="ri-menu-3-line text-lg" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold text-foreground-950 md:text-lg">{title}</h1>
              {description && <p className="hidden truncate text-[11px] text-foreground-500 md:block">{description}</p>}
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <div className="flex h-9 items-center gap-2 rounded-full border border-background-300 bg-background-100 px-3">
                <i className="ri-search-line text-xs text-foreground-500" />
                <input
                  placeholder="Search…"
                  className="w-32 bg-transparent text-xs outline-none placeholder:text-foreground-400 lg:w-44"
                />
              </div>
              <Link
                to="/"
                className="flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-background-300 px-2.5 text-[11px] font-semibold text-foreground-700 hover:bg-background-100"
              >
                <i className="ri-external-link-line text-xs" /> View site
              </Link>
            </div>
            <div className="relative">
              <ThemeToggle />
            </div>
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen((open) => !open);
                  markNotificationsRead();
                }}
                className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-background-300 text-foreground-700 hover:bg-background-100"
                aria-label="Notifications"
              >
                <i className="ri-notification-3-line" />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary-500" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-11 z-50 w-[300px] animate-pop-in rounded-card border border-background-200 bg-background-50 p-2 md:w-[360px]">
                  <p className="px-2 py-1.5 text-[11px] font-label font-bold uppercase tracking-wider text-foreground-500">
                    Notifications
                  </p>
                  <div className="max-h-[320px] overflow-y-auto">
                    {notifications.map((item) => (
                      <div key={item.id} className="flex gap-2.5 rounded-md px-2 py-2 hover:bg-background-100">
                        <span className={cn("mt-1.5 h-1.5 w-1.5 flex-none rounded-full", item.read ? "bg-foreground-300" : "bg-primary-500")} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground-900">{item.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-foreground-600">{item.body}</p>
                          <p className="mt-1 text-[10px] text-foreground-400">{new Date(item.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-background-50", accentClass)}>
              {displayInitials}
            </span>
          </div>
        </header>

        <div className="px-4 pb-28 pt-5 md:px-6 md:pb-10 md:pt-6">
          {actions && <div className="mb-5">{actions}</div>}
          {children}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-background-200 bg-background-50/98 backdrop-blur-md lg:hidden">
        <div className="safe-bottom mx-auto grid max-w-md px-1" style={{ gridTemplateColumns: `repeat(${mobileNav.length}, minmax(0, 1fr))` }}>
          {mobileNav.map((item) => {
            const isActive =
              item.to === "/organizer" || item.to === "/admin"
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
            if (item.accent) {
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className="flex cursor-pointer flex-col items-center gap-0.5 py-1.5 text-[10px] font-label font-semibold text-primary-700"
                >
                  <span className="flex h-9 w-9 -mt-3 items-center justify-center rounded-full bg-primary-500 text-background-50 ring-4 ring-background-50">
                    <i className={cn(item.icon, "text-lg")} />
                  </span>
                  {item.label}
                </Link>
              );
            }
            return (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-1 py-2 text-[10px] font-label font-semibold",
                  isActive ? "text-foreground-950" : "text-foreground-500"
                )}
              >
                <i className={cn(item.icon, "text-lg", isActive && "text-primary-600")} />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
