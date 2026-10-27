import { Button } from "@/components/base/ui";

export function DataLoading({ label = "Loading events" }: { label?: string }) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-16 md:px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background-100">
          <i className="ri-loader-4-line animate-spin text-lg text-primary-600" />
        </span>
        <p className="text-sm font-semibold text-foreground-800">{label}…</p>
        <p className="text-xs text-foreground-500">Fetching the latest list from your database.</p>
      </div>
    </div>
  );
}

export function DataError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-16 md:px-6">
      <div className="mx-auto max-w-md rounded-card border border-accent-200 bg-accent-50 p-5 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent-100">
          <i className="ri-error-warning-line text-lg text-accent-800" />
        </span>
        <p className="mt-3 text-sm font-bold text-accent-900">We could not load live events</p>
        <p className="mt-1 text-xs leading-relaxed text-accent-900/80">{message}</p>
        <Button className="mt-4" size="sm" onClick={onRetry}>
          <i className="ri-refresh-line" /> Try again
        </Button>
      </div>
    </div>
  );
}