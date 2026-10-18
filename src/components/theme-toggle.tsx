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
          "flex h-8 w-8 items-center justify-center rounded-md border border-sidebar-border/80 bg-sidebar-accent/50 text-foreground transition-colors hover:bg-sidebar-accent hover:text-primary",
          className,
        )}
      >
        {isDark ? (
          <Sun className="h-4 w-4 text-amber-400" />
        ) : (
          <Moon className="h-4 w-4 text-primary" />
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
        "flex w-full items-center justify-between rounded-md border border-sidebar-border/80 bg-sidebar-accent/50 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-sidebar-accent hover:text-primary",
        className,
      )}
    >
      <span className="flex items-center gap-2">
        {isDark ? (
          <Sun className="h-3.5 w-3.5 text-amber-400" />
        ) : (
          <Moon className="h-3.5 w-3.5 text-primary" />
        )}
        <span>{isDark ? "Dark Theme" : "Light Theme"}</span>
      </span>
      <span className="rounded bg-background/60 px-1.5 py-0.5 text-[0.65rem] text-muted-foreground uppercase font-mono">
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
}
