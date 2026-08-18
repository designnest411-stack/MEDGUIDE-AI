import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Pill, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { EmptyState, EvidenceItem, GlassCard, SectionTitle } from "@/components/medical-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { checkDrugs } from "@/lib/medical/medical.functions";
import type { DrugFinding, EvidenceSource } from "@/lib/agents/types";

export const Route = createFileRoute("/drugs")({
  head: () => ({
    meta: [
      { title: "Drug Intelligence — MEDGUIDE AI" },
      {
        name: "description",
        content:
          "Check drug-drug interactions, contraindications and openFDA label warnings for a medication list.",
      },
      { property: "og:title", content: "Drug Intelligence — MEDGUIDE AI" },
      {
        property: "og:description",
        content:
          "Interaction, contraindication and FDA warning checks powered by RxNav and openFDA.",
      },
    ],
  }),
  component: DrugsPage,
});

const severityStyle: Record<DrugFinding["severity"], string> = {
  critical: "border-destructive/50 text-destructive bg-destructive/10",
  major: "border-warning/50 text-warning bg-warning/10",
  moderate: "border-warning/40 text-warning bg-warning/5",
  minor: "border-border text-muted-foreground",
  info: "border-primary/40 text-primary bg-primary/5",
};

function DrugsPage() {
  const run = useServerFn(checkDrugs);
  const [drugs, setDrugs] = useState<string[]>([]);
  const [entry, setEntry] = useState("");
  const [loading, setLoading] = useState(false);
  const [findings, setFindings] = useState<DrugFinding[]>([]);
  const [evidence, setEvidence] = useState<EvidenceSource[]>([]);

  const add = () => {
    const v = entry.trim();
    if (!v) return;
    if (drugs.includes(v)) return;
    setDrugs([...drugs, v]);
    setEntry("");
  };

  const check = async () => {
    if (drugs.length === 0) {
      toast.error("Add at least one medication.");
      return;
    }
    setLoading(true);
    try {
      const res = await run({ data: { drugs } });
      setFindings(res.findings);
      setEvidence(res.evidence);
      if (res.findings.length === 0) toast.info("No documented findings returned for this list.");
    } catch {
      toast.error("Drug check failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const grouped = [
    "interaction",
    "contraindication",
    "warning",
    "side-effect",
    "pregnancy",
    "dosage",
  ].map((kind) => ({ kind, items: findings.filter((f) => f.kind === kind) }));

  return (
    <AppShell title="Drug Intelligence" subtitle="RxNav interactions and openFDA label safety data">
      <GlassCard>
        <CardHeader className="pb-2">
          <SectionTitle icon={Pill} title="Medication list" hint="Add generic or brand names" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
              placeholder="e.g. warfarin"
            />
            <Button variant="outline" onClick={add}>
              Add
            </Button>
            <Button onClick={check} disabled={loading}>
              {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Check safety
            </Button>
          </div>
          {drugs.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {drugs.map((d) => (
                <Badge key={d} variant="outline" className="gap-1.5 border-primary/40 text-primary">
                  {d}
                  <button type="button" onClick={() => setDrugs(drugs.filter((x) => x !== d))}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </GlassCard>

      {findings.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={ShieldAlert}
            title="No safety findings loaded"
            description="Add the patient's medications and run a check to see interactions, contraindications and FDA label warnings."
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {grouped
              .filter((g) => g.items.length > 0)
              .map((g) => (
                <GlassCard key={g.kind}>
                  <CardHeader className="pb-2">
                    <SectionTitle
                      title={g.kind.replace(/-/g, " ")}
                      hint={`${g.items.length} findings`}
                    />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {g.items.map((f, i) => (
                      <div
                        key={i}
                        className={`rounded-lg border p-3 text-xs ${severityStyle[f.severity]}`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium uppercase tracking-wider">{f.severity}</span>
                          <span className="opacity-80">{f.drugs.join(" + ")}</span>
                          <span className="ml-auto text-[0.65rem] opacity-70">{f.source}</span>
                        </div>
                        <p className="mt-1.5 leading-relaxed text-foreground/90">{f.detail}</p>
                      </div>
                    ))}
                  </CardContent>
                </GlassCard>
              ))}
          </div>
          <GlassCard>
            <CardHeader className="pb-2">
              <SectionTitle title="Sources" hint="openFDA labels" />
            </CardHeader>
            <CardContent className="space-y-2">
              {evidence.map((e) => (
                <EvidenceItem key={e.id} source={e} />
              ))}
            </CardContent>
          </GlassCard>
        </div>
      )}
    </AppShell>
  );
}
