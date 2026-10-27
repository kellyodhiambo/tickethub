import { useApp } from "@/store/AppStore";
import { cn } from "@/lib/helpers";

export function Toaster() {
  const { toasts, dismissToast } = useApp();
  if (!toasts.length) return null;
  const tones: Record<string, string> = {
    success: "border-accent-300 bg-accent-50 text-accent-900",
    danger: "border-primary-300 bg-primary-50 text-primary-900",
    warning: "border-primary-300 bg-primary-50 text-primary-900",
    info: "border-background-300 bg-background-50 text-foreground-900",
  };
  const icons: Record<string, string> = {
    success: "ri-checkbox-circle-fill",
    danger: "ri-error-warning-fill",
    warning: "ri-alert-fill",
    info: "ri-information-fill",
  };
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:px-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex w-full max-w-sm animate-slide-in items-start gap-2.5 rounded-card border px-3.5 py-3 text-sm",
            tones[toast.tone]
          )}
        >
          <i className={cn(icons[toast.tone], "mt-0.5 text-base")} />
          <p className="flex-1 leading-snug">{toast.message}</p>
          <button
            onClick={() => dismissToast(toast.id)}
            className="cursor-pointer text-current opacity-50 hover:opacity-100"
            aria-label="Dismiss"
          >
            <i className="ri-close-line" />
          </button>
        </div>
      ))}
    </div>
  );
}