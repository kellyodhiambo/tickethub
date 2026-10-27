export const cn = (...values: (string | false | null | undefined)[]) =>
  values.filter(Boolean).join(" ");

export const formatKsh = (value: number, options?: { compact?: boolean }) => {
  if (options?.compact) {
    if (Math.abs(value) >= 1_000_000_000) return `KSh ${(value / 1_000_000_000).toFixed(1)}B`;
    if (Math.abs(value) >= 1_000_000) return `KSh ${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `KSh ${(value / 1_000).toFixed(1)}k`;
  }
  return `KSh ${value.toLocaleString("en-KE")}`;
};

export const formatNumber = (value: number) => value.toLocaleString("en-KE");

export const formatEventDate = (iso: string, withYear = true) => {
  const date = new Date(`${iso}T09:00:00`);
  return date.toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
};

export const formatShortDate = (iso: string) => {
  const date = new Date(`${iso}T09:00:00`);
  return date.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
};

export const dayName = (iso: string) =>
  new Date(`${iso}T09:00:00`).toLocaleDateString("en-KE", { weekday: "long" });

export const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export const makeReference = () =>
  `DLA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const makeTicketCode = (reference: string, tier: string, index: number) => {
  const tierCode = tier.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase();
  return `${reference}-${tierCode}-${String(index).padStart(2, "0")}`;
};

export const statusTone = (status: string) => {
  const value = status.toLowerCase();
  if (["paid", "completed", "verified", "active", "valid", "approved", "published", "settled"].includes(value))
    return "success";
  if (["pending", "processing", "under review", "invited", "pending settlement", "open"].includes(value))
    return "warning";
  if (["failed", "rejected", "cancelled", "suspended", "flagged", "invalid", "revoked", "escalated"].includes(value))
    return "danger";
  if (["refunded", "adjusted", "used", "paused", "sold out", "draft"].includes(value)) return "neutral";
  return "neutral";
};