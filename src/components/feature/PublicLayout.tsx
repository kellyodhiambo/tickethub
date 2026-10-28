import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn, initialsOf } from "@/lib/helpers";
import { useApp } from "@/store/AppStore";
import { useAuth } from "@/store/AuthProvider";
import ThemeToggle from "@/components/base/ThemeToggle";

const primaryNav = [
  { label: "Discover Events", to: "/discover" },
  { label: "Categories", to: "/discover?view=categories" },
  { label: "How It Works", to: "/how-it-works" },
  { label: "For Organizers", to: "/organizer" },
];

const mobileNav = [
  { label: "Home", to: "/", icon: "ri-home-5-line", activeIcon: "ri-home-5-fill" },
  { label: "Discover", to: "/discover", icon: "ri-compass-3-line", activeIcon: "ri-compass-3-fill" },
  { label: "My Tickets", to: "/tickets", icon: "ri-ticket-2-line", activeIcon: "ri-ticket-2-fill" },
  { label: "Favorites", to: "/favorites", icon: "ri-heart-3-line", activeIcon: "ri-heart-3-fill" },
  { label: "Account", to: "/account", icon: "ri-user-3-line", activeIcon: "ri-user-3-fill" },
];

export function BrandMark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <Link to="/" className={cn("group flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
          tone === "dark" ? "bg-foreground-950 text-background-50" : "bg-white text-black"
        )}
      >
        <i className="ri-ticket-2-fill text-lg" />
        <span
          className={cn(
            "absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border",
            tone === "dark" ? "border-background-50 bg-accent-500" : "border-black/20 bg-white"
          )}
        />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-heading text-[17px] font-extrabold uppercase tracking-[0.08em]",
            tone === "dark" ? "text-foreground-950" : "text-white"
          )}
        >
          Dala
        </span>
        <span
          className={cn(
            "text-[9px] font-label font-bold uppercase tracking-[0.36em]",
            tone === "dark" ? "text-foreground-500" : "text-white/60"
          )}
        >
          Tickets
        </span>
      </span>
    </Link>
  );
}

type PublicLayoutProps = {
  children: ReactNode;
  transparentHeader?: boolean;
};

export default function PublicLayout({ children, transparentHeader = false }: PublicLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications } = useApp();
  const { user, profile } = useAuth();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const unread = notifications.filter((item) => !item.read).length;

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    navigate(`/discover?q=${encodeURIComponent(query)}`);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background-50">
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b",
          transparentHeader
            ? "border-white/10 bg-black/55 text-white backdrop-blur-md"
            : "border-background-200 bg-background-50/95 backdrop-blur-md"
        )}
      >
        <div className="mx-auto flex h-16 w-full items-center gap-3 px-4 md:h-[72px] md:px-6">
          <div className="flex min-w-0 items-center gap-8">
            <BrandMark tone={transparentHeader ? "light" : "dark"} />
            <nav className="hidden items-center gap-1 lg:flex">
              {primaryNav.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={cn(
                    "cursor-pointer whitespace-nowrap rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                    transparentHeader
                      ? "text-white/75 hover:bg-white/10 hover:text-white"
                      : "text-foreground-700 hover:bg-background-100 hover:text-foreground-950"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <form onSubmit={submitSearch} className="ml-auto hidden md:block">
            <div
              className={cn(
                "flex h-10 items-center gap-2 rounded-full border px-3",
                transparentHeader
                  ? "border-white/25 bg-white/10 text-white"
                  : "border-background-300 bg-background-100"
              )}
            >
              <i className="ri-search-line text-sm opacity-70" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search events, cities…"
                className={cn(
                  "w-36 bg-transparent text-[13px] outline-none lg:w-48",
                  transparentHeader ? "placeholder:text-white/50" : "placeholder:text-foreground-400"
                )}
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <Link
              to="/discover"
              className={cn(
                "flex h-9 w-9 cursor-pointer items-center justify-center rounded-md md:hidden",
                transparentHeader ? "text-white" : "text-foreground-700"
              )}
              aria-label="Search events"
            >
              <i className="ri-search-line text-lg" />
            </Link>

            {user ? (
              <Link
                to="/account"
                className={cn(
                  "hidden h-10 cursor-pointer items-center gap-2 rounded-full border pl-1 pr-3 md:inline-flex",
                  transparentHeader
                    ? "border-white/25 bg-white/10 text-white"
                    : "border-background-300 bg-background-100 text-foreground-900"
                )}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-background-50">
                  {initialsOf(profile?.full_name || user.email || "Dala")}
                </span>
                <span className="flex max-w-[104px] flex-col leading-tight">
                  <span className="truncate text-[12px] font-semibold">{profile?.full_name ?? "My account"}</span>
                  <span
                    className={cn(
                      "flex items-center gap-1 text-[9px] uppercase tracking-wider",
                      transparentHeader ? "text-white/60" : "text-foreground-500"
                    )}
                  >
                    {profile?.verified && <i className="ri-verified-badge-fill" />}
                    {profile?.verified ? "Verified" : profile?.role ?? "Member"}
                  </span>
                </span>
              </Link>
            ) : (
              <Link
                to="/signin"
                className={cn(
                  "hidden h-10 cursor-pointer items-center rounded-btn px-3 text-[13px] font-semibold md:inline-flex",
                  transparentHeader
                    ? "text-white hover:bg-white/10"
                    : "text-foreground-800 hover:bg-background-100"
                )}
              >
                Sign In
              </Link>
            )}

            <Link
              to="/organizer/events/new"
              className="hidden h-10 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-btn bg-primary-500 px-4 text-[13px] font-semibold text-background-50 transition-colors hover:bg-primary-600 md:inline-flex dark:text-foreground-50"
            >
              <i className="ri-add-line text-base" />
              Create Event
            </Link>

            <div className="relative hidden md:block">
              <Link
                to="/account"
                className={cn(
                  "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border",
                  transparentHeader
                    ? "border-white/25 bg-white/10 text-white"
                    : "border-background-300 bg-background-100 text-foreground-800"
                )}
                aria-label="Notifications"
              >
                <i className="ri-notification-3-line" />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary-500 ring-2 ring-background-50" />
                )}
              </Link>
            </div>

            <ThemeToggle overlay={transparentHeader} />

            <button
              onClick={() => setMenuOpen((open) => !open)}
              className={cn(
                "flex h-9 w-9 cursor-pointer items-center justify-center rounded-md lg:hidden",
                transparentHeader ? "text-white" : "text-foreground-800"
              )}
              aria-label="Open menu"
            >
              <i className={cn(menuOpen ? "ri-close-line" : "ri-menu-3-line", "text-xl")} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="animate-pop-in border-t border-background-200 bg-background-50 px-4 py-3 lg:hidden">
            <form onSubmit={submitSearch} className="mb-3 flex h-10 items-center gap-2 rounded-full border border-background-300 bg-background-100 px-3">
              <i className="ri-search-line text-sm text-foreground-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search events, cities…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-foreground-400"
              />
            </form>
            <div className="flex flex-col">
              {primaryNav.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="flex cursor-pointer items-center justify-between border-b border-background-100 py-3 text-sm font-medium text-foreground-800 last:border-0"
                >
                  {item.label}
                  <i className="ri-arrow-right-s-line text-foreground-400" />
                </Link>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                to={user ? "/account" : "/signin"}
                onClick={() => setMenuOpen(false)}
                className="flex h-10 cursor-pointer items-center justify-center rounded-btn border border-background-300 text-sm font-semibold text-foreground-800"
              >
                {user ? "My account" : "Sign In"}
              </Link>
              <Link
                to={user ? "/organizer/events/new" : "/signup"}
                onClick={() => setMenuOpen(false)}
                className="flex h-10 cursor-pointer items-center justify-center rounded-btn bg-primary-500 text-sm font-semibold text-background-50"
              >
                {user ? "Create Event" : "Create account"}
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="w-full pb-20 lg:pb-0">{children}</main>

      <Footer />

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-background-200 bg-background-50/98 backdrop-blur-md lg:hidden">
        <div className="safe-bottom mx-auto grid max-w-md grid-cols-5 px-1 py-1">
          {mobileNav.map((item) => {
            const isActive =
              item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-label font-semibold",
                  isActive ? "text-primary-700" : "text-foreground-500"
                )}
              >
                <span className={cn("flex h-6 w-6 items-center justify-center", isActive && "text-primary-600")}>
                  <i className={cn(isActive ? item.activeIcon : item.icon, "text-lg")} />
                </span>
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-secondary-200 bg-secondary-100">
      <div className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-10 md:px-6 md:py-14 lg:pb-14">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <BrandMark />
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-secondary-800">
              Kenya&apos;s ticketing marketplace for concerts, festivals, comedy and conferences.
              Discover events and manage tickets in one account. Online ticket payments are being connected.
            </p>
            <div className="mt-4 flex items-center gap-2">
              {["ri-instagram-line", "ri-twitter-x-line", "ri-facebook-circle-line", "ri-tiktok-line"].map((icon) => (
                <span
                  key={icon}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-secondary-300 text-secondary-800 hover:bg-background-50"
                >
                  <i className={cn(icon, "text-sm")} />
                </span>
              ))}
            </div>
          </div>
          <FooterCol
            title="Explore"
            links={[
              { label: "All events", to: "/discover" },
              { label: "Events by county", to: "/events-in-kenya" },
              { label: "Concerts", to: "/discover?category=Concerts" },
              { label: "Festivals", to: "/discover?category=Festivals" },
              { label: "Comedy nights", to: "/discover?category=Comedy" },
              { label: "Free events", to: "/discover?price=free" },
            ]}
          />
          <FooterCol
            title="Organizers"
            links={[
              { label: "How it works", to: "/how-it-works" },
              { label: "Organizer dashboard", to: "/organizer" },
              { label: "Create an event", to: "/organizer/events/new" },
              { label: "Gate scanner", to: "/scanner" },
              { label: "Admin console", to: "/admin" },
            ]}
          />
          <FooterCol
            title="Support"
            links={[
              { label: "Create an account", to: "/signup" },
              { label: "Sign in", to: "/signin" },
              { label: "Help centre", to: "/organizer/support" },
              { label: "Refund policy", to: "/discover" },
              { label: "Terms of use", to: "/discover" },
            ]}
          />
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t border-secondary-300 pt-5 text-[11px] text-secondary-800 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Dala Tickets Ltd — Nairobi, Kenya</p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Ticket payments coming soon</span>
            <span className="hidden sm:inline">·</span>
            <span>Demo environment — no live money movement</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <h4 className="mb-3 text-[11px] font-label font-bold uppercase tracking-[0.18em] text-secondary-900">
        {title}
      </h4>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              to={link.to}
              className="cursor-pointer whitespace-nowrap text-xs text-secondary-800 transition-colors hover:text-primary-700"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
