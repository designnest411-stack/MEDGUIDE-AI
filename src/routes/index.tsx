import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  GitBranch,
  Image as ImageIcon,
  Library,
  Microscope,
  Pill,
  ScanEye,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Plus,
  Activity,
  Hexagon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AGENTS, DISCLAIMER } from "@/lib/agents/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MEDGUIDE AI — Explainable Multi-Agent Clinical Intelligence" },
      {
        name: "description",
        content:
          "Evidence-based clinical decision support for clinicians and medical students: 12 specialised agents, PubMed and FDA evidence, explainable reasoning and confidence bands.",
      },
      { property: "og:title", content: "MEDGUIDE AI — Explainable Clinical Intelligence" },
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
    icon: Sparkles,
    title: "Research Bench",
    text: "Benchmark LLM, RAG, Graph RAG and Agentic Graph RAG.",
    to: "/research",
  },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2 group cursor-default">
          <div className="relative flex aspect-square size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-[#A073D9]/20 shadow-sm ring-1 ring-primary/30 overflow-hidden">
            <div className="absolute inset-0 bg-primary/10 group-hover:animate-pulse" />
            <Brain className="size-6 text-primary transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight bg-gradient-to-r from-primary via-[#A073D9] to-primary bg-clip-text text-transparent animate-text-shimmer ml-1">
            MEDGUIDE AI
          </span>
        </div>
        <Button asChild size="sm">
          <Link to="/dashboard">
            Open platform <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-noise opacity-40" />
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <Plus className="absolute top-[10%] left-[15%] w-24 h-24 text-primary animate-float-slow" />
          <Activity className="absolute bottom-[30%] left-[80%] w-32 h-32 text-primary animate-float-slower" />
          <Hexagon
            className="absolute top-[50%] right-[10%] w-16 h-16 text-primary animate-float-slow"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
              Clinical decision support — not a diagnosis engine
            </Badge>
            <h1 className="mx-auto mt-6 max-w-4xl text-balance font-display text-4xl font-bold leading-[1.08] sm:text-6xl">
              Explainable <span className="text-gradient">multi-agent</span> clinical intelligence
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
              MEDGUIDE AI assists clinicians and medical students by collecting clinical
              information, retrieving trusted evidence, analysing medical images, checking drug
              safety and generating explainable reports — with every conclusion traced back to its
              source.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/consultation">
                  Start a consultation <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link to="/research">See the research bench</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5"
          >
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
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <h2 className="font-display text-2xl font-semibold">
          Ten clinical modules, one evidence trail
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Each module writes into the same explainability layer, so any output can be audited down
          to the papers, guidelines and graph relationships that produced it.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((m) => (
            <Link
              key={m.title}
              to={m.to}
              className="glass group rounded-xl p-4 transition-all hover:-translate-y-1 hover:border-primary/40"
            >
              <m.icon className="h-5 w-5 text-primary" />
              <p className="mt-3 font-display text-sm font-semibold">{m.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{m.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="glass-strong flex flex-col gap-4 rounded-2xl p-7 sm:flex-row sm:items-center">
          <ShieldCheck className="h-8 w-8 shrink-0 text-success" />
          <div className="flex-1">
            <p className="font-display text-sm font-semibold">Safety first, by construction</p>
            <p className="mt-1 text-sm text-muted-foreground">
              A dedicated Safety Agent audits every response for unsupported claims, contradictions
              and dangerous recommendations. Confidence is reported as High, Medium or Low rather
              than a misleading percentage. {DISCLAIMER}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/explainability" search={{ id: undefined }}>
              View explainability
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
