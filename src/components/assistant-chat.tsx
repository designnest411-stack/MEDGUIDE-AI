import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Activity,
  AlertTriangle,
  ArrowUp,
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  GitFork,
  RotateCcw,
  Sparkles,
  Square,
  Stethoscope,
  User,
} from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { ensureThread, newId, saveThread, type AssistantMessage } from "@/lib/assistant/threads";
import { getCitationUrl } from "@/lib/reports/clinical-report-parser";

interface SuggestionGroup {
  category: string;
  icon: typeof Stethoscope;
  prompts: string[];
}

const CLINICAL_SUGGESTIONS: SuggestionGroup[] = [
  {
    category: "Differential Reasoning",
    icon: GitFork,
    prompts: [
      "How are differential probabilities weighted across multi-agent consensus?",
      "What is the difference between Grounded and Reasoning-only claims?",
    ],
  },
  {
    category: "Biomedical Literature",
    icon: BookOpen,
    prompts: [
      "What do the T1 through T5 biomedical evidence tiers mean?",
      "How are PubMed citations validated to prevent hallucination?",
    ],
  },
  {
    category: "Drug Safety & Labs",
    icon: AlertTriangle,
    prompts: [
      "How does the Safety Agent screen for contraindicated medications?",
      "Explain how patient renal lab values impact drug dosage alerts.",
    ],
  },
  {
    category: "Imaging & Workflows",
    icon: Activity,
    prompts: [
      "How should I interpret the Grad-CAM activation heatmap on chest X-rays?",
      "How do I export an Epic-ready clinical consultation report?",
    ],
  },
];

export function AssistantChat({
  threadId,
  className,
  compact,
}: {
  threadId: string;
  className?: string;
  compact?: boolean;
}) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const page = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setMessages(ensureThread(threadId).messages);
    setError(null);
    setInput("");
    textareaRef.current?.focus();
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || pending) return;

      const userMsg: AssistantMessage = {
        id: newId(),
        role: "user",
        content: text,
        createdAt: Date.now(),
      };
      const next = [...messages, userMsg];
      setMessages(next);
      saveThread(threadId, next);
      setInput("");
      setError(null);
      setPending(true);

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page,
            messages: next.map((m) => ({ role: m.role, content: m.content })),
          }),
          signal: controller.signal,
        });
        const data = (await res.json()) as {
          text?: string;
          error?: string;
          model?: string;
          failovers?: number;
        };
        if (!res.ok || data.error) throw new Error(data.error ?? `Request failed (${res.status})`);
        const withReply = [
          ...next,
          {
            id: newId(),
            role: "assistant" as const,
            content: data.text?.trim() || "No response returned.",
            createdAt: Date.now(),
            model: data.model,
            failovers: data.failovers,
          },
        ];
        setMessages(withReply);
        saveThread(threadId, withReply);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message || "The assistant is unavailable right now.");
        }
      } finally {
        setPending(false);
        abortRef.current = null;
        textareaRef.current?.focus();
      }
    },
    [messages, page, pending, threadId],
  );

  const handleCopyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Clinical guidance copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearThread = () => {
    setMessages([]);
    saveThread(threadId, []);
    toast.info("Conversation cleared");
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col h-full", className)}>
      {/* Scrollable Message History */}
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
        {messages.length === 0 && (
          <div className="space-y-6 max-w-3xl mx-auto py-4">
            {/* Clinical Welcome Card */}
            <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card/80 to-card/60 p-5 sm:p-6 backdrop-blur-xl space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    MedGuide Clinical Decision Co-Pilot
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Audited biomedical knowledge, evidence calibration, and diagnostic support
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed pt-2">
                Ask how differential hypotheses are weighted, clarify evidence tiers (T1–T5), explore
                how contraindications are audited, or ask how to navigate patient workspaces.
              </p>
            </div>

            {/* Categorized Suggestion Grid */}
            <div className="space-y-4">
              <p className="font-mono text-[0.68rem] uppercase tracking-wider text-muted-foreground font-semibold">
                Suggested Clinical Prompts
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {CLINICAL_SUGGESTIONS.map((grp) => (
                  <div
                    key={grp.category}
                    className="rounded-xl border border-border/70 bg-card/40 p-3.5 space-y-2.5 backdrop-blur-md"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                      <grp.icon className="h-4 w-4" />
                      <span>{grp.category}</span>
                    </div>
                    <div className="space-y-1.5">
                      {grp.prompts.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => void send(p)}
                          className="w-full text-left rounded-lg border border-border/60 bg-card/50 p-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-card/80 transition-all leading-snug"
                        >
                          &ldquo;{p}&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Stream */}
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end gap-3 mt-4">
              <div className="max-w-[85%] space-y-1">
                <div className="rounded-2xl rounded-tr-xs bg-primary text-primary-foreground px-4 py-3 text-sm shadow-md">
                  {m.content}
                </div>
                <div className="flex items-center justify-end gap-2 text-[0.65rem] text-muted-foreground font-mono pr-1">
                  <span>Clinician</span>
                  <span>·</span>
                  <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30 mt-1">
                <User className="h-4 w-4" />
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex items-start gap-3 mt-6">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card border border-border/70 text-primary shadow-xs mt-1">
                <Sparkles className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                {/* Assistant Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xs font-bold text-foreground">
                      MedGuide Clinical Co-Pilot
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[0.62rem] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Grounded
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyMessage(m.id, m.content)}
                    className="flex items-center gap-1 text-[0.68rem] text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                    title="Copy guidance"
                  >
                    {copiedId === m.id ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-500" />
                        <span className="text-emerald-500 font-mono text-[0.65rem]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span className="font-mono text-[0.65rem]">Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Response Bubble */}
                <div className="rounded-2xl rounded-tl-xs bg-card/70 border border-border/70 p-4 sm:p-5 shadow-sm backdrop-blur-xl">
                  <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-foreground prose-headings:font-display prose-headings:font-bold prose-headings:text-foreground prose-p:my-2 prose-li:my-1 prose-code:text-primary prose-a:text-primary overflow-x-auto break-words">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p({ children }) {
                          return <p className="my-2 leading-relaxed">{renderChatTextWithCitations(children)}</p>;
                        },
                        li({ children }) {
                          return <li className="my-1">{renderChatTextWithCitations(children)}</li>;
                        },
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Engine telemetry footer */}
                <div className="flex items-center justify-between text-[0.65rem] text-muted-foreground font-mono px-1">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Verified Clinical Reasoning Cascade
                  </span>
                  {m.failovers && m.failovers > 0 ? (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-600 dark:text-amber-400">
                      Auto-Failover Active ({m.failovers})
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ),
        )}

        {/* Loading state */}
        {pending && (
          <div className="flex items-start gap-3 mt-6">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card border border-border/70 text-primary shadow-xs mt-1">
              <Sparkles className="h-4 w-4 animate-spin text-primary" />
            </div>
            <div className="rounded-2xl rounded-tl-xs bg-card/50 border border-border/60 px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
              <span className="font-mono uppercase tracking-wider text-[0.68rem] text-primary">
                Synthesizing biomedical evidence…
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-[0.65rem] underline font-mono"
            >
              Dismiss
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Docked Input Console */}
      <div className="border-t border-border/60 bg-card/40 p-3 sm:p-4 backdrop-blur-xl space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-end gap-2.5 rounded-xl border border-border/70 bg-card/80 p-2.5 shadow-inner focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 transition-all"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={compact ? 2 : 3}
            placeholder="Ask about patient differentials, evidence tiers, drug interactions, or clinical workflows..."
            className="min-h-0 flex-1 resize-none bg-transparent px-2 py-1 text-xs sm:text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />

          <div className="flex items-center gap-1.5 shrink-0">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearThread}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
                title="Clear current conversation"
                aria-label="Clear conversation"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}

            {pending ? (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-card text-muted-foreground hover:text-foreground transition-colors"
                title="Stop generation"
                aria-label="Stop generation"
              >
                <Square className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Send message (Enter)"
                aria-label="Send message"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        <div className="flex items-center justify-between text-[0.65rem] text-muted-foreground px-1">
          <span>Guidance only: not a diagnosis. Encrypted local browser session.</span>
          <span className="hidden sm:inline font-mono">Press Enter to send · Shift+Enter for newline</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders citation badges inside chat messages
 */
function renderChatTextWithCitations(children: React.ReactNode): React.ReactNode {
  if (typeof children === "string") {
    const parts = children.split(/(\[(?:pmid:\d+|fda:[\w\-]+|epmc:[\w\-]+)\])/gi);
    return parts.map((part, index) => {
      if (/^\[(pmid:\d+|fda:[\w\-]+|epmc:[\w\-]+)\]$/i.test(part)) {
        const { url, type } = getCitationUrl(part);
        const isFda = type === "fda";
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1 mx-0.5 font-mono text-[0.68rem] px-1.5 py-0.2 rounded border transition-colors",
              isFda
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20",
            )}
          >
            {part}
            <ExternalLink className="h-2.5 w-2.5 opacity-70" />
          </a>
        );
      }
      return part;
    });
  }
  if (Array.isArray(children)) {
    return children.map((c, idx) => (
      <span key={idx}>{typeof c === "string" ? renderChatTextWithCitations(c) : c}</span>
    ));
  }
  return children;
}
