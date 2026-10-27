import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn, statusTone } from "@/lib/helpers";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger" | "accent";
  size?: "sm" | "md" | "lg";
  block?: boolean;
};

const buttonVariants: Record<string, string> = {
  primary: "bg-primary-500 text-background-50 hover:bg-primary-600",
  accent: "bg-accent-500 text-background-50 hover:bg-accent-600",
  secondary: "bg-secondary-800 text-background-50 hover:bg-secondary-900",
  outline: "border border-background-300 bg-background-50 text-foreground-900 hover:border-foreground-400 hover:bg-background-100",
  ghost: "text-foreground-700 hover:bg-background-100 hover:text-foreground-950",
  danger: "bg-primary-700 text-background-50 hover:bg-primary-800",
};

const buttonSizes: Record<string, string> = {
  sm: "h-9 px-3.5 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-sm",
};

export function Button({ variant = "primary", size = "md", block, className, children, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-btn font-label font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap",
        buttonVariants[variant],
        buttonSizes[size],
        block && "w-full",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-card border border-background-200 bg-background-50", className)}>
      {children}
    </div>
  );
}

const toneClasses: Record<string, string> = {
  success: "bg-accent-100 text-accent-900 border-accent-200",
  warning: "bg-primary-100 text-primary-900 border-primary-200",
  danger: "bg-primary-100 text-primary-800 border-primary-300",
  neutral: "bg-background-100 text-foreground-700 border-background-300",
};

export function Badge({
  children,
  tone,
  className,
  dot,
}: {
  children: ReactNode;
  tone?: string;
  className?: string;
  dot?: boolean;
}) {
  const resolved = tone ?? statusTone(String(children));
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-label font-semibold uppercase tracking-wide",
        toneClasses[resolved] ?? toneClasses.neutral,
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = "left",
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        align === "center" && "md:flex-col md:items-center md:text-center"
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
        {eyebrow && (
          <p className="mb-1.5 flex items-center gap-2 text-[9.5px] font-label font-bold uppercase tracking-[0.26em] text-foreground-500 md:mb-2 md:text-[10px]">
            <span className="h-px w-6 bg-foreground-400" />
            {eyebrow}
          </p>
        )}
        <h2 className={cn("text-xl font-bold leading-tight text-foreground-950 md:text-[32px]", align === "center" && "")}>{title}</h2>
        {subtitle && <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground-600 md:mt-2 md:text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "primary",
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: string;
  tone?: "primary" | "accent" | "secondary" | "foreground";
  trend?: string;
}) {
  const iconTone: Record<string, string> = {
    primary: "bg-primary-100 text-primary-700",
    accent: "bg-accent-100 text-accent-700",
    secondary: "bg-secondary-100 text-secondary-800",
    foreground: "bg-foreground-100 text-foreground-800",
  };
  return (
    <div className="rounded-card border border-background-200 bg-background-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-label font-semibold uppercase tracking-wider text-foreground-500">
          {label}
        </p>
        {icon && (
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-md", iconTone[tone])}>
            <i className={cn(icon, "text-sm")} />
          </span>
        )}
      </div>
      <p className="mt-2 font-num text-xl font-bold text-foreground-950 md:text-2xl">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {trend && (
          <span className="rounded-full bg-accent-100 px-1.5 py-0.5 text-[10px] font-bold text-accent-800">
            {trend}
          </span>
        )}
        {hint && <p className="text-[11px] text-foreground-500">{hint}</p>}
      </div>
    </div>
  );
}

export function EmptyState({
  icon = "ri-inbox-line",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-background-300 bg-background-50 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background-100 text-primary-600">
        <i className={cn(icon, "text-2xl")} />
      </span>
      <h3 className="mt-4 text-base font-semibold text-foreground-950">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-foreground-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Progress({ value, tone = "primary" }: { value: number; tone?: "primary" | "accent" | "foreground" }) {
  const bar: Record<string, string> = {
    primary: "bg-primary-500",
    accent: "bg-accent-500",
    foreground: "bg-foreground-800",
  };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-background-200">
      <div className={cn("h-full rounded-full", bar[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-label font-semibold text-foreground-700">
      {children}
    </label>
  );
}

const fieldBase =
  "w-full box-border rounded-field border border-background-300 bg-background-50 px-3 py-2.5 text-sm text-foreground-950 placeholder:text-foreground-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldBase, props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldBase, "cursor-pointer pr-8", props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldBase, "min-h-[96px] resize-y", props.className)} />;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-foreground-950/50 p-0 sm:items-center sm:p-6">
      <button aria-label="Close dialog" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 w-full animate-pop-in rounded-t-2xl border border-background-200 bg-background-50 sm:rounded-card",
          width
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-background-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-foreground-950">{title}</h3>
            {description && <p className="mt-1 text-xs text-foreground-600">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-foreground-500 hover:bg-background-100 hover:text-foreground-900"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-background-200 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-background-200", className)} />;
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-card border border-background-200 bg-background-50">
      <table className="w-full min-w-[720px] text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "whitespace-nowrap border-b border-background-200 bg-background-100 px-4 py-3 text-[11px] font-label font-bold uppercase tracking-wider text-foreground-500",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <td className={cn("border-b border-background-200 px-4 py-3 align-middle text-foreground-800", className)}>
      {children}
    </td>
  );
}