import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  History,
  Maximize2,
  MessageSquareText,
  Plus,
  Sparkles,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";

import { AssistantChat } from "@/components/assistant-chat";
import {
  createThread,
  deleteThread,
  listThreads,
  newId,
  useThreads,
} from "@/lib/assistant/threads";
import { cn } from "@/lib/utils";

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const { threads } = useThreads();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const onAssistantPage = path.startsWith("/assistant");

  useEffect(() => {
    if (!open || activeId) return;
    const existing = listThreads()[0];
    setActiveId(existing ? existing.id : createThread().id);
  }, [open, activeId]);

  if (onAssistantPage) return null;

  return (
    <>
      {!open && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center">
          {/* Executive Clinical Co-Pilot Launcher */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group relative flex items-center gap-3 rounded-full bg-slate-900/92 dark:bg-slate-950/92 text-white pl-3 pr-4 py-2.5 sm:pl-3.5 sm:pr-5 sm:py-2.5 border border-cyan-500/35 shadow-[0_8px_32px_rgba(8,145,178,0.35)] backdrop-blur-2xl transition-all duration-300 hover:border-cyan-400 hover:scale-105 active:scale-95 touch-manipulation hover:shadow-[0_12px_40px_rgba(8,145,178,0.5)] cursor-pointer"
            aria-label="Open MedGuide Clinical Co-Pilot"
          >
            {/* Ambient luminous glow halo */}
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-cyan-500 via-primary to-sky-400 opacity-30 blur-xs group-hover:opacity-75 transition-opacity" />

            {/* Precision Medical AI Icon Stack */}
            <div className="relative z-10 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-primary text-white shadow-md shadow-primary/40 shrink-0">
              <Stethoscope className="h-4.5 w-4.5 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:scale-110" />
              <Sparkles className="absolute -top-0.5 -right-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5 text-cyan-200 animate-pulse" />

              {/* Live Medical Telemetry Dot */}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-slate-950 ring-2 ring-slate-950 flex items-center justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </span>
            </div>

            {/* Authoritative Clinical Co-Pilot Typography */}
            <div className="relative z-10 text-left leading-tight pr-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-xs sm:text-sm font-bold tracking-tight text-white group-hover:text-cyan-200 transition-colors">
                  Ask MedGuide
                </span>
                <span className="hidden sm:inline-flex rounded-full bg-cyan-500/20 border border-cyan-400/30 px-1.5 py-0.2 text-[0.6rem] font-mono font-medium text-cyan-300">
                  AI Co-Pilot
                </span>
              </div>
              <p className="text-[0.65rem] sm:text-[0.68rem] text-slate-400 group-hover:text-slate-300 transition-colors">
                Clinical Decision Support
              </p>
            </div>
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex h-[85vh] sm:h-[min(82vh,680px)] w-full sm:w-[460px] sm:max-w-[460px] sm:bottom-6 sm:right-6 sm:left-auto flex-col overflow-hidden border-t sm:border border-border/80 bg-background/95 shadow-2xl backdrop-blur-2xl rounded-t-2xl sm:rounded-2xl pb-[env(safe-area-inset-bottom)] animate-in zoom-in-95 fade-in-0 slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <header className="flex items-center gap-2.5 border-b border-border/70 px-4 py-3 bg-card/70 backdrop-blur-md">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-primary/20 text-primary ring-1 ring-primary/30 shrink-0">
              <Stethoscope className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-display font-bold text-xs text-foreground">
                  Ask MedGuide
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.2 text-[0.6rem] font-mono text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Grounded
                </span>
              </div>
              <p className="truncate text-[0.68rem] text-muted-foreground">
                {threads.find((t) => t.id === activeId)?.title ?? "Clinical Guidance Session"}
              </p>
            </div>

            <IconBtn label="Conversation history" onClick={() => setShowList((v) => !v)}>
              <History className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn
              label="New conversation"
              onClick={() => {
                const t = createThread(newId());
                setActiveId(t.id);
                setShowList(false);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn
              label="Open full page"
              onClick={() => {
                setOpen(false);
                if (activeId)
                  void navigate({ to: "/assistant/$threadId", params: { threadId: activeId } });
              }}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn label="Close assistant" onClick={() => setOpen(false)}>
              <X className="h-3.5 w-3.5" />
            </IconBtn>
          </header>

          {/* Saved Discussions Dropdown */}
          {showList && (
            <div className="max-h-56 overflow-y-auto border-b border-border/70 bg-card/60 p-1.5 space-y-1">
              {threads.length === 0 && (
                <p className="px-4 py-3 text-xs text-muted-foreground text-center">No saved conversations yet.</p>
              )}
              {threads.map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 hover:bg-muted/50 transition-colors",
                    t.id === activeId && "bg-primary/10 border-primary/30",
                  )}
                >
                  <MessageSquareText className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                  <button
                    type="button"
                    onClick={() => {
                      setActiveId(t.id);
                      setShowList(false);
                    }}
                    className="min-w-0 flex-1 truncate text-left text-xs font-medium text-foreground"
                  >
                    {t.title}
                  </button>
                  <Link
                    to="/assistant/$threadId"
                    params={{ threadId: t.id }}
                    className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground hover:text-primary px-1"
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    aria-label="Delete conversation"
                    onClick={() => {
                      deleteThread(t.id);
                      if (t.id === activeId) setActiveId(listThreads()[0]?.id ?? createThread().id);
                    }}
                    className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeId && <AssistantChat key={activeId} threadId={activeId} compact />}
        </div>
      )}
    </>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-all hover:border-primary/40 hover:bg-muted/60 hover:text-foreground touch-manipulation active:scale-95 cursor-pointer"
    >
      {children}
    </button>
  );
}
