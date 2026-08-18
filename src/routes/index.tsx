import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Cpu,
  FileCheck,
  FileText,
  GitBranch,
  Image as ImageIcon,
  Library,
  Microscope,
  Pill,
  ScanEye,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { GlassCard } from "@/components/medical-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AGENTS, DISCLAIMER, type AgentMeta } from "@/lib/agents/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Platform Overview — MEDGUIDE AI" },
      {
        name: "description",
        content:
          "Evidence-based clinical decision support for clinicians and medical students: 12 specialised agents, PubMed and FDA evidence, explainable reasoning and confidence bands.",
      },
      { property: "og:title", content: "Platform Overview — MEDGUIDE AI" },
      {
        property: "og:description",
        content:
          "Multi-agent clinical decision support with transparent reasoning, retrieved medical evidence and drug safety checks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlatformOverview,
});

const moduleCategories = [
  {
    category: "Clinical Decision Support",
    description: "Core intake, multi-agent consultation, longitudinal tracking, and telemetry.",
    items: [
      {
        icon: Stethoscope,
        title: "AI Consultation",
        tag: "Core Engine",
        text: "Structured intake, follow-up questioning, and evidence-linked clinical reasoning.",
        to: "/consultation",
        color: "text-primary border-primary/30 bg-primary/5",
      },
      {
        icon: UserRound,
        title: "Patient Workspace",
        tag: "Intake",
        text: "Demographics, past medical history, active medications, allergies, vitals, and labs.",
        to: "/patient",
        color: "text-blue-500 border-blue-500/30 bg-blue-500/5",
      },
      {
        icon: Clock,
        title: "Clinical Timeline",
        tag: "Course Tracking",
        text: "Track symptoms, diagnostic tests, medications, and clinical outcomes chronologically.",
        to: "/timeline",
        color: "text-cyan-500 border-cyan-500/30 bg-cyan-500/5",
      },
      {
        icon: Activity,
        title: "Live Dashboard",
        tag: "Telemetry",
        text: "Workspace overview, recent consultations, evidence counts, and confidence distributions.",
        to: "/dashboard",
        color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/5",
      },
    ],
  },
  {
    category: "Diagnostic & Literature Intelligence",
    description:
      "Real-time biomedical retrieval, drug safety audits, knowledge graphs, and vision.",
    items: [
      {
        icon: Library,
        title: "Literature Explorer",
        tag: "PubMed & WHO",
        text: "Real-time peer-reviewed literature retrieval with PubMed E-utilities and global guidelines.",
        to: "/literature",
        color: "text-teal-500 border-teal-500/30 bg-teal-500/5",
      },
      {
        icon: Pill,
        title: "Drug Intelligence",
        tag: "RxNav & openFDA",
        text: "Drug-drug interactions, contraindications, dosage adjustments, and black box warnings.",
        to: "/drugs",
        color: "text-indigo-500 border-indigo-500/30 bg-indigo-500/5",
      },
      {
        icon: ImageIcon,
        title: "Chest X-ray Analysis",
        tag: "Vision AI",
        text: "In-browser ONNX deep learning inference with explainable Grad-CAM heatmaps.",
        to: "/imaging",
        color: "text-violet-500 border-violet-500/30 bg-violet-500/5",
      },
      {
        icon: GitBranch,
        title: "Knowledge Graph",
        tag: "Ontology",
        text: "Interactive relational knowledge graph connecting diseases, symptoms, drugs, and treatments.",
        to: "/graph",
        color: "text-purple-500 border-purple-500/30 bg-purple-500/5",
      },
    ],
  },
  {
    category: "Explainability & Research",
    description: "Case similarity indexing, safety auditing, PDF reporting, and benchmark suites.",
    items: [
      {
        icon: Microscope,
        title: "Case Similarity",
        tag: "Reference Cases",
        text: "Clinically comparable reference cases, verified interventions, and patient outcomes.",
        to: "/cases",
        color: "text-amber-500 border-amber-500/30 bg-amber-500/5",
      },
      {
        icon: ScanEye,
        title: "Explainability",
        tag: "Audit Trail",
        text: "Transparent reasoning paths, supporting evidence, and contradictory clinical signals.",
        to: "/explainability",
        color: "text-orange-500 border-orange-500/30 bg-orange-500/5",
      },
      {
        icon: FileText,
        title: "Report Center",
        tag: "Export",
        text: "Assemble and export professional clinical consultation summaries with QR codes and citations.",
        to: "/reports",
        color: "text-emerald-600 border-emerald-600/30 bg-emerald-600/5",
      },
      {
        icon: Sparkles,
        title: "Research Bench",
        tag: "Evaluation",
        text: "Empirical benchmarking of Vanilla LLM, Standard RAG, Graph RAG, and Agentic Graph RAG.",
        to: "/research",
        color: "text-rose-500 border-rose-500/30 bg-rose-500/5",
      },
    ],
  },
];

const fallbackAgent: AgentMeta = {
  id: "planner",
  name: "Planner Agent",
  short: "Planner",
  description: "Chooses which agents run, and what clinical data is still missing.",
};

const agentDetails: Record<
  string,
  {
    role: string;
    inputs: string;
    engine: string;
    outputSample: string;
  }
> = {
  planner: {
    role: "Formulates execution strategy, identifies missing clinical parameters, and orchestrates specialized sub-agents.",
    inputs: "Patient chief complaint, history, age, sex, vitals, labs",
    engine: "Clinical orchestration graph & task router",
    outputSample:
      "Orchestration Plan: Trigger Retrieval, Graph Traversal & Drug Safety in parallel.",
  },
  retrieval: {
    role: "Searches PubMed E-utilities and WHO clinical guidelines for relevant peer-reviewed studies.",
    inputs: "Formulated medical query keywords & MeSH terms",
    engine: "NCBI PubMed API & WHO Guidelines Index",
    outputSample: "Fetched 6 peer-reviewed abstracts; verified 2 clinical trial citations.",
  },
  "knowledge-graph": {
    role: "Traverses verified disease-symptom-drug-treatment ontology graph for multi-hop clinical links.",
    inputs: "Identified diseases, clinical findings, candidate medications",
    engine: "Curated biomedical property graph",
    outputSample: "Linked Pneumonia → Streptococcus pneumoniae → Amoxicillin (first-line).",
  },
  "clinical-reasoning": {
    role: "Synthesizes retrieved evidence, patient findings, and differential diagnosis rankings.",
    inputs: "Evidence corpus, graph paths, clinical presentation",
    engine: "Chain-of-thought clinical synthesis model",
    outputSample:
      "Differentials: 1. Community-Acquired Pneumonia (85%), 2. Acute Bronchitis (12%).",
  },
  "drug-intelligence": {
    role: "Audits drug-drug interactions, contraindications, and FDA black box warnings.",
    inputs: "Active medications, patient comorbidities, proposed treatments",
    engine: "NIH RxNav API & openFDA Drug Labels",
    outputSample: "Flagged: Metformin contraindicated if eGFR < 30 mL/min/1.73m².",
  },
  "medical-image": {
    role: "Performs client-side chest radiograph inference and Grad-CAM explainability heatmaps.",
    inputs: "DICOM / JPEG Chest X-Ray image tensor",
    engine: "ONNX Runtime Web Deep Neural Network",
    outputSample: "Consolidation detected in right lower lobe (Grad-CAM saliency localized).",
  },
  "case-similarity": {
    role: "Retrieves clinically similar reference cases and documented treatment courses.",
    inputs: "Patient symptom vectors & clinical presentation",
    engine: "Vector similarity database of validated case studies",
    outputSample:
      "Matched Case #104: 54yo male with right lower lobe pneumonia treated with Azithromycin.",
  },
  safety: {
    role: "Independent safety auditor that scans recommendations for unsupported claims and red flags.",
    inputs: "Generated clinical differentials, treatment recommendations",
    engine: "Constrained clinical safety guardrail",
    outputSample:
      "SAFETY PASSED: No contraindications violated; all recommended dosages conform to guidelines.",
  },
  explainability: {
    role: "Builds full explainability audit trail showing exact evidence supporting and refuting each differential.",
    inputs: "Reasoning trace, evidence citations, safety audit logs",
    engine: "Transparent provenance builder",
    outputSample:
      "Reasoning Step 3 backed by PMCID: 8429182 (Supporting) and Guideline ID: WHO-CAP-2024.",
  },
  confidence: {
    role: "Computes qualitative confidence rating (High / Medium / Low) based on empirical evidence coverage.",
    inputs: "Evidence density, contradiction count, data completeness",
    engine: "Heuristic evidence calibration matrix",
    outputSample:
      "Confidence Band: HIGH (Direct guideline support + 0 safety flags + 4 PubMed citations).",
  },
  research: {
    role: "Benchmarks reasoning across architectures (LLM vs RAG vs Graph RAG vs Agentic Graph RAG).",
    inputs: "Standardized medical benchmark question sets",
    engine: "Comparative benchmark execution engine",
    outputSample:
      "Agentic Graph RAG achieved 94.2% evidence citation accuracy vs 62.1% baseline LLM.",
  },
  report: {
    role: "Assembles clinical consultation into a structured, exportable document with PDF and QR verification.",
    inputs: "Complete consultation payload, citations, and disclaimer",
    engine: "jsPDF + QRCode Report Generator",
    outputSample:
      "Generated 'Clinical Consultation Summary — Patient ID #4829' ready for PDF export.",
  },
};

function PlatformOverview() {
  const [activeAgentId, setActiveAgentId] = useState<string>("planner");
  const selectedAgent: AgentMeta = AGENTS.find((a) => a.id === activeAgentId) ?? fallbackAgent;
  const selectedDetail = agentDetails[selectedAgent.id] ?? agentDetails["planner"]!;

  return (
    <AppShell
      title="Platform Overview"
      subtitle="Ten clinical modules, 12 specialized agents, one unified evidence trail"
      wide
      actions={
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/consultation">
              New consultation <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-12 pb-10">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-12 shadow-sm backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 grid-noise opacity-30" />
          <div className="relative z-10 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge
                variant="outline"
                className="border-primary/40 bg-primary/10 text-primary font-mono text-xs"
              >
                Clinical Decision Support
              </Badge>
              <Badge
                variant="outline"
                className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs"
              >
                Live Evidence Retrieval
              </Badge>
              <Badge
                variant="outline"
                className="border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-xs"
              >
                12-Agent Graph RAG
              </Badge>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.12]">
              Explainable <span className="text-gradient">Multi-Agent</span> Clinical Intelligence
            </h1>

            <p className="mt-4 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-3xl">
              MEDGUIDE AI empowers clinicians and medical students by collecting clinical
              parameters, retrieving trusted biomedical evidence from PubMed and WHO, evaluating
              chest radiographs, auditing drug safety, and synthesizing explainable reports — with
              every conclusion verified against verifiable clinical sources.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                <Link to="/consultation">
                  <Stethoscope className="mr-2 h-5 w-5" /> Start AI Consultation
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/graph">
                  <GitBranch className="mr-2 h-5 w-5" /> Explore Knowledge Graph
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link to="/research">
                  <Sparkles className="mr-2 h-5 w-5 text-primary" /> Research Benchmarks
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-8 border-t border-border/60">
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-primary">12</p>
              <p className="text-xs text-muted-foreground font-medium">
                Autonomous Clinical Agents
              </p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-foreground">35M+</p>
              <p className="text-xs text-muted-foreground font-medium">PubMed & WHO Citations</p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-foreground">10</p>
              <p className="text-xs text-muted-foreground font-medium">
                Integrated Workspace Modules
              </p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                100%
              </p>
              <p className="text-xs text-muted-foreground font-medium">Explainable Provenance</p>
            </div>
          </div>
        </section>

        {/* Clinical Workflow Visualizer */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Multi-Agent Clinical Pipeline
              </h2>
              <p className="text-sm text-muted-foreground">
                How patient findings flow through autonomous specialized agents from intake to
                verified report.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                step: "01",
                title: "Clinical Intake",
                agent: "Planner Agent",
                desc: "Structures symptoms, vitals, labs, and formulates targeted search strategies.",
                icon: UserRound,
              },
              {
                step: "02",
                title: "Evidence Retrieval",
                agent: "Retrieval & Graph",
                desc: "Queries PubMed E-utilities and walks disease-drug knowledge graphs in parallel.",
                icon: Search,
              },
              {
                step: "03",
                title: "Diagnostic Synthesis",
                agent: "Reasoning Agent",
                desc: "Synthesizes multi-source context to generate ranked differential diagnoses.",
                icon: Brain,
              },
              {
                step: "04",
                title: "Safety Verification",
                agent: "Safety & Drug Agent",
                desc: "Audits contraindications, RxNav interactions, and FDA black box warnings.",
                icon: ShieldCheck,
              },
              {
                step: "05",
                title: "Explainable Output",
                agent: "Explain & Report",
                desc: "Calibrates confidence bands and exports verifiable clinical summary with QR.",
                icon: FileCheck,
              },
            ].map((f) => (
              <GlassCard key={f.step} className="p-4 transition-all hover:border-primary/40">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">{f.step}</span>
                  <f.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-3 font-display text-sm font-semibold text-foreground">{f.title}</p>
                <Badge
                  variant="outline"
                  className="mt-1 border-primary/20 bg-primary/5 text-[0.65rem] text-primary"
                >
                  {f.agent}
                </Badge>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Interactive 12-Agent Playground */}
        <section>
          <div className="mb-6">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Explore the 12 Specialized Agents
            </h2>
            <p className="text-sm text-muted-foreground">
              Click any agent to inspect its clinical responsibilities, inputs, biomedical engine,
              and live output sample.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {AGENTS.map((a) => {
                const isActive = a.id === selectedAgent.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setActiveAgentId(a.id)}
                    className={`rounded-xl border p-3.5 text-left transition-all touch-manipulation ${
                      isActive
                        ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                        : "border-border/60 bg-card/60 hover:border-primary/40 hover:bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-display text-xs font-bold text-primary">{a.short}</p>
                      {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <p className="mt-1 font-medium text-xs text-foreground truncate">{a.name}</p>
                    <p className="mt-1 line-clamp-2 text-[0.68rem] leading-snug text-muted-foreground">
                      {a.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedAgent.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard className="h-full border-primary/40 bg-gradient-to-b from-primary/5 via-card to-card p-5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-display text-base font-bold text-foreground">
                        {selectedAgent.name}
                      </p>
                      <p className="font-mono text-[0.65rem] uppercase tracking-wider text-primary">
                        Agent Identifier: {selectedAgent.id}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3.5 text-xs">
                    <div>
                      <p className="font-semibold text-muted-foreground uppercase text-[0.65rem] tracking-wider">
                        Clinical Role
                      </p>
                      <p className="mt-1 leading-relaxed text-foreground">{selectedDetail.role}</p>
                    </div>

                    <div>
                      <p className="font-semibold text-muted-foreground uppercase text-[0.65rem] tracking-wider">
                        Biomedical Engine
                      </p>
                      <p className="mt-1 font-mono text-primary text-[0.72rem] bg-primary/5 p-2 rounded-md border border-primary/20">
                        {selectedDetail.engine}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-muted-foreground uppercase text-[0.65rem] tracking-wider">
                        Clinical Inputs
                      </p>
                      <p className="mt-1 text-muted-foreground">{selectedDetail.inputs}</p>
                    </div>

                    <div>
                      <p className="font-semibold text-muted-foreground uppercase text-[0.65rem] tracking-wider">
                        Execution Output Sample
                      </p>
                      <p className="mt-1 text-foreground bg-card/80 p-2.5 rounded-md border border-border/80 font-mono text-[0.7rem] leading-relaxed">
                        {selectedDetail.outputSample}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Categorized Clinical Workspace Modules */}
        <section className="space-y-8">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Clinical Workspace Directory
            </h2>
            <p className="text-sm text-muted-foreground">
              Ten unified clinical intelligence modules connected to the shared evidence and
              explainability engine.
            </p>
          </div>

          {moduleCategories.map((cat) => (
            <div key={cat.category} className="space-y-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {cat.category}
                </h3>
                <p className="text-xs text-muted-foreground">{cat.description}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {cat.items.map((m) => (
                  <Link
                    key={m.title}
                    to={m.to}
                    className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${m.color}`}
                      >
                        <m.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[0.62rem] font-mono border-border/70"
                      >
                        {m.tag}
                      </Badge>
                    </div>
                    <p className="mt-3.5 font-display text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {m.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{m.text}</p>
                    <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Launch module <ArrowRight className="h-3 w-3" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Safety Guardrail & Clinical Disclaimer Banner */}
        <section className="pt-2">
          <div className="glass-strong flex flex-col gap-5 rounded-2xl border border-border/80 p-6 sm:p-8 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-display text-base font-bold text-foreground">
                  Safety by Construction
                </p>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[0.62rem] font-mono"
                >
                  Autonomous Guardrail
                </Badge>
              </div>
              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Every consultation is audited by an independent Safety Agent before clinician
                delivery. The engine enforces strict contraindication checks, highlights red-flag
                contraindications, and computes qualitative confidence bands (High, Medium, Low)
                rather than opaque percentages. {DISCLAIMER}
              </p>
            </div>
            <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
              <Button asChild variant="outline" size="sm">
                <Link to="/explainability" search={{ id: undefined }}>
                  <ScanEye className="mr-1.5 h-3.5 w-3.5 text-primary" /> View Explainability
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/consultation">
                  <Stethoscope className="mr-1.5 h-3.5 w-3.5" /> Start Consultation
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
