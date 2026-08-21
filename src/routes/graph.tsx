import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GitBranch } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { GlassCard, SectionTitle } from "@/components/medical-ui";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader } from "@/components/ui/card";
import { query, orderBy, limit } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

import { getCollections, useTypedCollection, type ConsultationRecord } from "@/lib/db";
import { auth } from "@/lib/firebase";
import { DISEASES, NODE_COLORS, buildGraph, matchDiseases } from "@/lib/medical/graph";
import type { Edge, Node } from "@xyflow/react";

// Lazy-load React Flow — it's a large bundle (~350 kB) only needed on this page
const ReactFlowGraph = lazy(() => import("@/components/react-flow-graph"));

export const Route = createFileRoute("/graph")({
  head: () => ({
    meta: [
      { title: "Knowledge Graph — MEDGUIDE AI" },
      {
        name: "description",
        content:
          "Explore relationships between diseases, symptoms, risk factors, drugs, treatments and complications.",
      },
      { property: "og:title", content: "Knowledge Graph — MEDGUIDE AI" },
      {
        property: "og:description",
        content:
          "An interactive clinical knowledge graph connecting diseases to treatments and complications.",
      },
    ],
  }),
  component: GraphPage,
});

function GraphPage() {
  const [selected, setSelected] = useState<string>(DISEASES[0]!.id);

  const [user] = useAuthState(auth);
  const cols = user ? getCollections(user.uid) : null;
  const [consultationsDocs] = useTypedCollection<ConsultationRecord>(
    cols ? query(cols.consultations, orderBy("createdAt", "desc"), limit(1)) : null,
  );
  const lastConsult = consultationsDocs?.[0];

  const syncedRef = useRef(false);
  useEffect(() => {
    if (syncedRef.current || !lastConsult) return;
    const text = [
      lastConsult.question,
      ...(lastConsult.result?.reasoning?.differentials ?? []).map(
        (d: { condition: string }) => d.condition,
      ),
    ].join(" ");
    const hit = matchDiseases(text, 1)[0];
    if (hit) {
      syncedRef.current = true;
      setSelected(hit.id);
    }
  }, [lastConsult]);

  const { nodes, edges } = useMemo(() => {
    const g = buildGraph([selected]);
    const byType: Record<string, number> = {};
    const columns: Record<string, number> = {
      disease: 0,
      symptom: 1,
      risk: 2,
      lab: 3,
      drug: 4,
      treatment: 5,
      contraindication: 6,
      complication: 7,
    };

    const rfNodes: Node[] = g.nodes.map((n) => {
      const col = columns[n.type] ?? 0;
      const row = (byType[n.type] = (byType[n.type] ?? 0) + 1);
      return {
        id: n.id,
        position: { x: col * 230, y: row * 78 },
        data: { label: n.label },
        style: {
          background: "rgba(14,22,34,0.85)",
          color: "#e6edf6",
          border: `1px solid ${NODE_COLORS[n.type]}`,
          borderRadius: 10,
          fontSize: 11,
          padding: "6px 10px",
          width: 190,
        },
      };
    });

    const rfEdges: Edge[] = g.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label ?? "",
      animated: true,
      style: { stroke: "rgba(120,170,255,0.35)" },
      labelStyle: { fill: "#8fa5c0", fontSize: 9 },
    }));

    return { nodes: rfNodes, edges: rfEdges };
  }, [selected]);

  return (
    <AppShell
      title="Knowledge Graph"
      subtitle="Disease → symptom → drug → treatment relationships"
      wide
    >
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <GlassCard>
          <CardHeader className="pb-2">
            <SectionTitle icon={GitBranch} title="Conditions" hint="Select to traverse" />
          </CardHeader>
          <CardContent className="space-y-1.5">
            <p className="mb-2 rounded-md border border-border/60 bg-card/40 p-2 text-[0.68rem] leading-relaxed text-muted-foreground">
              This is a curated reference knowledge base, not output from your run — it is always
              available so you can traverse relationships on demand.
              {lastConsult ? " Pre-selected from your latest consultation." : ""}
            </p>
            {DISEASES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelected(d.id)}
                className={`w-full rounded-lg border px-3 py-2.5 text-left text-xs transition-colors touch-manipulation active:scale-[0.99] ${
                  selected === d.id
                    ? "border-primary/50 bg-primary/10 text-primary font-medium"
                    : "border-border/60 bg-card/40 hover:border-primary/30"
                }`}
              >
                {d.label}
              </button>
            ))}
            <div className="pt-3">
              <p className="mb-2 text-[0.68rem] uppercase tracking-wider text-muted-foreground">
                Legend
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(NODE_COLORS).map(([type, color]) => (
                  <Badge
                    key={type}
                    variant="outline"
                    className="text-[0.6rem]"
                    style={{ borderColor: color, color }}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardContent className="h-[52vh] sm:h-[70vh] p-2">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Loading graph…
                </div>
              }
            >
              <ReactFlowGraph nodes={nodes} edges={edges} />
            </Suspense>
          </CardContent>
        </GlassCard>
      </div>
    </AppShell>
  );
}
