import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Sparkles, MessageSquareText, Plus, Trash2, X, Maximize2, History, Bot } from "lucide-react";

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
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center gap-3">
          {/* Circular AI Assistant Orb Launcher */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-600 via-primary to-sky-400 text-white shadow-2xl shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation ai-orb-glow float-slow"
            aria-label="Open MedGuide Clinical Assistant"
          >
            {/* Glowing radar ping effect */}
            <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary to-cyan-400 opacity-60 blur-sm group-hover:opacity-100 transition-opacity" />
            <span className="absolute inset-0 rounded-full border border-cyan-300/40 animate-ping opacity-30 pointer-events-none" />

            {/* Icon stack with sparkles */}
            <div className="relative z-10 flex items-center justify-center">
              <Bot className="h-6 w-6 sm:h-7 sm:w-7 drop-shadow-md transition-transform duration-300 group-hover:rotate-6" />
              <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-cyan-200 animate-pulse drop-shadow" />
            </div>

            {/* Active AI Status Indicator Dot */}
            <span className="absolute bottom-1 right-1 z-20 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-background ring-2 ring-background">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </span>
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex h-[85vh] sm:h-[min(82vh,660px)] w-full sm:w-[440px] sm:max-w-[440px] sm:bottom-6 sm:right-6 sm:left-auto flex-col overflow-hidden border-t sm:border border-border/70 bg-background/95 shadow-2xl backdrop-blur-2xl rounded-t-2xl sm:rounded-2xl pb-[env(safe-area-inset-bottom)] animate-in zoom-in-95 fade-in-0 slide-in-from-bottom-6 duration-200">
          <header className="flex items-center gap-2 border-b border-border/70 px-4 py-3 bg-card/60 backdrop-blur-md">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-xs text-foreground">
                  Ask MedGuide
                </p>
                <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[0.6rem] font-medium text-emerald-600 dark:text-emerald-400">
                  Clinical Copilot
                </span>
              </div>
              <p className="truncate text-[0.7rem] text-muted-foreground">
                {threads.find((t) => t.id === activeId)?.title ?? "New clinical conversation"}
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

          {showList && (
            <div className="max-h-56 overflow-y-auto border-b border-border/70 bg-card/40">
              {threads.length === 0 && (
                <p className="px-4 py-3 text-xs text-muted-foreground">No saved conversations yet.</p>
              )}
              {threads.map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    "flex items-center gap-2 border-b border-border/40 px-3.5 py-2 last:border-0 hover:bg-muted/40 transition-colors",
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
                    open
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
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-all hover:border-primary/40 hover:bg-muted/60 hover:text-foreground touch-manipulation active:scale-95"
    >
      {children}
    </button>
  );
}
