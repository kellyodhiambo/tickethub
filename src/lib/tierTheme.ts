export type TierTone = "gold" | "forest" | "crimson" | "ink";

const RULES: { tone: TierTone; test: RegExp }[] = [
  { tone: "crimson", test: /(vvip|table|box|backstage|lodge|cabin)/ },
  { tone: "gold", test: /(vip|premium|lounge|front row|pavilion|hospitality)/ },
  { tone: "forest", test: /(early|advance|student|free|supporter|day pass|terrace|garden|community)/ },
];

export function tierTone(name: string): TierTone {
  const value = name.toLowerCase();
  const match = RULES.find((rule) => rule.test.test(value));
  return match?.tone ?? "ink";
}

export function tierTheme(name: string) {
  const tone = tierTone(name);
  return { tone, root: `tier-${tone}` };
}

export const tierLegend = [
  { root: "tier-forest", label: "Advance / free" },
  { root: "tier-ink", label: "Standard" },
  { root: "tier-gold", label: "VIP" },
  { root: "tier-crimson", label: "Tables & VVIP" },
];