import { cn } from "@/lib/helpers";

/**
 * Small, unobtrusive partner reminder shown after a ticket is confirmed.
 * Staying near the venue is the natural next thing an attendee needs.
 */
export default function StayReminder({
  eventTitle,
  eventCity,
  className,
}: {
  eventTitle?: string;
  eventCity?: string;
  className?: string;
}) {
  return (
    <a
      href="https://nyumbanilink.com"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-start gap-2.5 rounded-md border border-background-200 bg-background-100 p-3 transition-colors hover:border-foreground-400 hover:bg-background-200/60",
        className
      )}
    >
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md border border-background-200 bg-background-50 text-foreground-800">
        <i className="ri-hotel-bed-line text-sm" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold text-foreground-950">
          Need a place to stay{eventCity ? ` in ${eventCity}` : ""}?
        </span>
        <span className="mt-0.5 block text-[10.5px] leading-relaxed text-foreground-600">
          {eventTitle ? `Travelling for ${eventTitle}? ` : ""}
          Book Airbnbs and hotels near the venue on nyumbanilink.com.
        </span>
        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-primary-700">
          nyumbanilink.com
          <i className="ri-arrow-right-up-line transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
    </a>
  );
}