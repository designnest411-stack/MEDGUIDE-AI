import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { MessageSquareText, Plus, Trash2, X, Maximize2 } from "lucide-react";

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
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-primary/40 bg-primary px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-95 hover:scale-[1.03] touch-manipulation"
          aria-label="Open MedGuide Assistant"
        >
          <MessageSquareText className="h-4 w-4" />
          <span className="hidden sm:inline font-medium">Ask MedGuide</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex h-[85vh] sm:h-[min(80vh,640px)] w-full sm:w-[420px] sm:max-w-[420px] sm:bottom-5 sm:right-5 sm:left-auto flex-col overflow-hidden border-t sm:border border-border/70 bg-background/95 shadow-2xl backdrop-blur-xl rounded-t-2xl sm:rounded-xl pb-[env(safe-area-inset-bottom)]">
          <header className="flex items-center gap-2 border-b border-border/70 px-3.5 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-primary/80">
                MedGuide Guide
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {threads.find((t) => t.id === activeId)?.title ?? "New conversation"}
              </p>
            </div>
            <IconBtn label="Conversations" onClick={() => setShowList((v) => !v)}>
              <span className="font-mono text-[0.65rem]">{threads.length || 0}</span>
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
            <IconBtn label="Close" onClick={() => setOpen(false)}>
              <X className="h-3.5 w-3.5" />
            </IconBtn>
          </header>

          {showList && (
            <div className="max-h-56 overflow-y-auto border-b border-border/70">
              {threads.length === 0 && (
                <p className="px-3 py-3 text-xs text-muted-foreground">No conversations yet.</p>
              )}
              {threads.map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    "flex items-center gap-2 border-b border-border/40 px-3 py-2 last:border-0",
                    t.id === activeId && "bg-primary/10",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveId(t.id);
                      setShowList(false);
                    }}
                    className="min-w-0 flex-1 truncate text-left text-xs text-foreground"
                  >
                    {t.title}
                  </button>
                  <Link
                    to="/assistant/$threadId"
                    params={{ threadId: t.id }}
                    className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-muted-foreground hover:text-primary"
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
                    className="text-muted-foreground hover:text-destructive p-1"
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
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground touch-manipulation"
    >
      {children}
    </button>
  );
}
