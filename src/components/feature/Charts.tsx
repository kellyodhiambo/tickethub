import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axisStyle = { fontSize: 10, fill: "oklch(var(--foreground-500))" } as const;

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid oklch(var(--background-300))",
  backgroundColor: "oklch(var(--background-50))",
  fontSize: 12,
  color: "oklch(var(--foreground-950))",
  padding: "8px 10px",
} as const;

export function SalesAreaChart({
  data,
  dataKey = "sales",
  height = 220,
  valuePrefix = "KSh ",
}: {
  data: { label: string; sales?: number; gmv?: number; commission?: number; [key: string]: string | number | undefined }[];
  dataKey?: string;
  height?: number;
  valuePrefix?: string;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(var(--primary-500))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="oklch(var(--primary-500))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--background-200))" vertical={false} />
          <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: unknown) => `${valuePrefix}${Number(value ?? 0).toLocaleString("en-KE")}`}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="oklch(var(--primary-500))"
            strokeWidth={2}
            fill="url(#salesFill)"
            dot={false}
            activeDot={{ r: 4, fill: "oklch(var(--primary-600))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const barColors: Record<string, string> = {
  primary: "oklch(var(--primary-500))",
  accent: "oklch(var(--accent-500))",
  secondary: "oklch(var(--secondary-700))",
  foreground: "oklch(var(--foreground-800))",
};

export function CategoryBarChart({
  data,
  height = 220,
}: {
  data: { label: string; value: number; color?: string }[];
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--background-200))" vertical={false} />
          <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: unknown) => `KSh ${Number(value ?? 0).toLocaleString("en-KE")}`}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={46}>
            {data.map((item) => (
              <Cell key={item.label} fill={barColors[item.color ?? "primary"] ?? barColors.primary} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DualAreaChart({
  data,
  height = 240,
}: {
  data: { label: string; gmv: number; commission: number }[];
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="gmvFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(var(--accent-500))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="oklch(var(--accent-500))" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="commissionFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(var(--primary-500))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="oklch(var(--primary-500))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--background-200))" vertical={false} />
          <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => `${Math.round(value / 1_000_000)}M`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: unknown) => `KSh ${Number(value ?? 0).toLocaleString("en-KE")}`}
          />
          <Area type="monotone" dataKey="gmv" stroke="oklch(var(--accent-600))" strokeWidth={2} fill="url(#gmvFill)" dot={false} />
          <Area
            type="monotone"
            dataKey="commission"
            stroke="oklch(var(--primary-500))"
            strokeWidth={2}
            fill="url(#commissionFill)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}