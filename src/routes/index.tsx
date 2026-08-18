import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  GitBranch,
  Image as ImageIcon,
  Library,
  Microscope,
  Pill,
  ScanEye,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Activity,
  UserRound,
  FileText,
  Clock,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AGENTS, DISCLAIMER } from "@/lib/agents/types";

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
  component: Landing,
});

const modules = [
  {
    icon: Stethoscope,
    title: "AI Consultation",
    text: "Structured intake, follow-up questioning and evidence-linked reasoning.",
    to: "/consultation",
  },
  {
    icon: UserRound,
    title: "Patient Workspace",
    text: "Record patient history, medications, allergies, vitals and labs.",
    to: "/patient",
  },
  {
    icon: Library,
    title: "Literature Explorer",
    text: "Search and summarise PubMed research in the clinical context.",
    to: "/literature",
  },
  {
    icon: Pill,
    title: "Drug Intelligence",
    text: "Interactions, contraindications and openFDA label warnings.",
    to: "/drugs",
  },
  {
    icon: ImageIcon,
    title: "Chest X-ray Analysis",
    text: "In-browser inference with explainable Grad-CAM heatmaps.",
    to: "/imaging",
  },
  {
    icon: GitBranch,
    title: "Knowledge Graph",
    text: "Disease, symptom, drug and treatment relationships you can walk.",
    to: "/graph",
  },
  {
    icon: Clock,
    title: "Clinical Timeline",
    text: "Track symptoms, tests, medications and outcomes chronologically.",
    to: "/timeline",
  },
  {
    icon: Microscope,
    title: "Case Similarity",
    text: "Comparable reference cases, treatments and outcomes.",
    to: "/cases",
  },
  {
    icon: ScanEye,
    title: "Explainability",
    text: "Why this conclusion — supporting and contradicting evidence.",
    to: "/explainability",
  },
  {
    icon: FileText,
    title: "Report Center",
    text: "Generate and export evidence-backed clinical reports as PDF.",
    to: "/reports",
  },
  {
    icon: Sparkles,
    title: "Research Bench",
    text: "Benchmark LLM, RAG, Graph RAG and Agentic Graph RAG.",
    to: "/research",
  },
  {
    icon: Activity,
    title: "Live Dashboard",
    text: "Workspace telemetry, recent consultations and confidence trends.",
    to: "/dashboard",
  },
];

function Landing() {
  return (
    <AppShell
      title="Platform Overview"
      subtitle="Ten clinical modules, 12 specialized agents, one unified evidence trail"
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
      <div className="space-y-10">
        <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card/90 to-card p-6 sm:p-10 backdrop-blur-xl shadow-sm text-center">
          <div className="pointer-events-none absolute inset-0 grid-noise opacity-30" />
          <div className="relative z-10 max-w-4xl mx-auto">
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
              Clinical decision support — not a diagnosis engine
            </Badge>
            <h1 className="mx-auto mt-5 max-w-3xl text-balance font-display text-3xl font-bold leading-tight sm:text-5xl">
              Explainable <span className="text-gradient">multi-agent</span> clinical intelligence
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm sm:text-base leading-relaxed text-muted-foreground">
              MEDGUIDE AI assists clinicians and medical students by collecting clinical
              information, retrieving trusted evidence, analysing medical images, checking drug
              safety and generating explainable reports — with every conclusion traced back to its
              source.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="default" className="w-full sm:w-auto">
                <Link to="/consultation">
                  Start a consultation <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="default" variant="outline" className="w-full sm:w-auto">
                <Link to="/research">See the research bench</Link>
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {AGENTS.map((a) => (
                <div
                  key={a.id}
                  className="glass rounded-xl px-3.5 py-3 text-left transition-transform hover:-translate-y-0.5"
                >
                  <p className="font-display text-xs font-semibold text-primary">{a.short}</p>
                  <p className="mt-1 text-[0.7rem] leading-snug text-muted-foreground">
                    {a.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl sm:text-2xl font-semibold">
            Clinical workspace modules
          </h2>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-muted-foreground">
            Each module writes into the same explainability layer, so any output can be audited down
            to the papers, guidelines and graph relationships that produced it.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {modules.map((m) => (
              <Link
                key={m.title}
                to={m.to}
                className="glass group rounded-xl p-4 transition-all hover:-translate-y-1 hover:border-primary/40"
              >
                <m.icon className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
                <p className="mt-3 font-display text-sm font-semibold">{m.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{m.text}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="pb-6">
          <div className="glass-strong flex flex-col gap-4 rounded-2xl p-6 sm:p-7 sm:flex-row sm:items-center">
            <ShieldCheck className="h-8 w-8 shrink-0 text-success" />
            <div className="flex-1">
              <p className="font-display text-sm font-semibold">Safety first, by construction</p>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                A dedicated Safety Agent audits every response for unsupported claims,
                contradictions and dangerous recommendations. Confidence is reported as High, Medium
                or Low rather than a misleading percentage. {DISCLAIMER}
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link to="/explainability" search={{ id: undefined }}>
                View explainability
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
