import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Library, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { EmptyState, EvidenceItem, GlassCard, SectionTitle } from "@/components/medical-ui";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { searchLiterature } from "@/lib/medical/medical.functions";
import type { EvidenceSource } from "@/lib/agents/types";

export const Route = createFileRoute("/literature")({
  head: () => ({
    meta: [
      { title: "Literature Explorer — MEDGUIDE AI" },
      {
        name: "description",
        content: "Search PubMed and WHO guidance for evidence relevant to your clinical question.",
      },
      { property: "og:title", content: "Literature Explorer — MEDGUIDE AI" },
      {
        property: "og:description",
        content: "Peer-reviewed evidence retrieval from PubMed and WHO for clinical questions.",
      },
    ],
  }),
  component: LiteraturePage,
});

const suggestions = [
  "community acquired pneumonia antibiotic guideline",
  "metformin contraindication renal impairment",
  "NSTEMI early invasive strategy",
  "DKA fluid resuscitation protocol",
];

function LiteraturePage() {
  const run = useServerFn(searchLiterature);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [pubmed, setPubmed] = useState<EvidenceSource[]>([]);
  const [who, setWho] = useState<EvidenceSource[]>([]);

  const search = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await run({ data: { query: q } });
      setPubmed(res.pubmed);
      setWho(res.who);
      if (res.pubmed.length === 0) toast.info("No PubMed results for that query.");
    } catch {
      toast.error("Literature search failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Literature Explorer" subtitle="PubMed E-utilities and WHO guidance">
      <GlassCard>
        <CardContent className="p-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void search(query);
            }}
          >
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clinical literature…"
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuery(s);
                  void search(s);
                }}
                className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                {s}
              </button>
            ))}
          </div>
        </CardContent>
      </GlassCard>

      {pubmed.length === 0 && who.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={Library}
            title="No results yet"
            description="Search a clinical topic to retrieve peer-reviewed abstracts and guideline references."
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
          <GlassCard>
            <CardHeader className="pb-2">
              <SectionTitle title="PubMed results" hint={`${pubmed.length} abstracts`} />
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2">
              {pubmed.map((e) => (
                <EvidenceItem key={e.id} source={e} />
              ))}
            </CardContent>
          </GlassCard>
          <GlassCard>
            <CardHeader className="pb-2">
              <SectionTitle title="Guidelines" hint="WHO and reference guidance" />
            </CardHeader>
            <CardContent className="space-y-2">
              {who.map((e) => (
                <EvidenceItem key={e.id} source={e} />
              ))}
            </CardContent>
          </GlassCard>
        </div>
      )}
    </AppShell>
  );
}
