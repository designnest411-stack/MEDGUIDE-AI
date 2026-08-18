import { streamConsultation } from "@/lib/consult-client";
import type { AgentStatus, ConsultationInput, ConsultationResult } from "@/lib/agents/types";

export type PatientDraft = {
  age: string;
  sex: string;
  history: string;
  medications: string;
  allergies: string;
  vitals: string;
  labs: string;
};

export const emptyPatientDraft: PatientDraft = {
  age: "",
  sex: "",
  history: "",
  medications: "",
  allergies: "",
  vitals: "",
  labs: "",
};

export type ConsultRunState = {
  question: string;
  patient: PatientDraft;
  answers: Record<string, string>;
  selectedPatient: string;
  running: boolean;
  statuses: Record<string, { status: AgentStatus; summary?: string }>;
  result: Partial<ConsultationResult> | null;
  error: string | null;
  finishedAt: number | null;
};

const initial: ConsultRunState = {
  question: "",
  patient: { ...emptyPatientDraft },
  answers: {},
  selectedPatient: "",
  running: false,
  statuses: {},
  result: null,
  error: null,
  finishedAt: null,
};

/**
 * Module-level store so a running consultation survives route changes.
 * The fetch/stream lives outside React, so navigating to another page
 * (or unmounting the consultation route) never aborts the agent run.
 */
let state: ConsultRunState = initial;
const listeners = new Set<() => void>();
let controller: AbortController | null = null;

function emit() {
  for (const l of listeners) l();
}

function set(patch: Partial<ConsultRunState>) {
  state = { ...state, ...patch };
  emit();
}

export const consultRunStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): ConsultRunState {
    return state;
  },
  getServerSnapshot(): ConsultRunState {
    return initial;
  },
  setQuestion(question: string) {
    set({ question });
  },
  setPatient(patient: PatientDraft) {
    set({ patient });
  },
  setSelectedPatient(selectedPatient: string) {
    set({ selectedPatient });
  },
  setAnswers(answers: Record<string, string>) {
    set({ answers });
  },
  reset() {
    controller?.abort();
    controller = null;
    state = { ...initial, patient: { ...emptyPatientDraft } };
    emit();
  },
  stop() {
    controller?.abort();
    controller = null;
    set({ running: false });
  },
  async start(
    input: ConsultationInput,
    hooks?: { onDone?: (r: ConsultationResult) => void; onError?: (m: string) => void },
  ) {
    if (state.running) return;
    controller?.abort();
    controller = new AbortController();
    set({ running: true, statuses: {}, result: {}, error: null, finishedAt: null });

    try {
      const final = await streamConsultation(
        input,
        (event) => {
          if (event.type === "agent") {
            set({
              statuses: {
                ...state.statuses,
                [event.trace.agent]: {
                  status: event.trace.status,
                  ...(event.trace.summary ? { summary: event.trace.summary } : {}),
                },
              },
            });
          } else if (event.type === "partial") {
            set({ result: { ...(state.result ?? {}), [event.key]: event.value } });
          } else if (event.type === "done") {
            set({ result: event.result });
          }
        },
        controller.signal,
      );
      if (final) {
        set({ result: final, finishedAt: Date.now() });
        hooks?.onDone?.(final);
      }
    } catch (err) {
      const e = err as Error;
      if (e.name !== "AbortError") {
        set({ error: e.message || "Consultation failed" });
        hooks?.onError?.(e.message || "Consultation failed");
      }
    } finally {
      controller = null;
      set({ running: false });
    }
  },
};
