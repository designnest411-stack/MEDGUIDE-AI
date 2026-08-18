import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, Square } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { ensureThread, newId, saveThread, type AssistantMessage } from "@/lib/assistant/threads";

const SUGGESTIONS = [
  "How do I read the differentials tab?",
  "What do the T1–T5 evidence tiers mean?",
  "Walk me through running my first consultation",
  "Why did confidence come back as insufficient evidence?",
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
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok || data.error) throw new Error(data.error ?? `Request failed (${res.status})`);
        const withReply = [
          ...next,
          {
            id: newId(),
            role: "assistant" as const,
            content: data.text?.trim() || "No response returned.",
            createdAt: Date.now(),
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

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="border-l-2 border-primary/60 pl-3">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-primary/80">
                Guide / Local session
              </p>
              <p className="mt-1 text-sm text-foreground">
                Ask how to run a consultation, how to interpret results, or what any panel means.
              </p>
            </div>
            <div className="grid gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-md border border-border/70 bg-card/40 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end mt-4">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary/90 px-5 py-3 text-base text-primary-foreground shadow-sm backdrop-blur-md">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={m.id} className="space-y-2 mt-6">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground ml-1">
                MedGuide Guide
              </p>
              <div className="rounded-2xl rounded-bl-sm bg-card/60 px-5 py-4 shadow-sm border border-border/50 backdrop-blur-xl">
                <div className="prose prose-base max-w-none leading-relaxed text-foreground prose-headings:font-display prose-headings:text-lg prose-p:my-2 prose-li:my-1 prose-code:text-primary prose-a:text-primary">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ),
        )}

        {pending && (
          <p className="animate-pulse font-mono text-[0.62rem] uppercase tracking-[0.22em] text-primary/80">
            Thinking…
          </p>
        )}
        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="border-t border-border/70 bg-background/80 p-4 backdrop-blur-xl"
      >
        <div className="flex items-end gap-3 rounded-xl border border-border/70 bg-card/80 p-3 shadow-inner focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
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
            placeholder="Ask about results, evidence tiers, or how to use a module…"
            className="min-h-0 flex-1 resize-none bg-transparent px-2 py-1 text-base outline-none placeholder:text-muted-foreground"
          />
          {pending ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
              aria-label="Stop"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-40"
              aria-label="Send message"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          )}
        </div>
        <p className="mt-3 text-[0.65rem] leading-relaxed text-muted-foreground text-center">
          Guidance only — not a diagnosis. Conversations stay in this browser.
        </p>
      </form>
    </div>
  );
}
