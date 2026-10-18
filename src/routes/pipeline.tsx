import { createFileRoute, Link } from "@tanstack/react-router";
import { useSyncExternalStore, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  Brain,
  CheckCircle2,
  Cpu,
  FileText,
  GitBranch,
  Image as ImageIcon,
  Library,
  Microscope,
  Pill,
  Play,
  RotateCcw,
  ScanEye,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Target,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { GlassCard, SectionTitle } from "@/components/medical-ui";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { consultRunStore } from "@/lib/consult-run-store";
import { AGENTS, type AgentId, type AgentStatus } from "@/lib/agents/types";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Agent Pipeline : MEDGUIDE AI" },
      { name: "description", content: "Live execution status and consensus telemetry of clinical reasoning agents." },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <AppShell title="Agent Pipeline" subtitle="Pipeline monitoring">
      <GlassCard className="p-8 text-center">
        <h2 className="text-lg font-semibold text-destructive">Pipeline Status Error</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {(error as Error)?.message || "Failed to load agent pipeline telemetry."}
        </p>
        <Button onClick={reset} className="mt-4" size="sm">
          Retry Pipeline
        </Button>
      </GlassCard>
    </AppShell>
  ),
  component: PipelinePage,
});

const AGENT_ICONS: Record<AgentId, React.ComponentType<{ className?: string }>> = {
  planner: Target,
  retrieval: Library,
  "knowledge-graph": GitBranch,
  "clinical-reasoning": Brain,
  "drug-intelligence": Pill,
  "medical-image": ImageIcon,
  "case-similarity": Microscope,
  safety: ShieldAlert,
  explainability: ScanEye,
  confidence: CheckCircle2,
  research: Cpu,
  report: FileText,
};

const AGENT_PHASES = {
  intake: ["planner", "retrieval", "knowledge-graph"] as AgentId[],
  reasoning: ["clinical-reasoning", "drug-intelligence", "medical-image"] as AgentId[],
  verification: ["case-similarity", "safety", "explainability", "confidence", "report"] as AgentId[],
};

function PipelinePage() {
  const run$ = useSyncExternalStore(
    consultRunStore.subscribe,
    consultRunStore.getSnapshot,
    consultRunStore.getServerSnapshot,
  );

  const { running, statuses, result } = run$;
  const agentList = useMemo(() => AGENTS.filter((a) => a.id !== "research"), []);

  // Interactive local simulation state for demoing the pipeline live
  const [simulating, setSimulating] = useState(false);
  const [simStatuses, setSimStatuses] = useState<Record<string, { status: AgentStatus; summary?: string }>>({});

  const startSimulation = async () => {
    if (simulating || running) return;
    setSimulating(true);
    setSimStatuses({});

    const summaries: Record<string, string> = {
      planner: "Triaged patient intake: identified acute cardiopulmonary presentation.",
      retrieval: "Retrieved 8 PubMed citations and ACC/AHA guidelines.",
      "knowledge-graph": "Traversed coronary artery disease and myocardial infarction relations.",
      "clinical-reasoning": "Formulated differential diagnosis: Anterior STEMI (88%), PE (42%).",
      "drug-intelligence": "Verified ticagrelor and aspirin; screened beta-blocker contraindications.",
      "medical-image": "Localized cardiomegaly and lung fields with CAM saliency map.",
      "case-similarity": "Matched 3 cohort cases with successful revascularization outcomes.",
      safety: "Safety audit passed: no unverified drug interactions.",
      explainability: "Generated step-by-step causal decision trace.",
      confidence: "Confidence rated HIGH based on 94% source concordance.",
      report: "Compiled structured clinical decision support summary.",
    };

    for (let i = 0; i < agentList.length; i++) {
      const a = agentList[i]!;
      setSimStatuses((prev) => ({
        ...prev,
        [a.id]: { status: "running", summary: "Analyzing clinical data..." },
      }));

      await new Promise((r) => setTimeout(r, 650));

      setSimStatuses((prev) => ({
        ...prev,
        [a.id]: { status: "done", summary: summaries[a.id] || "Completed execution." },
      }));
    }

    setSimulating(false);
  };

  const resetSimulation = () => {
    setSimulating(false);
    setSimStatuses({});
  };

  const getAgentState = (id: AgentId) => {
    if (running || result) {
      return statuses[id] || { status: "idle" };
    }
    return simStatuses[id] || { status: "idle" };
  };

  const isLive = running || simulating;

  return (
    <AppShell
      title="Agent Pipeline"
      subtitle="Autonomous multi-agent consensus, evidence gathering, and safety auditing"
      actions={
        <div className="flex items-center gap-2">
          {simulating ? (
            <Button size="sm" variant="outline" onClick={resetSimulation} className="text-xs gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Reset Demo
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={startSimulation}
              disabled={running || simulating}
              className="text-xs gap-1.5 border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
            >
              <Play className="h-3.5 w-3.5" /> Simulate Pipeline Flow
            </Button>
          )}

          <Button asChild size="sm" className="text-xs gap-1.5">
            <Link to="/consultation">
              <Stethoscope className="h-3.5 w-3.5" /> Launch Consultation
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-4 max-w-5xl mx-auto">
        {/* Architecture Telemetry Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-xl border border-border/70 bg-card/60 p-3 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wider">Agents Fleet</span>
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-lg font-bold text-foreground">11 <span className="text-xs font-normal text-muted-foreground">Autonomous</span></p>
            <span className="text-[0.65rem] text-primary font-medium">Multi-Disciplinary</span>
          </div>

          <div className="rounded-xl border border-border/70 bg-card/60 p-3 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wider">Consensus Engine</span>
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Strict</p>
            <span className="text-[0.65rem] text-muted-foreground">Peer-Reviewed Sourcing</span>
          </div>

          <div className="rounded-xl border border-border/70 bg-card/60 p-3 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wider">Safety Interceptor</span>
              <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
            </div>
            <p className="text-lg font-bold text-foreground">Zero-Tolerance</p>
            <span className="text-[0.65rem] text-emerald-600 dark:text-emerald-400 font-medium">Deterministic Cross-Checks</span>
          </div>

          <div className="rounded-xl border border-border/70 bg-card/60 p-3 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wider">Pipeline Latency</span>
              <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
            </div>
            <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400">Sub-Second</p>
            <span className="text-[0.65rem] text-muted-foreground">Real-time Streaming</span>
          </div>
        </div>

        {/* Live Execution Grid */}
        <GlassCard>
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <SectionTitle
                icon={Activity}
                title="Live Multi-Agent Execution Flow"
                hint="Sequential pipeline from intake to clinical verification"
              />
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isLive
                    ? "bg-primary/10 text-primary border border-primary/30 animate-pulse"
                    : result || Object.keys(simStatuses).length > 0
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-muted text-muted-foreground"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-primary animate-ping" : result || Object.keys(simStatuses).length > 0 ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                  {isLive ? "Processing Workflow" : result || Object.keys(simStatuses).length > 0 ? "Completed Run" : "Idle Standby"}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* Phase 1: Intake & Retrieval */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[0.65rem] text-primary font-bold">1</span>
                Intake & Evidence Retrieval
              </div>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {AGENT_PHASES.intake.map((id, idx) => {
                  const meta = AGENTS.find((a) => a.id === id);
                  const Icon = AGENT_ICONS[id] || Brain;
                  const st = getAgentState(id);
                  return (
                    <AgentCard key={id} index={idx + 1} meta={meta!} Icon={Icon} state={st} />
                  );
                })}
              </div>
            </div>

            {/* Phase 2: Reasoning & Multimodal Synthesis */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[0.65rem] text-primary font-bold">2</span>
                Multimodal Reasoning & Differential Diagnosis
              </div>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {AGENT_PHASES.reasoning.map((id, idx) => {
                  const meta = AGENTS.find((a) => a.id === id);
                  const Icon = AGENT_ICONS[id] || Brain;
                  const st = getAgentState(id);
                  return (
                    <AgentCard key={id} index={idx + 4} meta={meta!} Icon={Icon} state={st} />
                  );
                })}
              </div>
            </div>

            {/* Phase 3: Safety, Verification & Report */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[0.65rem] text-primary font-bold">3</span>
                Safety Verification & Report Generation
              </div>
              <div className="grid gap-2.5 sm:grid-cols-3 md:grid-cols-5">
                {AGENT_PHASES.verification.map((id, idx) => {
                  const meta = AGENTS.find((a) => a.id === id);
                  const Icon = AGENT_ICONS[id] || Brain;
                  const st = getAgentState(id);
                  return (
                    <AgentCard key={id} index={idx + 7} meta={meta!} Icon={Icon} state={st} compact />
                  );
                })}
              </div>
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </AppShell>
  );
}

function AgentCard({
  index,
  meta,
  Icon,
  state,
  compact = false,
}: {
  index: number;
  meta: { id: AgentId; name: string; short: string; description: string };
  Icon: React.ComponentType<{ className?: string }>;
  state: { status: AgentStatus; summary?: string };
  compact?: boolean;
}) {
  const isRunning = state.status === "running";
  const isDone = state.status === "done";

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-300 ${
        isRunning
          ? "border-primary bg-primary/[0.08] shadow-md shadow-primary/20 scale-[1.02]"
          : isDone
            ? "border-emerald-500/40 bg-emerald-500/[0.04] hover:border-emerald-500/60"
            : "border-border/70 bg-card/50 hover:border-border hover:bg-card/70"
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                isRunning
                  ? "bg-primary text-white animate-pulse"
                  : isDone
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="font-mono text-[0.65rem] text-muted-foreground/70">
              #{String(index).padStart(2, "0")}
            </span>
          </div>

          <span
            className={`flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wider ${
              isRunning
                ? "text-primary animate-pulse"
                : isDone
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground/70"
            }`}
          >
            {isRunning && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />}
            {isDone && <CheckCircle2 className="h-3 w-3" />}
            {state.status}
          </span>
        </div>

        <h4 className="text-xs font-semibold text-foreground truncate">{meta.name}</h4>
        <p className="mt-1 text-[0.7rem] text-muted-foreground leading-relaxed line-clamp-2">
          {state.summary || meta.description}
        </p>
      </div>

      {isRunning && (
        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-primary/20">
          <div className="h-full w-full bg-primary animate-pulse" />
        </div>
      )}
    </div>
  );
}
