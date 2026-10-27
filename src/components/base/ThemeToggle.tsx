import { cn } from "@/lib/helpers";
import { useTheme } from "@/store/ThemeProvider";

export default function ThemeToggle({
  overlay = false,
  className,
}: {
  overlay?: boolean;
  className?: string;
}) {
  const { theme, toggle } = useTheme();
  const goingDark = theme !== "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={goingDark ? "Switch to dark theme" : "Switch to light theme"}
      title={goingDark ? "Dark theme" : "Light theme"}
      className={cn(
        "flex h-9 w-9 flex-none cursor-pointer items-center justify-center rounded-full border transition-colors duration-200",
        overlay
          ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
          : "border-background-300 bg-background-50 text-foreground-800 hover:bg-background-100 hover:text-foreground-950",
        className
      )}
    >
      <i className={cn(goingDark ? "ri-moon-line" : "ri-sun-line", "text-[15px]")} />
    </button>
  );
}