import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DISCLAIMER } from "@/lib/agents/types";
import { cn } from "@/lib/utils";

interface AppShellProps {
  title: string;
  subtitle?: string;
  /** Short mono kicker above the title, e.g. "Module 04 / Intelligence". */
  kicker?: string;
  actions?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}

export function AppShell({ title, subtitle, kicker, actions, children, wide }: AppShellProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
              <SidebarTrigger className="shrink-0" />
              <div className="min-w-0">
                {kicker && (
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-primary/80">
                    {kicker}
                  </p>
                )}
                <h1 className="truncate font-display text-lg font-semibold tracking-tight sm:text-xl">
                  {title}
                </h1>
                {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">{actions}</div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 animate-in fade-in duration-200 ease-out">
            <div className={cn("mx-auto w-full", wide ? "max-w-[1600px]" : "max-w-6xl")}>
              {children}
            </div>
          </main>

          <footer className="border-t border-border/70 px-4 py-3 sm:px-6">
            <p className="mx-auto flex max-w-6xl items-start gap-2 text-[0.7rem] leading-relaxed text-muted-foreground">
              <ShieldAlert className="mt-px h-3.5 w-3.5 shrink-0 text-warning" />
              <span>Decision support only — not a diagnosis. {DISCLAIMER}</span>
            </p>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
