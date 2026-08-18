import { createFileRoute } from "@tanstack/react-router";
import { useSyncExternalStore, useMemo } from "react";
import { Activity } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { AgentPill, GlassCard, SectionTitle } from "@/components/medical-ui";
import { CardContent, CardHeader } from "@/components/ui/card";
import { consultRunStore } from "@/lib/consult-run-store";
import { AGENTS, type AgentId } from "@/lib/agents/types";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Agent Pipeline — MEDGUIDE AI" },
      { name: "description", content: "Live status of the clinical reasoning agent pipeline." },
    ],
  }),
  component: PipelinePage,
});

function PipelinePage() {
  const run$ = useSyncExternalStore(
    consultRunStore.subscribe,
    consultRunStore.getSnapshot,
    consultRunStore.getServerSnapshot,
  );

  const { running, statuses, result } = run$;
  const agentList = useMemo(() => AGENTS.filter((a) => a.id !== "research"), []);

  return (
    <AppShell
      title="Agent Pipeline"
      subtitle="Live execution status of clinical reasoning agents"
      actions={
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {running ? (
            <span className="flex items-center gap-2 text-primary animate-pulse">
              <Activity className="h-4 w-4" /> Running...
            </span>
          ) : result ? (
            <span className="flex items-center gap-2 text-success">
              <span className="h-2 w-2 rounded-full bg-success"></span> Completed
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-muted-foreground"></span> Idle
            </span>
          )}
        </div>
      }
    >
      <div className="mx-auto max-w-3xl">
        <GlassCard>
          <CardHeader className="pb-4">
            <SectionTitle
              title="Live Execution Trace"
              hint="Track agents as they gather evidence, check safety, and reason."
            />
          </CardHeader>
          <CardContent className="space-y-1">
            {agentList.map((a, i) => (
              <div key={a.id} className="py-2">
                <AgentPill
                  index={i}
                  agent={a.id as AgentId}
                  status={statuses[a.id]?.status ?? "idle"}
                  {...(statuses[a.id]?.summary ? { summary: statuses[a.id]!.summary! } : {})}
                />
              </div>
            ))}
          </CardContent>
        </GlassCard>
      </div>
    </AppShell>
  );
}
