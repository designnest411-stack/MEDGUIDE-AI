import { useSyncExternalStore } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { consultRunStore } from "@/lib/consult-run-store";

/**
 * Floating indicator shown while a consultation is streaming.
 * The run lives in a module-level store, so navigating away never stops it.
 */
export function ConsultRunIndicator() {
  const state = useSyncExternalStore(
    consultRunStore.subscribe,
    consultRunStore.getSnapshot,
    consultRunStore.getServerSnapshot,
  );
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!state.running || pathname === "/consultation") return null;

  const active = Object.entries(state.statuses).find(([, v]) => v.status === "running");

  return (
    <Link
      to="/consultation"
      className="fixed bottom-16 right-4 sm:bottom-24 sm:right-5 z-50 flex max-w-[14rem] sm:max-w-[15rem] items-center gap-2 rounded-full border border-primary/40 bg-card/95 px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-lg backdrop-blur transition-colors hover:border-primary active:scale-95 touch-manipulation"
    >
      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
      <span className="min-w-0">
        <span className="block font-mono text-[0.58rem] sm:text-[0.6rem] uppercase tracking-[0.16em] text-primary">
          Agents running
        </span>
        <span className="block truncate text-[0.65rem] sm:text-[0.68rem] text-muted-foreground">
          {active ? active[0].replace(/-/g, " ") : "streaming…"}
        </span>
      </span>
    </Link>
  );
}
