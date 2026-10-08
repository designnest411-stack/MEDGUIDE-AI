import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  FlaskConical,
  FileText,
  Download,
  CheckCircle2,
  ShieldCheck,
  Brain,
  Search,
  Clock,
  Layers,
  BookOpen,
  Filter,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { GlassCard, SectionTitle } from "@/components/medical-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BENCHMARK_RESULTS,
  BENCHMARK_VIGNETTES,
  LATENCY_STAGES,
  MODEL_FACTS_SPEC,
  PAPER_CASE_STUDIES,
  type BenchmarkArchitecture,
} from "@/lib/research/benchmark-data";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Bench & Empirical Evaluation : MEDGUIDE AI" },
      {
        name: "description",
        content:
          "Empirical benchmark results across 50 multi-system clinical vignettes comparing Zero-Shot LLM, Vector RAG, Graph RAG, and Agentic Graph RAG.",
      },
      { property: "og:title", content: "Research Bench & Empirical Evaluation : MEDGUIDE AI" },
      {
        property: "og:description",
        content:
          "Full research paper evaluation, mathematical formulation, and multi-specialty clinical benchmark suite.",
      },
    ],
  }),
  component: ResearchPage,
});

export function ResearchPage() {
  const [selectedDomain, setSelectedDomain] = useState<string>("All");
  const [vignetteSearch, setVignetteSearch] = useState<string>("");
  const [selectedVignetteId, setSelectedVignetteId] = useState<string>("card-001");

  const architecturesList = useMemo(
    () => Object.values(BENCHMARK_RESULTS.architectures) as BenchmarkArchitecture[],
    [],
  );

  const chartData = useMemo(() => {
    return architecturesList.map((a) => ({
      name: a.name.replace(" (MEDGUIDE AI)", "").replace(" (Zero-Shot)", ""),
      grounding: a.meanGrounding,
      safety: a.meanSafety,
      explainability: a.meanExplainability,
      ghostCitation: a.meanGhostCitation,
    }));
  }, [architecturesList]);

  const domainChartData = useMemo(() => {
    return Object.entries(BENCHMARK_RESULTS.domainBreakdown).map(([domain, stats]) => ({
      domain,
      grounding: stats.grounding,
      safety: stats.safety,
      explainability: stats.explainability,
      cases: stats.count,
    }));
  }, []);

  const domains = useMemo(() => {
    return ["All", ...Object.keys(BENCHMARK_RESULTS.domainBreakdown)];
  }, []);

  const filteredVignettes = useMemo(() => {
    return BENCHMARK_VIGNETTES.filter((v) => {
      const matchDomain = selectedDomain === "All" || v.domain === selectedDomain;
      const q = vignetteSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        v.title.toLowerCase().includes(q) ||
        v.presentation.toLowerCase().includes(q) ||
        v.domain.toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q);
      return matchDomain && matchSearch;
    });
  }, [selectedDomain, vignetteSearch]);

  const activeVignette = useMemo(() => {
    return (
      BENCHMARK_VIGNETTES.find((v) => v.id === selectedVignetteId) || BENCHMARK_VIGNETTES[0]!
    );
  }, [selectedVignetteId]);

  return (
    <AppShell
      title="Research Bench"
      subtitle="Empirical evaluation and peer-reviewed benchmark results across 50 clinical vignettes"
    >
      {/* Paper Header Banner */}
      <GlassCard className="mb-6 border-primary/30 bg-gradient-to-r from-card via-card to-primary/[0.04]">
        <CardContent className="p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[0.7rem] uppercase tracking-wider">
                  IEEE Transactions Research Manuscript
                </Badge>
                <Badge variant="outline" className="border-border text-muted-foreground font-mono text-[0.7rem]">
                  Department of Computer Science & Engineering (AI & ML), PCCOE Pune
                </Badge>
              </div>
              <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Agentic Graph RAG for Explainable Multimodal Clinical Decision Support with Verifiable Evidence and Client-Side Radiographic Saliency
              </h1>
              <p className="text-sm text-muted-foreground max-w-4xl leading-relaxed">
                Authored by Vikram Kadam, Keshav Mittal, Sandesh Phad, Tejas Shidam, and Madhuri Pagale. Evaluates a 12-agent orchestration framework integrating live biomedical retrieval (PubMed, Europe PMC, WHO, ClinicalTrials.gov), relational clinical knowledge graphs ($G=(V,E)$), deterministic pharmacovigilance (openFDA, RxNav), and in-browser WebAssembly DenseNet-121 occlusion saliency.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a href="/paper/main.pdf" target="_blank" rel="noopener noreferrer">
                <Button className="gap-2 rounded-md font-medium shadow-sm">
                  <Download className="h-4 w-4" /> Download Manuscript PDF
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </GlassCard>

      {/* Top Level Metric Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          {
            label: "Evidence Grounding Rate",
            value: "90.3%",
            baseline: "+70.5% vs Zero-Shot (19.8%)",
            desc: "Proportion of diagnostic claims backed by live verified citations",
            icon: BookOpen,
          },
          {
            label: "Safety Compliance",
            value: "92.2%",
            baseline: "+57.6% vs Zero-Shot (34.6%)",
            desc: "Recall of critical contraindications, allergy clashes, and red flags",
            icon: ShieldCheck,
          },
          {
            label: "Explainability Score",
            value: "95.2%",
            baseline: "+80.9% vs Zero-Shot (14.3%)",
            desc: "Standardized 5-criterion rubric evaluating causal clinical reasoning",
            icon: Brain,
          },
          {
            label: "Ghost Citation Rate",
            value: "0.0%",
            baseline: "-78.4% vs Zero-Shot (78.4%)",
            desc: "Zero hallucinated PMIDs or non-existent trial IDs in output reports",
            icon: CheckCircle2,
          },
        ].map((s) => (
          <GlassCard key={s.label}>
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </span>
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs font-medium text-success">{s.baseline}</p>
              <p className="text-[0.75rem] text-muted-foreground leading-tight pt-1">{s.desc}</p>
            </CardContent>
          </GlassCard>
        ))}
      </div>

      {/* Deep Research Tabs */}
      <Tabs defaultValue="comparative" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 rounded-md p-1 bg-muted/60">
          <TabsTrigger value="comparative" className="rounded-sm text-xs font-medium">
            Comparative Benchmark
          </TabsTrigger>
          <TabsTrigger value="domains" className="rounded-sm text-xs font-medium">
            Specialty Domains & Cases
          </TabsTrigger>
          <TabsTrigger value="vignettes" className="rounded-sm text-xs font-medium">
            50-Vignette Explorer
          </TabsTrigger>
          <TabsTrigger value="governance" className="rounded-sm text-xs font-medium">
            Model Facts & WHO 2024
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Comparative Benchmark */}
        <TabsContent value="comparative" className="space-y-6">
          <GlassCard>
            <CardHeader className="pb-2">
              <SectionTitle
                icon={FlaskConical}
                title="Empirical Architecture Comparison"
                hint="Evaluated across 50 multi-system clinical vignettes (n=50) under standardized temperature T=0.2"
              />
            </CardHeader>
            <CardContent>
              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.6} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Bar
                      dataKey="grounding"
                      name="Evidence Grounding (%)"
                      fill="var(--color-primary)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="safety"
                      name="Safety Compliance (%)"
                      fill="var(--color-chart-2)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="explainability"
                      name="Explainability Score (%)"
                      fill="var(--color-chart-4)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="ghostCitation"
                      name="Ghost Citation Rate (%)"
                      fill="var(--color-destructive)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </GlassCard>

          {/* Full Table I / Table IV */}
          <GlassCard>
            <CardHeader className="pb-2">
              <SectionTitle
                icon={FileText}
                title="Table I: Quantitative Benchmark Comparison across 50 Clinical Vignettes"
                hint="Reported as Mean ± Standard Deviation with [95% Confidence Intervals]"
              />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/80">
                      <TableHead className="font-semibold text-foreground">Architecture</TableHead>
                      <TableHead className="font-semibold text-foreground">Grounding (GR)</TableHead>
                      <TableHead className="font-semibold text-foreground">Safety (SC)</TableHead>
                      <TableHead className="font-semibold text-foreground">Explainability (EF)</TableHead>
                      <TableHead className="font-semibold text-foreground">Latency (L)</TableHead>
                      <TableHead className="font-semibold text-foreground">Ghost Cit.</TableHead>
                      <TableHead className="font-semibold text-foreground">Primary Failure Mode</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {architecturesList.map((a) => {
                      const isProposed = a.name.includes("Agentic Graph RAG");
                      return (
                        <TableRow
                          key={a.name}
                          className={isProposed ? "bg-primary/[0.05] font-medium border-primary/30" : ""}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-1.5">
                              {isProposed && <CheckCircle2 className="h-4 w-4 text-primary" />}
                              <span>{a.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="font-mono text-sm">{a.meanGrounding.toFixed(1)}%</span>
                              <span className="text-xs text-muted-foreground ml-1">± {a.sdGrounding}</span>
                              <div className="text-[0.68rem] text-muted-foreground">[{a.ci95Grounding.join(", ")}]</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="font-mono text-sm">{a.meanSafety.toFixed(1)}%</span>
                              <span className="text-xs text-muted-foreground ml-1">± {a.sdSafety}</span>
                              <div className="text-[0.68rem] text-muted-foreground">[{a.ci95Safety.join(", ")}]</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="font-mono text-sm">{a.meanExplainability.toFixed(1)}%</span>
                              <span className="text-xs text-muted-foreground ml-1">± {a.sdExplainability}</span>
                              <div className="text-[0.68rem] text-muted-foreground">[{a.ci95Explainability.join(", ")}]</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{a.meanLatency.toFixed(2)}s</span>
                            <span className="text-xs text-muted-foreground ml-1">± {a.sdLatency}</span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                a.meanGhostCitation === 0
                                  ? "border-success/40 bg-success/10 text-success font-mono"
                                  : "border-destructive/40 bg-destructive/10 text-destructive font-mono"
                              }
                            >
                              {a.meanGhostCitation.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[240px]">
                            {a.primaryFailureMode}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </GlassCard>

          {/* Sub-Component Latency Breakdown */}
          <GlassCard>
            <CardHeader className="pb-2">
              <SectionTitle
                icon={Clock}
                title="Table III: Multi-Agent Sub-Component Latency Profile"
                hint="Deterministic timing breakdown per pipeline stage (Total: 14.80 seconds)"
              />
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 items-center">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pipeline Stage / Workflow Agent</TableHead>
                      <TableHead className="w-[100px] text-right">Latency (s)</TableHead>
                      <TableHead className="w-[100px] text-right">% Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {LATENCY_STAGES.map((s) => (
                      <TableRow key={s.stage}>
                        <TableCell className="text-xs font-medium">{s.stage}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{s.seconds.toFixed(2)}s</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {s.percentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 font-bold bg-muted/20">
                      <TableCell>End-to-End Execution Total</TableCell>
                      <TableCell className="text-right font-mono text-xs">14.80s</TableCell>
                      <TableCell className="text-right font-mono text-xs">100.0%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <div className="space-y-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Latency vs. Clinical Verification Engineering Trade-Off
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The 14.80-second end-to-end execution of MEDGUIDE AI reflects an intentional clinical design choice: multi-source biomedical literature retrieval (PubMed, Europe PMC, WHO) and post-hoc safety auditing take precedence over sub-second conversational latency.
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    For emergency clinical triage workflows, isolated sub-agents such as deterministic drug interaction checking (1.80s) and client-side radiographic saliency (0.45s) execute independently without incurring the complete reasoning chain latency.
                  </p>
                </div>
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>

        {/* TAB 2: Specialty Domains & Case Studies */}
        <TabsContent value="domains" className="space-y-6">
          <GlassCard>
            <CardHeader className="pb-2">
              <SectionTitle
                icon={Layers}
                title="Table II: Domain-Wise Performance Breakdown (Agentic Graph RAG)"
                hint="Performance distribution across 5 clinical specialty domains covering 50 clinical vignettes"
              />
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Specialty Domain</TableHead>
                      <TableHead className="w-[80px] text-right">Cases (n)</TableHead>
                      <TableHead className="w-[100px] text-right">Grounding</TableHead>
                      <TableHead className="w-[100px] text-right">Safety</TableHead>
                      <TableHead className="w-[100px] text-right">Explain.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domainChartData.map((d) => (
                      <TableRow key={d.domain}>
                        <TableCell className="font-medium text-xs">{d.domain}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{d.cases}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-primary">{d.grounding.toFixed(1)}%</TableCell>
                        <TableCell className="text-right font-mono text-xs text-success">{d.safety.toFixed(1)}%</TableCell>
                        <TableCell className="text-right font-mono text-xs">{d.explainability.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 font-bold bg-muted/20">
                      <TableCell>Overall Mean</TableCell>
                      <TableCell className="text-right font-mono text-xs">50</TableCell>
                      <TableCell className="text-right font-mono text-xs text-primary">90.0%</TableCell>
                      <TableCell className="text-right font-mono text-xs text-success">92.0%</TableCell>
                      <TableCell className="text-right font-mono text-xs">95.0%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={domainChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.6} />
                      <XAxis dataKey="domain" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
                      <YAxis domain={[80, 100]} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} unit="%" />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-popover)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 6,
                          fontSize: 11,
                        }}
                      />
                      <Bar dataKey="grounding" name="Grounding" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="safety" name="Safety" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="explainability" name="Explainability" fill="var(--color-chart-4)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </GlassCard>

          {/* Table VIII: 4 Clinical Vignette Case Studies */}
          <GlassCard>
            <CardHeader className="pb-2">
              <SectionTitle
                icon={BookOpen}
                title="Representative Multi-Agent Clinical Case Studies"
                hint="End-to-end execution traces demonstrating evidence grounding and safety blocks"
              />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {PAPER_CASE_STUDIES.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-border/80 bg-muted/20 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                      <h3 className="font-display text-sm font-semibold text-foreground">{c.scenario}</h3>
                      <Badge variant="outline" className="font-mono text-[0.65rem] uppercase">
                        Verified Trace
                      </Badge>
                    </div>

                    <div>
                      <p className="text-[0.7rem] font-mono uppercase text-muted-foreground tracking-wider">
                        Patient Presentation
                      </p>
                      <p className="text-xs text-foreground/90 mt-0.5 leading-relaxed">{c.presentation}</p>
                    </div>

                    <div>
                      <p className="text-[0.7rem] font-mono uppercase text-muted-foreground tracking-wider">
                        Prioritized Differentials
                      </p>
                      <ul className="mt-1 space-y-0.5 text-xs text-foreground/90">
                        {c.prioritizedDifferentials.map((d) => (
                          <li key={d} className="flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-primary" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-[0.7rem] font-mono uppercase text-muted-foreground tracking-wider">
                        Grounded Citations
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.groundedCitations.map((cite) => (
                          <span
                            key={cite}
                            className="rounded border border-evidence/40 bg-evidence/10 px-1.5 py-0.5 font-mono text-[0.65rem] text-evidence"
                          >
                            {cite}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded border border-warning/30 bg-warning/5 p-2.5">
                      <p className="text-[0.7rem] font-semibold text-warning">
                        {c.safetyAuditFlags}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>

        {/* TAB 3: 50-Vignette Explorer */}
        <TabsContent value="vignettes" className="space-y-6">
          <GlassCard>
            <CardHeader className="pb-2">
              <SectionTitle
                icon={Search}
                title="50-Vignette Benchmark Dataset Explorer"
                hint="Explore all multi-system clinical vignettes with reference ground truth and contraindications"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clinical presentation, condition, age, vitals..."
                    value={vignetteSearch}
                    onChange={(e) => setVignetteSearch(e.target.value)}
                    className="pl-8 text-xs"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                  {domains.map((d) => (
                    <Button
                      key={d}
                      size="sm"
                      variant={selectedDomain === d ? "default" : "outline"}
                      onClick={() => setSelectedDomain(d)}
                      className="h-7 text-xs rounded-md"
                    >
                      {d}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-12 items-start">
                {/* Vignette List */}
                <div className="lg:col-span-5 max-h-[600px] overflow-y-auto space-y-2 pr-1">
                  <p className="text-xs font-mono text-muted-foreground">
                    Showing {filteredVignettes.length} of 50 vignettes
                  </p>
                  {filteredVignettes.map((v) => {
                    const isSelected = v.id === activeVignette.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVignetteId(v.id)}
                        className={`cursor-pointer rounded-md border p-3 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/[0.08]"
                            : "border-border/70 bg-card hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[0.65rem] text-primary uppercase">
                            {v.id} · {v.domain}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {v.age}y {v.sex}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-foreground mt-1 line-clamp-1">
                          {v.title}
                        </h4>
                        <p className="text-[0.75rem] text-muted-foreground line-clamp-2 mt-0.5">
                          {v.presentation}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Vignette Detailed Ground-Truth View */}
                <div className="lg:col-span-7 rounded-lg border border-border bg-card p-5 space-y-4">
                  <div className="border-b border-border/80 pb-3 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[0.68rem] text-primary">
                          {activeVignette.domain}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground">
                          ID: {activeVignette.id}
                        </span>
                      </div>
                      <h3 className="font-display text-base font-bold text-foreground mt-1">
                        {activeVignette.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Demographics: {activeVignette.age} years old ({activeVignette.sex})
                      </p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      Clinical Presentation
                    </h5>
                    <p className="text-xs text-foreground/90 mt-1 leading-relaxed">
                      {activeVignette.presentation}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded border border-border/60 bg-muted/20 p-2.5">
                      <h5 className="font-mono text-[0.7rem] uppercase text-muted-foreground">
                        Vital Signs
                      </h5>
                      <p className="font-mono text-xs text-foreground/90 mt-1">{activeVignette.vitals}</p>
                    </div>
                    <div className="rounded border border-border/60 bg-muted/20 p-2.5">
                      <h5 className="font-mono text-[0.7rem] uppercase text-muted-foreground">
                        Laboratory & ECG Markers
                      </h5>
                      <p className="text-xs text-foreground/90 mt-1">{activeVignette.labs}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <h5 className="font-mono text-[0.7rem] uppercase text-muted-foreground">
                        Active Medications
                      </h5>
                      <p className="text-xs text-foreground/90 mt-0.5">{activeVignette.medications}</p>
                    </div>
                    <div>
                      <h5 className="font-mono text-[0.7rem] uppercase text-muted-foreground">
                        Documented Allergies
                      </h5>
                      <p className="text-xs text-foreground/90 mt-0.5">{activeVignette.allergies}</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      Reference Ground-Truth Differentials
                    </h5>
                    <div className="mt-1 space-y-1">
                      {activeVignette.referenceDifferentials.map((ref) => (
                        <div
                          key={ref.condition}
                          className="flex items-center justify-between rounded border border-border/60 bg-muted/10 px-2.5 py-1.5 text-xs"
                        >
                          <span className="font-medium text-foreground">{ref.condition}</span>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                ref.likelihood === "high"
                                  ? "border-success/40 text-success text-[0.65rem]"
                                  : ref.likelihood === "moderate"
                                    ? "border-warning/40 text-warning text-[0.65rem]"
                                    : "border-muted-foreground text-[0.65rem]"
                              }
                            >
                              {ref.likelihood.toUpperCase()}
                            </Badge>
                            <span className="font-mono text-[0.65rem] text-muted-foreground">
                              Grounded
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-mono text-xs uppercase tracking-wider text-destructive">
                      True Safety Contraindications
                    </h5>
                    <ul className="mt-1 space-y-1">
                      {activeVignette.trueContraindications.map((c) => (
                        <li
                          key={c}
                          className="flex items-start gap-1.5 rounded border border-destructive/20 bg-destructive/5 p-2 text-xs text-foreground/90"
                        >
                          <span className="font-bold text-destructive">!</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      Expected Biomedical Citations
                    </h5>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {activeVignette.expectedCitations.map((cite) => (
                        <span
                          key={cite}
                          className="rounded border border-evidence/40 bg-evidence/10 px-2 py-0.5 font-mono text-[0.68rem] text-evidence"
                        >
                          {cite}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>

        {/* TAB 4: Model Facts & WHO 2024 Governance */}
        <TabsContent value="governance" className="space-y-6">
          <GlassCard>
            <CardHeader className="pb-2">
              <SectionTitle
                icon={ShieldCheck}
                title="Table VI: MEDGUIDE AI Model Facts Specification"
                hint="Following the clinical machine learning transparency framework by Sendak et al. (npj Digital Medicine)"
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Specification Dimension</TableHead>
                    <TableHead>Clinical & Operational Boundary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODEL_FACTS_SPEC.map((m) => (
                    <TableRow key={m.dimension}>
                      <TableCell className="font-semibold text-xs font-mono">{m.dimension}</TableCell>
                      <TableCell className="text-xs text-foreground/90 leading-relaxed">{m.specification}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </GlassCard>

          <GlassCard>
            <CardHeader className="pb-2">
              <SectionTitle
                icon={CheckCircle2}
                title="World Health Organization (WHO) 2024 LMM Guidance Alignment"
                hint="Core governance principles from WHO Guidance on Large Multi-Modal Models in Health"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <h4 className="font-display text-sm font-semibold text-foreground">
                    Human-in-the-Loop Decision Boundary
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The platform enforces strict non-autonomous operating rules. All generated outputs include prominent disclaimers requiring clinical verification by qualified medical professionals.
                  </p>
                </div>

                <div className="rounded-lg border border-border p-4 space-y-2">
                  <h4 className="font-display text-sm font-semibold text-foreground">
                    Verifiable Literature Provenance
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Every diagnostic assertion is linked to an Oxford CEBM-graded citation. Unverified citations and ghost identifiers are pruned by the post-hoc Safety Auditor Agent.
                  </p>
                </div>

                <div className="rounded-lg border border-border p-4 space-y-2">
                  <h4 className="font-display text-sm font-semibold text-foreground">
                    Client-Side Radiographic Privacy
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Thoracic radiograph saliency localization is executed locally within the clinician's browser using WebAssembly and ONNX Runtime, preserving privacy by avoiding cloud pixel uploads.
                  </p>
                </div>
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
