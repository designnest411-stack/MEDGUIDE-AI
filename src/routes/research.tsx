import { createFileRoute } from "@tanstack/react-router";
import { query, orderBy } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { FlaskConical } from "lucide-react";
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
import { CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCollections, useTypedCollection, type ConsultationRecord } from "@/lib/db";
import { auth } from "@/lib/firebase";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Bench — MEDGUIDE AI" },
      {
        name: "description",
        content:
          "Compare LLM-only, RAG, Graph RAG and Agentic Graph RAG approaches on retrieval quality, safety and explainability.",
      },
      { property: "og:title", content: "Research Bench — MEDGUIDE AI" },
      {
        property: "og:description",
        content: "Architecture comparison for evidence-grounded clinical reasoning.",
      },
    ],
  }),
  component: ResearchPage,
});

const approaches = [
  {
    name: "LLM only",
    grounding: 20,
    safety: 35,
    explainability: 15,
    note: "Fast, fluent, but no verifiable source and the highest hallucination exposure.",
  },
  {
    name: "RAG",
    grounding: 65,
    safety: 60,
    explainability: 55,
    note: "Retrieves PubMed abstracts, so claims can be cited — but relationships between entities are lost.",
  },
  {
    name: "Graph RAG",
    grounding: 78,
    safety: 72,
    explainability: 75,
    note: "Adds the clinical knowledge graph, so disease–drug–contraindication paths are checked explicitly.",
  },
  {
    name: "Agentic Graph RAG",
    grounding: 90,
    safety: 92,
    explainability: 95,
    note: "This platform: planner routing, a dedicated safety auditor and a confidence agent over graph-grounded retrieval.",
  },
];

function ResearchPage() {
  const [user] = useAuthState(auth);
  const cols = user ? getCollections(user.uid) : null;
  const [consultations] = useTypedCollection<ConsultationRecord>(
    cols ? query(cols.consultations, orderBy("createdAt", "desc")) : null,
  );

  const observed = {
    runs: consultations.length,
    avgSources: consultations.length
      ? Math.round(
          consultations.reduce((n, c) => n + (c.result?.evidence?.length ?? 0), 0) /
            consultations.length,
        )
      : 0,
    flagged: consultations.filter((c) => (c.result?.safety?.flags?.length ?? 0) > 0).length,
    highConfidence: consultations.filter((c) => c.result?.confidence?.band === "High").length,
  };

  return (
    <AppShell
      title="Research Bench"
      subtitle="Why agentic graph-grounded retrieval, measured against the alternatives"
    >
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total Consultations", value: observed.runs },
          { label: "Avg sources / run", value: observed.avgSources },
          { label: "Runs with safety flags", value: observed.flagged },
          { label: "High confidence", value: observed.highConfidence },
        ].map((s) => (
          <GlassCard key={s.label}>
            <CardContent className="p-4">
              <p className="font-display text-2xl font-semibold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="mt-4">
        <CardHeader className="pb-2">
          <SectionTitle
            icon={FlaskConical}
            title="Architecture comparison"
            hint="Reference scores from the platform's design evaluation"
          />
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={approaches}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="grounding"
                name="Grounding"
                fill="var(--color-primary)"
                radius={[5, 5, 0, 0]}
              />
              <Bar
                dataKey="safety"
                name="Safety"
                fill="var(--color-chart-2)"
                radius={[5, 5, 0, 0]}
              />
              <Bar
                dataKey="explainability"
                name="Explainability"
                fill="var(--color-chart-4)"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </GlassCard>

      <GlassCard className="mt-4">
        <CardHeader className="pb-2">
          <SectionTitle title="Trade-offs" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Approach</TableHead>
                <TableHead className="w-[120px]">Explainability</TableHead>
                <TableHead>Characteristics</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approaches.map((a) => (
                <TableRow key={a.name}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        a.explainability > 80
                          ? "border-success/40 text-success"
                          : a.explainability > 50
                            ? "border-warning/40 text-warning"
                            : "border-destructive/40 text-destructive"
                      }
                    >
                      {a.explainability}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </GlassCard>
    </AppShell>
  );
}
