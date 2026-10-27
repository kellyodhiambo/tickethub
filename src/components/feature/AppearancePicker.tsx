import { cn } from "@/lib/helpers";
import { useTheme } from "@/store/ThemeProvider";

const options = [
  { id: "system", label: "System", icon: "ri-computer-line", hint: "Follow your device" },
  { id: "light", label: "Light", icon: "ri-sun-line", hint: "Paper + ink" },
  { id: "dark", label: "Dark", icon: "ri-moon-line", hint: "Charcoal + chalk" },
] as const;

export default function AppearancePicker() {
  const { preference, setPreference, theme } = useTheme();

  return (
    <div className="border-t border-background-200 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-foreground-950">Appearance</p>
          <p className="mt-0.5 text-[11px] text-foreground-500">
            Monochrome only, by design. Currently showing the {theme} palette.
          </p>
        </div>
        <span className="rounded-full border border-background-300 px-2 py-0.5 text-[10px] font-label uppercase tracking-[0.16em] text-foreground-600">
          {preference === "system" ? "Auto" : preference}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {options.map((option) => {
          const active = preference === option.id;
          return (
            <button
              key={option.id}
              onClick={() => setPreference(option.id)}
              className={cn(
                "cursor-pointer rounded-md border p-2.5 text-left transition-colors",
                active
                  ? "border-foreground-950 bg-foreground-950 text-background-50"
                  : "border-background-200 text-foreground-700 hover:border-foreground-400 hover:bg-background-100"
              )}
            >
              <span className="flex items-center gap-1.5">
                <i className={cn(option.icon, "text-sm")} />
                <span className="text-[11px] font-bold uppercase tracking-[0.1em]">{option.label}</span>
              </span>
              <span
                className={cn(
                  "mt-1 block text-[10px]",
                  active ? "text-background-50/60" : "text-foreground-500"
                )}
              >
                {option.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}