import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { GlassCard } from "@/components/medical-ui";
import { Button } from "@/components/ui/button";
import { AssistantChat } from "@/components/assistant-chat";
import {
  createThread,
  deleteThread,
  ensureThread,
  listThreads,
  newId,
  useThreads,
} from "@/lib/assistant/threads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assistant/$threadId")({
  head: () => ({
    meta: [
      { title: "Ask MedGuide : Conversation" },
      {
        name: "description",
        content:
          "A saved conversation with the MedGuide guide: interpret differentials, evidence tiers, safety findings and platform workflows.",
      },
      { property: "og:title", content: "Ask MedGuide : Conversation" },
      {
        property: "og:description",
        content: "Saved guidance conversation about clinical results and platform usage.",
      },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <AppShell title="Ask MedGuide" subtitle="Clinical guidance assistant">
      <GlassCard className="p-8 text-center">
        <h2 className="text-lg font-semibold text-destructive">Assistant Conversation Error</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {(error as Error)?.message || "Failed to load assistant conversation."}
        </p>
        <Button onClick={reset} className="mt-4" size="sm">
          Retry Conversation
        </Button>
      </GlassCard>
    </AppShell>
  ),
  component: AssistantThreadPage,
});

function AssistantThreadPage() {
  const { threadId } = useParams({ from: "/assistant/$threadId" });
  const { threads } = useThreads();
  const navigate = useNavigate();

  useEffect(() => {
    ensureThread(threadId);
  }, [threadId]);

  return (
    <AppShell
      kicker="Module 15 / Guide"
      title="Ask MedGuide"
      subtitle="Interpret results and learn the platform: conversations stay in this browser"
      actions={
        <button
          type="button"
          onClick={() => {
            const t = createThread(newId());
            void navigate({ to: "/assistant/$threadId", params: { threadId: t.id } });
          }}
          className="flex items-center gap-1.5 rounded-md border border-border/70 px-2.5 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> New
        </button>
      }
      wide
    >
      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden rounded-lg border border-border/70 bg-card/30 lg:block">
          <p className="border-b border-border/70 px-3 py-2 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-muted-foreground">
            Conversations
          </p>
          <div className="max-h-[60vh] overflow-y-auto">
            {threads.length === 0 && (
              <p className="px-3 py-3 text-xs text-muted-foreground">No conversations yet.</p>
            )}
            {threads.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "flex items-center gap-2 border-b border-border/40 px-3 py-2 last:border-0",
                  t.id === threadId && "bg-primary/10",
                )}
              >
                <Link
                  to="/assistant/$threadId"
                  params={{ threadId: t.id }}
                  className="min-w-0 flex-1 truncate text-xs text-foreground hover:text-primary"
                >
                  {t.title}
                </Link>
                <button
                  type="button"
                  aria-label="Delete conversation"
                  onClick={() => {
                    deleteThread(t.id);
                    if (t.id === threadId) {
                      const next = listThreads()[0]?.id ?? createThread().id;
                      void navigate({ to: "/assistant/$threadId", params: { threadId: next } });
                    }
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <section className="flex h-[70vh] min-h-0 flex-col rounded-lg border border-border/70 bg-card/30">
          <AssistantChat key={threadId} threadId={threadId} />
        </section>
      </div>
    </AppShell>
  );
}
