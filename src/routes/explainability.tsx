import { createFileRoute } from "@tanstack/react-router";
import { query, orderBy, limit, doc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { CheckCircle2, ScanEye, XCircle } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";

import { AppShell } from "@/components/app-shell";
import {
  AgentPill,
  ConfidenceBadge,
  EmptyState,
  EvidenceItem,
  GlassCard,
  SectionTitle,
} from "@/components/medical-ui";
import { CardContent, CardHeader } from "@/components/ui/card";
import {
  getCollections,
  useTypedCollection,
  useTypedDocument,
  type ConsultationRecord,
} from "@/lib/db";
import { auth } from "@/lib/firebase";
import type { AgentId } from "@/lib/agents/types";

export const Route = createFileRoute("/explainability")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search["id"] === "string" ? (search["id"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Explainability — MEDGUIDE AI" },
      {
        name: "description",
        content:
          "See why a conclusion was reached: supporting evidence, contradicting evidence, guidelines and confidence breakdown.",
      },
      { property: "og:title", content: "Explainability — MEDGUIDE AI" },
      {
        property: "og:description",
        content:
          "Full reasoning traces, evidence and confidence signals behind every clinical answer.",
      },
    ],
  }),
  component: ExplainPage,
});

function ExplainPage() {
  const { id } = Route.useSearch();
  const [user] = useAuthState(auth);
  const cols = user ? getCollections(user.uid) : null;

  const [docData] = useTypedDocument<ConsultationRecord>(
    cols && id ? doc(cols.consultations, id) : null,
  );

  const [latestDocs] = useTypedCollection<ConsultationRecord>(
    cols && !id ? query(cols.consultations, orderBy("createdAt", "desc"), limit(1)) : null,
  );

  const record = id ? docData : latestDocs?.[0];

  const r = record?.result;

  const radar = r?.confidence
    ? [
        {
          metric: "Source agreement",
          value: Math.round((r.confidence.sourceAgreement ?? 0) * 100),
        },
        { metric: "Guidelines", value: Math.round((r.confidence.guidelineAgreement ?? 0) * 100) },
        { metric: "Retrieval", value: Math.round((r.confidence.retrievalQuality ?? 0) * 100) },
        { metric: "Graph", value: Math.round((r.confidence.graphConsistency ?? 0) * 100) },
        {
          metric: "Completeness",
          value: Math.round((r.confidence.evidenceCompleteness ?? 0) * 100),
        },
        { metric: "Safety", value: Math.round((1 - (r.confidence.hallucinationRisk ?? 0)) * 100) },
      ]
    : [];

  return (
    <AppShell
      title="Explainability"
      subtitle="Why the platform reached this conclusion"
      wide
      actions={r?.confidence ? <ConfidenceBadge band={r.confidence.band} /> : undefined}
    >
      {!record || !r ? (
        <EmptyState
          icon={ScanEye}
          title="No consultation to explain"
          description="Run and save a consultation — its full reasoning path, evidence and confidence signals appear here."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <GlassCard>
              <CardHeader className="pb-2">
                <SectionTitle title="Question" hint={new Date(record.createdAt).toLocaleString()} />
              </CardHeader>
              <CardContent>
                <p className="text-sm">{record.question}</p>
                {r.explain?.why && (
                  <p className="mt-3 border-t border-border/60 pt-3 text-sm leading-relaxed text-muted-foreground">
                    {r.explain.why}
                  </p>
                )}
              </CardContent>
            </GlassCard>

            <div className="grid gap-4 md:grid-cols-2">
              <GlassCard>
                <CardHeader className="pb-2">
                  <SectionTitle icon={CheckCircle2} title="Supporting" />
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {(r.explain?.supporting ?? []).map((s, i) => (
                    <p
                      key={i}
                      className="rounded-md border border-success/25 bg-success/5 p-2 text-xs leading-relaxed"
                    >
                      {s}
                    </p>
                  ))}
                  {!r.explain?.supporting?.length && (
                    <p className="text-xs text-muted-foreground">None recorded.</p>
                  )}
                </CardContent>
              </GlassCard>

              <GlassCard>
                <CardHeader className="pb-2">
                  <SectionTitle icon={XCircle} title="Contradicting" />
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {(r.explain?.contradicting ?? []).map((s, i) => (
                    <p
                      key={i}
                      className="rounded-md border border-destructive/25 bg-destructive/5 p-2 text-xs leading-relaxed"
                    >
                      {s}
                    </p>
                  ))}
                  {!r.explain?.contradicting?.length && (
                    <p className="text-xs text-muted-foreground">None recorded.</p>
                  )}
                </CardContent>
              </GlassCard>
            </div>

            {r.explain?.guidelines?.length ? (
              <GlassCard>
                <CardHeader className="pb-2">
                  <SectionTitle title="Guideline alignment" />
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {r.explain.guidelines.map((g, i) => (
                    <p key={i} className="text-xs leading-relaxed text-muted-foreground">
                      • {g}
                    </p>
                  ))}
                </CardContent>
              </GlassCard>
            ) : null}

            <GlassCard>
              <CardHeader className="pb-2">
                <SectionTitle title="Evidence trail" hint={`${r.evidence.length} sources`} />
              </CardHeader>
              <CardContent className="grid gap-2 md:grid-cols-2">
                {r.evidence.map((e) => (
                  <EvidenceItem key={e.id} source={e} />
                ))}
              </CardContent>
            </GlassCard>
          </div>

          <div className="space-y-4">
            {r.confidence && (
              <GlassCard>
                <CardHeader className="pb-2">
                  <SectionTitle title="Confidence signals" hint={r.confidence.reasoning} />
                </CardHeader>
                <CardContent className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radar} outerRadius="70%">
                      <PolarGrid stroke="var(--color-border)" />
                      <PolarAngleAxis
                        dataKey="metric"
                        tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }}
                      />
                      <Radar
                        dataKey="value"
                        stroke="var(--color-primary)"
                        fill="var(--color-primary)"
                        fillOpacity={0.25}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </GlassCard>
            )}

            <GlassCard>
              <CardHeader className="pb-2">
                <SectionTitle title="Agent trace" hint="Step-by-step verification pipeline" />
              </CardHeader>
              <CardContent className="space-y-1.5">
                {r.traces.map((t) => (
                  <AgentPill
                    key={t.agent}
                    agent={t.agent as AgentId}
                    status={t.status}
                    {...(t.summary ? { summary: t.summary } : {})}
                  />
                ))}
              </CardContent>
            </GlassCard>
          </div>
        </div>
      )}
    </AppShell>
  );
}
