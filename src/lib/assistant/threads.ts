/**
 * Local-only threaded assistant history (browser localStorage).
 * Keeps the platform's "nothing leaves this browser" guarantee.
 */
import { useCallback, useEffect, useState } from "react";

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export interface AssistantThread {
  id: string;
  title: string;
  updatedAt: number;
  messages: AssistantMessage[];
}

const KEY = "medguide.assistant.threads.v1";

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);

function read(): AssistantThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AssistantThread[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(threads: AssistantThread[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(threads.slice(0, 60)));
  } catch {
    /* quota */
  }
  window.dispatchEvent(new CustomEvent("assistant-threads-changed"));
}

export function listThreads(): AssistantThread[] {
  return read().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getThread(id: string): AssistantThread | undefined {
  return read().find((t) => t.id === id);
}

export function createThread(id = newId()): AssistantThread {
  const thread: AssistantThread = {
    id,
    title: "New conversation",
    updatedAt: Date.now(),
    messages: [],
  };
  write([thread, ...read()]);
  return thread;
}

export function ensureThread(id: string): AssistantThread {
  return getThread(id) ?? createThread(id);
}

export function saveThread(id: string, messages: AssistantMessage[]) {
  const threads = read();
  const idx = threads.findIndex((t) => t.id === id);
  const firstUser = messages.find((m) => m.role === "user")?.content ?? "";
  const title = firstUser ? firstUser.replace(/\s+/g, " ").slice(0, 52) : "New conversation";
  const next: AssistantThread = { id, title, updatedAt: Date.now(), messages };
  if (idx === -1) threads.unshift(next);
  else threads[idx] = next;
  write(threads);
}

export function deleteThread(id: string) {
  write(read().filter((t) => t.id !== id));
}

/** Reactive thread list (syncs across the widget and the full page). */
export function useThreads() {
  const [threads, setThreads] = useState<AssistantThread[]>([]);
  const refresh = useCallback(() => setThreads(listThreads()), []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("assistant-threads-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("assistant-threads-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, [refresh]);

  return { threads, refresh };
}
