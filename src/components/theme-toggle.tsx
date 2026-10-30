import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  collapsed?: boolean;
}

export function ThemeToggle({ className, collapsed = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        title={isDark ? "Switch to light theme" : "Switch to dark theme"}
        className={cn(
          "relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-border/70 bg-card/80 text-foreground shadow-xs backdrop-blur-md transition-all duration-200 ease-out hover:border-primary/40 hover:bg-card hover:text-primary active:scale-90",
          className,
        )}
      >
        {isDark ? (
          <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
        ) : (
          <Moon className="h-4 w-4 text-primary transition-transform duration-300 hover:-rotate-12" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "group flex w-full cursor-pointer items-center justify-between rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-xs font-medium text-foreground shadow-xs backdrop-blur-md transition-all duration-200 ease-out hover:border-primary/40 hover:bg-card hover:text-primary active:scale-[0.98]",
        className,
      )}
    >
      <span className="flex items-center gap-2.5">
        {isDark ? (
          <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
        ) : (
          <Moon className="h-4 w-4 text-primary transition-transform duration-300 group-hover:-rotate-12" />
        )}
        <span className="font-medium">{isDark ? "Dark Appearance" : "Light Appearance"}</span>
      </span>
      <span className="rounded-full border border-border/60 bg-secondary/80 px-2 py-0.5 font-mono text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
}
