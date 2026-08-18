import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Microscope, Search } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { EmptyState, GlassCard, SectionTitle } from "@/components/medical-ui";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { query, orderBy, limit } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { getCollections, useTypedCollection, type ConsultationRecord } from "@/lib/db";
import { auth } from "@/lib/firebase";
import { CASE_LIBRARY, rankCases } from "@/lib/medical/cases";

export const Route = createFileRoute("/cases")({
  head: () => ({
    meta: [
      { title: "Case Similarity — MEDGUIDE AI" },
      {
        name: "description",
        content:
          "Find clinically similar reference cases with their diagnosis, treatment and outcome.",
      },
      { property: "og:title", content: "Case Similarity — MEDGUIDE AI" },
      {
        property: "og:description",
        content: "Compare a presentation against a curated library of reference clinical cases.",
      },
    ],
  }),
  component: CasesPage,
});

function CasesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const [user] = useAuthState(auth);
  const cols = user ? getCollections(user.uid) : null;
  const [consultationsDocs] = useTypedCollection<ConsultationRecord>(
    cols ? query(cols.consultations, orderBy("createdAt", "desc"), limit(1)) : null,
  );
  const lastConsult = consultationsDocs?.[0];

  // Seed the search box with your latest consultation so the ranking is about your case.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || !lastConsult?.question) return;
    seededRef.current = true;
    setSearchQuery(lastConsult.question.slice(0, 200));
  }, [lastConsult]);
  const results = useMemo(
    () => (searchQuery.trim() ? rankCases(searchQuery, 8) : CASE_LIBRARY),
    [searchQuery],
  );

  return (
    <AppShell
      title="Case Similarity"
      subtitle="Curated reference cases ranked against your presentation"
    >
      <GlassCard>
        <CardHeader className="pb-2">
          <SectionTitle
            icon={Search}
            title="Describe the presentation"
            hint="Symptoms, age, risk factors"
          />
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-sm leading-relaxed text-muted-foreground">
            {searchQuery.trim()
              ? "Curated reference cases ranked against the presentation above."
              : "Showing the full curated reference library. These are pre-written teaching cases, not results from your consultation — describe a presentation to rank them by similarity."}
          </p>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g. 62M smoker, fever, productive cough, hypoxia"
          />
        </CardContent>
      </GlassCard>

      {results.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={Microscope}
            title="No similar cases"
            description="Try describing the presentation with more clinical detail."
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {results.map((c) => (
            <GlassCard key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-semibold">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.age}
                      {c.sex} · {c.diagnosis}
                    </p>
                  </div>
                  {typeof c.score === "number" && c.score > 0 ? (
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      {Math.round(c.score * 100)}% match
                    </Badge>
                  ) : searchQuery.trim() ? (
                    <Badge variant="outline" className="text-muted-foreground">
                      no overlap
                    </Badge>
                  ) : null}
                </div>
                <dl className="mt-3 space-y-2 text-xs">
                  <Row label="Presentation" value={c.presentation} />
                  <Row label="Treatment" value={c.treatment} />
                  <Row label="Outcome" value={c.outcome} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.tags.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="text-[0.6rem] text-muted-foreground"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </GlassCard>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="leading-relaxed">{value}</dd>
    </div>
  );
}
