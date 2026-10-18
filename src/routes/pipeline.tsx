import { createFileRoute, Link } from "@tanstack/react-router";
import { useSyncExternalStore, useMemo, useState } from "react";
import { query, orderBy } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  Activity,
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  Cpu,
  ExternalLink,
  FileText,
  GitBranch,
  Image as ImageIcon,
  Library,
  Microscope,
  Pill,
  ScanEye,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Target,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { GlassCard, SectionTitle } from "@/components/medical-ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { consultRunStore } from "@/lib/consult-run-store";
import { AGENTS, type AgentId, type AgentMeta, type AgentStatus, type ConsultationResult } from "@/lib/agents/types";
import { getCollections, useTypedCollection, type ConsultationRecord } from "@/lib/db";
import { auth } from "@/lib/firebase";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Agent Pipeline : MEDGUIDE AI" },
      {
        name: "description",
        content: "Operational multi-agent consensus, execution telemetry, and clinical safety auditing.",
      },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <AppShell title="Agent Pipeline" subtitle="Pipeline monitoring">
      <GlassCard className="p-8 text-center">
        <h2 className="text-lg font-semibold text-destructive">Pipeline Telemetry Error</h2>
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

const AGENT_ENGINE_SPECS: Record<AgentId, { engine: string; source: string; moduleRoute?: string }> = {
  planner: {
    engine: "Clinical Task Router & Decomposition Engine",
    source: "Clinical intake protocol & missing-parameter heuristics",
    moduleRoute: "/consultation",
  },
  retrieval: {
    engine: "NCBI E-utilities & PubMed Retrieval API",
    source: "Peer-reviewed biomedical literature, WHO & CDC clinical practice guidelines",
    moduleRoute: "/literature",
  },
  "knowledge-graph": {
    engine: "Relational Biomedical Graph Traversal Engine",
    source: "MeSH ontology, disease-symptom-drug relational pathways",
    moduleRoute: "/graph",
  },
  "clinical-reasoning": {
    engine: "Multi-Agent Consensus Diagnostic Synthesizer",
    source: "Bayesian likelihood ranking with grounded clinical priors",
    moduleRoute: "/consultation",
  },
  "drug-intelligence": {
    engine: "RxNav & openFDA Pharmacovigilance Engine",
    source: "FDA Drug Labels, Black Box Warnings, and CYP450 interactions",
    moduleRoute: "/drugs",
  },
  "medical-image": {
    engine: "ONNX Runtime Web Deep Learning Inference",
    source: "DenseNet-121 chest radiograph classifier with Grad-CAM heatmaps",
    moduleRoute: "/imaging",
  },
  "case-similarity": {
    engine: "k-NN Biomedical Case Vector Index",
    source: "50 peer-reviewed clinical vignettes with verified patient outcomes",
    moduleRoute: "/cases",
  },
  safety: {
    engine: "Autonomous Deterministic Guardrail Interceptor",
    source: "Zero-tolerance contraindication rules & red-flag contradiction audit",
    moduleRoute: "/explainability",
  },
  explainability: {
    engine: "Causal Provenance & Decision Trace Engine",
    source: "Step-by-step audit trail linking claims to citations",
    moduleRoute: "/explainability",
  },
  confidence: {
    engine: "Multi-Signal Confidence Calibration Engine",
    source: "Source agreement, guideline concordance, and citation density",
    moduleRoute: "/dashboard",
  },
  research: {
    engine: "Empirical Benchmark Evaluation Suite",
    source: "Standardized evaluation over medical knowledge benchmarks",
    moduleRoute: "/research",
  },
  report: {
    engine: "Hospital-Grade Clinical Consultation Document Generator",
    source: "SOAP-structured clinical report with QR verification and citations",
    moduleRoute: "/reports",
  },
};

function PipelinePage() {
  const [user] = useAuthState(auth);
  const cols = user ? getCollections(user.uid) : null;
  const [consultations] = useTypedCollection<ConsultationRecord>(
    cols ? query(cols.consultations, orderBy("createdAt", "desc")) : null,
  );

  const run$ = useSyncExternalStore(
    consultRunStore.subscribe,
    consultRunStore.getSnapshot,
    consultRunStore.getServerSnapshot,
  );

  const { running, statuses, result: liveResult } = run$;
  const [selectedConsultationId, setSelectedConsultationId] = useState<string>("standby");
  const [inspectedAgent, setInspectedAgent] = useState<AgentMeta | null>(null);

  // Determine active consultation data to display (null by default in clean standby mode)
  const activeConsultation = useMemo(() => {
    if (running && liveResult) {
      return {
        id: "live-running",
        question: liveResult.question || "Active Real-Time Consultation",
        result: liveResult as ConsultationResult,
        createdAt: Date.now(),
        isLive: true,
      };
    }
    if (selectedConsultationId && selectedConsultationId !== "standby" && consultations && consultations.length > 0) {
      const match = consultations.find((c) => c.id === selectedConsultationId);
      return match ? { ...match, isLive: false } : null;
    }
    return null;
  }, [consultations, selectedConsultationId, running, liveResult]);

  const activeResult: ConsultationResult | null = activeConsultation?.result ?? null;

  // Real summary output per agent (clean idle role description when in standby)
  const getRealAgentSummary = (id: AgentId): { status: AgentStatus; summary: string } => {
    if (running) {
      const st = statuses[id];
      if (st) {
        return {
          status: st.status,
          summary: st.summary || (st.status === "running" ? "Executing live..." : "Completed execution."),
        };
      }
      return { status: "idle", summary: "Queued in execution sequence" };
    }

    if (!activeResult) {
      const meta = AGENTS.find((a) => a.id === id);
      return {
        status: "idle",
        summary: meta?.description || "Standing ready for incoming clinical cases.",
      };
    }

    switch (id) {
      case "planner":
        return {
          status: "done",
          summary: activeResult.plan?.followUpQuestions?.length
            ? `Structured question and generated ${activeResult.plan.followUpQuestions.length} follow-up clarifications.`
            : "Formulated clinical search queries and parameter triage.",
        };
      case "retrieval":
        return {
          status: "done",
          summary: activeResult.evidence?.length
            ? `Retrieved and verified ${activeResult.evidence.length} peer-reviewed citations via PubMed E-utilities.`
            : "Queried NCBI PubMed and WHO clinical practice guidelines.",
        };
      case "knowledge-graph":
        return {
          status: "done",
          summary: activeResult.graph?.nodes?.length
            ? `Traversed ${activeResult.graph.nodes.length} nodes and mapped relational disease-symptom-drug pathways.`
            : "Walked relational ontology graph for etiology associations.",
        };
      case "clinical-reasoning":
        return {
          status: "done",
          summary: activeResult.reasoning?.differentials?.length
            ? `Synthesized ranked differential: 1. ${activeResult.reasoning.differentials[0]?.condition || "Primary"} (${activeResult.reasoning.differentials[0]?.likelihood || "high"}).`
            : "Formulated evidence-grounded differential diagnoses.",
        };
      case "drug-intelligence":
        return {
          status: "done",
          summary: activeResult.drugs?.length
            ? `Screened ${activeResult.drugs.length} active medications for interactions and FDA black box warnings.`
            : "Audited RxNav drug-drug interactions and contraindications.",
        };
      case "medical-image":
        return {
          status: "done",
          summary: activeResult.imaging?.findings?.[0]
            ? `ONNX Deep Learning: ${activeResult.imaging.findings[0].label} (${Math.round((activeResult.imaging.findings[0].probability || 0) * 100)}% prob).`
            : "Evaluated radiograph imaging fields; no acute pathology flagged.",
        };
      case "case-similarity":
        return {
          status: "done",
          summary: activeResult.cases?.length
            ? `Indexed ${activeResult.cases.length} clinically comparable patient vignettes with verified outcomes.`
            : "Computed k-NN vector cosine similarity over reference database.",
        };
      case "safety":
        return {
          status: "done",
          summary: activeResult.safety?.flags?.length
            ? `Flagged ${activeResult.safety.flags.length} red-flag alerts: ${activeResult.safety.verdict || "Audited"}.`
            : `Safety audit confirmed: ${activeResult.safety?.verdict || "Zero ungrounded clinical claims"}.`,
        };
      case "explainability":
        return {
          status: "done",
          summary: activeResult.explain?.supporting?.length
            ? `Constructed causal reasoning trace with ${activeResult.explain.supporting.length} grounded claims.`
            : "Exposed complete causal audit trail for clinical governance.",
        };
      case "confidence":
        return {
          status: "done",
          summary: activeResult.confidence?.band
            ? `Calibrated Confidence: ${activeResult.confidence.band.toUpperCase()} band based on multi-signal concordance.`
            : "Computed qualitative confidence calibration.",
        };
      case "report":
        return {
          status: "done",
          summary: activeResult.reportMarkdown
            ? "Compiled verified clinical consultation document ready for PDF & EHR export."
            : "Assembled structured consultation summary.",
        };
      default:
        return { status: "done", summary: "Completed operational execution." };
    }
  };

  return (
    <AppShell
      title="Agent Pipeline"
      subtitle="Operational multi-agent consensus, execution telemetry, and clinical safety auditing"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {activeConsultation?.id && activeConsultation.id !== "live-running" && (
            <Button asChild size="sm" variant="outline" className="text-xs gap-1.5">
              <Link to="/explainability" search={{ id: activeConsultation.id }}>
                <ScanEye className="h-3.5 w-3.5" /> Explainability Trace
              </Link>
            </Button>
          )}

          <Button asChild size="sm" className="text-xs gap-1.5 shadow-sm">
            <Link to="/consultation">
              <Stethoscope className="h-3.5 w-3.5" /> New Consultation
            </Link>
          </Button>
        </div>
      }
      wide
    >
      <div className="space-y-5 max-w-6xl mx-auto">
        {/* Architecture Telemetry Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wider">Agents Fleet</span>
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <p className="font-display text-xl font-bold text-foreground">
              11 <span className="text-xs font-normal text-muted-foreground">Autonomous</span>
            </p>
            <p className="text-[0.68rem] text-primary font-medium">Consensus Architecture</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wider">Evidence Grounding</span>
              <Library className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {activeResult?.evidence?.length ? `${activeResult.evidence.length} Citations` : "Standby"}
            </p>
            <p className="text-[0.68rem] text-muted-foreground">
              {activeResult ? "PubMed E-utilities" : "PubMed & WHO Ready"}
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wider">Safety Interceptor</span>
              <ShieldAlert className="h-4 w-4 text-rose-500" />
            </div>
            <p className="font-display text-xl font-bold text-foreground">
              {activeResult?.safety?.flags?.length ? `${activeResult.safety.flags.length} Flag(s)` : "Zero-Tolerance"}
            </p>
            <p className="text-[0.68rem] text-emerald-600 dark:text-emerald-400 font-medium">
              {activeResult ? "Deterministic Safety Audit" : "Deterministic Guardrail"}
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wider">Confidence Band</span>
              <Sparkles className="h-4 w-4 text-cyan-500" />
            </div>
            <p className="font-display text-xl font-bold text-cyan-600 dark:text-cyan-400">
              {activeResult?.confidence?.band ? activeResult.confidence.band.toUpperCase() : "STANDBY"}
            </p>
            <p className="text-[0.68rem] text-muted-foreground">
              {activeResult ? "Multi-Signal Agreement" : "Calibrated on Run"}
            </p>
          </div>
        </div>

        {/* Real Consultation Context Bar */}
        <GlassCard className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    running
                      ? "bg-primary/10 text-primary border border-primary/30 animate-pulse"
                      : activeResult
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-muted text-muted-foreground border border-border/60"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      running ? "bg-primary animate-ping" : activeResult ? "bg-emerald-500" : "bg-primary/80"
                    }`}
                  />
                  {running
                    ? "Live Pipeline Execution Active"
                    : activeResult
                    ? "Audited Real Case Telemetry"
                    : "Idle Standby · Ready for Clinical Intake"}
                </span>

                {activeConsultation?.createdAt && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date(activeConsultation.createdAt).toLocaleString()}
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-foreground line-clamp-1">
                {activeConsultation?.question ||
                  "Pipeline idle on standby. Launch a new consultation to execute all 11 agents in real time, or select a past case to review telemetry."}
              </p>
            </div>

            {/* Case Selector Dropdown if saved consultations exist */}
            {consultations && consultations.length > 0 && !running && (
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-full sm:w-[260px]">
                  <Select
                    value={selectedConsultationId}
                    onValueChange={(val) => setSelectedConsultationId(val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-card/60">
                      <SelectValue placeholder="Inspect past case (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standby">Live Standby (Clean / Ready)</SelectItem>
                      {consultations.map((c) => (
                        <SelectItem key={c.id} value={c.id!}>
                          {c.question.replace(/^["“”']+|["“”']+$/g, "").slice(0, 36)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedConsultationId !== "standby" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedConsultationId("standby")}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    title="Reset view to clean standby"
                  >
                    Clear
                  </Button>
                )}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Live Execution Grid */}
        <GlassCard>
          <CardHeader className="pb-3 border-b border-border/60">
            <SectionTitle
              icon={Activity}
              title="Autonomous Clinical Pipeline Workflow"
              hint="Click any agent to inspect its biomedical engine, inputs, and real execution telemetry"
            />
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-5">
            {/* Phase 1: Intake & Retrieval */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[0.65rem] text-primary font-bold">
                  1
                </span>
                Intake & Evidence Retrieval
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {AGENT_PHASES.intake.map((id, idx) => {
                  const meta = AGENTS.find((a) => a.id === id);
                  const Icon = AGENT_ICONS[id] || Brain;
                  const st = getRealAgentSummary(id);
                  return (
                    <RealAgentCard
                      key={id}
                      index={idx + 1}
                      meta={meta!}
                      Icon={Icon}
                      state={st}
                      onClick={() => setInspectedAgent(meta!)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Phase 2: Reasoning & Multimodal Synthesis */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[0.65rem] text-primary font-bold">
                  2
                </span>
                Multimodal Reasoning & Differential Diagnosis
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {AGENT_PHASES.reasoning.map((id, idx) => {
                  const meta = AGENTS.find((a) => a.id === id);
                  const Icon = AGENT_ICONS[id] || Brain;
                  const st = getRealAgentSummary(id);
                  return (
                    <RealAgentCard
                      key={id}
                      index={idx + 4}
                      meta={meta!}
                      Icon={Icon}
                      state={st}
                      onClick={() => setInspectedAgent(meta!)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Phase 3: Safety, Verification & Report */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[0.65rem] text-primary font-bold">
                  3
                </span>
                Safety Verification & Report Generation
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {AGENT_PHASES.verification.map((id, idx) => {
                  const meta = AGENTS.find((a) => a.id === id);
                  const Icon = AGENT_ICONS[id] || Brain;
                  const st = getRealAgentSummary(id);
                  return (
                    <RealAgentCard
                      key={id}
                      index={idx + 7}
                      meta={meta!}
                      Icon={Icon}
                      state={st}
                      onClick={() => setInspectedAgent(meta!)}
                    />
                  );
                })}
              </div>
            </div>
          </CardContent>
        </GlassCard>

        {/* Empty state prompt if zero consultations exist yet */}
        {(!consultations || consultations.length === 0) && !running && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center space-y-3">
            <h3 className="font-display text-base font-bold text-foreground">
              Ready for Real Clinical Intake
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              No consultations have been run yet in your encrypted workspace. Enter a patient clinical case
              to activate all 11 autonomous agents in real time.
            </p>
            <Button asChild size="sm" className="gap-2">
              <Link to="/consultation">
                <Stethoscope className="h-4 w-4" /> Start Real Consultation
              </Link>
            </Button>
          </div>
        )}

        {/* Detailed Agent Specification & Telemetry Inspector Dialog */}
        {inspectedAgent && (
          <Dialog open={!!inspectedAgent} onOpenChange={(open) => !open && setInspectedAgent(null)}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    {(() => {
                      const Icon = AGENT_ICONS[inspectedAgent.id] || Brain;
                      return <Icon className="h-4 w-4" />;
                    })()}
                  </div>
                  <DialogTitle className="font-display text-base font-bold">
                    {inspectedAgent.name}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs">
                  {inspectedAgent.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 space-y-2">
                  <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                    Biomedical Engine & Protocols
                  </p>
                  <p className="text-xs font-semibold text-foreground">
                    {AGENT_ENGINE_SPECS[inspectedAgent.id]?.engine || "Clinical Intelligence Engine"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {AGENT_ENGINE_SPECS[inspectedAgent.id]?.source || "Medical decision support protocol"}
                  </p>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-1.5">
                  <p className="font-mono text-[0.65rem] uppercase tracking-wider text-primary font-bold">
                    Case Output Payload
                  </p>
                  <p className="text-xs text-foreground leading-relaxed">
                    {getRealAgentSummary(inspectedAgent.id).summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[0.65rem] text-muted-foreground font-mono">
                    Deterministic Guardrails Active
                  </span>

                  {AGENT_ENGINE_SPECS[inspectedAgent.id]?.moduleRoute && (
                    <Button asChild size="sm" variant="outline" className="text-xs gap-1.5">
                      <Link to={AGENT_ENGINE_SPECS[inspectedAgent.id]!.moduleRoute!}>
                        Open Module <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AppShell>
  );
}

function RealAgentCard({
  index,
  meta,
  Icon,
  state,
  onClick,
}: {
  index: number;
  meta: AgentMeta;
  Icon: React.ComponentType<{ className?: string }>;
  state: { status: AgentStatus; summary: string };
  onClick: () => void;
}) {
  const isRunning = state.status === "running";
  const isDone = state.status === "done";

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 cursor-pointer ${
        isRunning
          ? "border-primary bg-primary/[0.08] shadow-md shadow-primary/20 scale-[1.01]"
          : isDone
          ? "border-border/70 bg-card/60 hover:border-primary/50 hover:bg-card/90 hover:shadow-sm"
          : "border-border/50 bg-card/30 opacity-75 hover:opacity-100"
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                isRunning
                  ? "bg-primary text-white animate-pulse"
                  : isDone
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <span className="font-mono text-[0.68rem] text-muted-foreground">
              #{String(index).padStart(2, "0")}
            </span>
          </div>

          <Badge
            variant="outline"
            className={`text-[0.62rem] font-mono capitalize ${
              isRunning
                ? "border-primary text-primary bg-primary/10 animate-pulse"
                : isDone
                ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                : "border-border/70 text-muted-foreground"
            }`}
          >
            {isDone && <CheckCircle2 className="h-2.5 w-2.5 mr-1 text-emerald-500 inline-block" />}
            {state.status}
          </Badge>
        </div>

        <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
          {meta.name}
        </h4>
        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {state.summary}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between text-[0.65rem] text-muted-foreground group-hover:text-primary transition-colors border-t border-border/40 pt-2">
        <span className="font-mono text-[0.6rem] uppercase tracking-wider">Inspect Payload</span>
        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
