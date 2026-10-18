import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  MessageSquare,
  MessageSquarePlus,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { GlassCard } from "@/components/medical-ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      { title: "Ask MedGuide : Clinical Co-Pilot" },
      {
        name: "description",
        content:
          "Conversational clinical decision support co-pilot: interpret differentials, evidence tiers, safety findings, and biomedical workflows.",
      },
      { property: "og:title", content: "Ask MedGuide : Clinical Co-Pilot" },
      {
        property: "og:description",
        content: "Interactive clinical guidance co-pilot with verified evidence grounding.",
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
  const [search, setSearch] = useState("");

  useEffect(() => {
    ensureThread(threadId);
  }, [threadId]);

  const filteredThreads = useMemo(() => {
    if (!search.trim()) return threads;
    const q = search.toLowerCase();
    return threads.filter((t) => t.title.toLowerCase().includes(q));
  }, [threads, search]);

  const handleNewThread = () => {
    const t = createThread(newId());
    void navigate({ to: "/assistant/$threadId", params: { threadId: t.id } });
  };

  return (
    <AppShell
      kicker="Biomedical Co-Pilot"
      title="Ask MedGuide"
      subtitle="Interactive clinical decision support: clarify differentials, evaluate evidence tiers, and navigate complex patient cases"
      actions={
        <Button
          size="sm"
          onClick={handleNewThread}
          className="gap-1.5 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" /> New Discussion
        </Button>
      }
      wide
    >
      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Left Sidebar: Saved Consultations & Threads */}
        <GlassCard className="hidden lg:flex flex-col h-[calc(100vh-140px)] min-h-[580px] overflow-hidden">
          <div className="p-3 border-b border-border/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  Saved Threads
                </span>
              </div>
              <Badge variant="outline" className="text-[0.62rem] font-mono border-primary/30 text-primary">
                {threads.length}
              </Badge>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleNewThread}
              className="w-full justify-start gap-2 h-8 text-xs border-dashed hover:border-primary/50 hover:bg-primary/5"
            >
              <MessageSquarePlus className="h-3.5 w-3.5 text-primary" />
              <span>New Conversation</span>
            </Button>

            {/* Quick search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3 w-3 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-md border border-border/70 bg-card/50 pl-7 pr-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
              />
            </div>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredThreads.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                {search ? "No matching conversations." : "No saved conversations yet."}
              </p>
            ) : (
              filteredThreads.map((t) => {
                const isActive = t.id === threadId;
                const msgCount = t.messages.length;
                return (
                  <div
                    key={t.id}
                    className={cn(
                      "group flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition-all duration-200 cursor-pointer border",
                      isActive
                        ? "border-primary/50 bg-primary/10 shadow-xs"
                        : "border-transparent bg-transparent hover:border-border/60 hover:bg-card/60",
                    )}
                  >
                    <Link
                      to="/assistant/$threadId"
                      params={{ threadId: t.id }}
                      className="min-w-0 flex-1 space-y-0.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <Sparkles
                          className={cn(
                            "h-3 w-3 shrink-0",
                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                          )}
                        />
                        <p
                          className={cn(
                            "truncate text-xs font-medium leading-snug",
                            isActive ? "text-foreground font-semibold" : "text-muted-foreground group-hover:text-foreground",
                          )}
                        >
                          {t.title || "Clinical Discussion"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pl-4 text-[0.62rem] text-muted-foreground font-mono">
                        <span>{new Date(t.updatedAt).toLocaleDateString()}</span>
                        {msgCount > 0 && <span>· {msgCount} msg{msgCount > 1 ? "s" : ""}</span>}
                      </div>
                    </Link>

                    <button
                      type="button"
                      aria-label="Delete conversation"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteThread(t.id);
                        if (t.id === threadId) {
                          const next = listThreads()[0]?.id ?? createThread().id;
                          void navigate({ to: "/assistant/$threadId", params: { threadId: next } });
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground transition-opacity hover:text-destructive rounded"
                      title="Delete thread"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>

        {/* Right Section: Chat Interface */}
        <section className="flex h-[calc(100vh-140px)] min-h-[580px] min-w-0 flex-col rounded-2xl border border-border/80 bg-card/60 shadow-sm backdrop-blur-xl overflow-hidden">
          <AssistantChat key={threadId} threadId={threadId} />
        </section>
      </div>
    </AppShell>
  );
}
