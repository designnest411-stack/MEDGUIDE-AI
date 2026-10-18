import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { query, orderBy } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  Activity,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  GitBranch,
  Image as ImageIcon,
  Library,
  Pill,
  Search,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/app-shell";
import { GlassCard, EmptyState, SectionTitle, ConfidenceBadge } from "@/components/medical-ui";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCollections,
  useTypedCollection,
  type ConsultationRecord,
  type ImagingRecord,
  type PatientRecord,
  type ReportRecord,
} from "@/lib/db";
import { auth } from "@/lib/firebase";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard : MEDGUIDE AI" },
      {
        name: "description",
        content:
          "Overview of consultations, evidence retrieved, imaging studies and generated clinical reports.",
      },
      { property: "og:title", content: "Dashboard : MEDGUIDE AI" },
      {
        property: "og:description",
        content:
          "Your clinical intelligence overview: consultations, evidence, imaging and reports.",
      },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <AppShell title="Dashboard" subtitle="Clinical workspace overview">
      <GlassCard className="p-8 text-center">
        <h2 className="text-lg font-semibold text-destructive">Dashboard Load Error</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {(error as Error)?.message || "Failed to load dashboard metrics."}
        </p>
        <Button onClick={reset} className="mt-4" size="sm">
          Retry Dashboard
        </Button>
      </GlassCard>
    </AppShell>
  ),
  component: Dashboard,
});

function Dashboard() {
  const [user] = useAuthState(auth);
  const cols = user ? getCollections(user.uid) : null;
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 6;

  const [consultations, consultationsLoading] = useTypedCollection<ConsultationRecord>(
    cols ? query(cols.consultations, orderBy("createdAt", "desc")) : null,
  );
  const [patients, patientsLoading] = useTypedCollection<PatientRecord>(cols?.patients);
  const [reports, reportsLoading] = useTypedCollection<ReportRecord>(cols?.reports);
  const [imaging, imagingLoading] = useTypedCollection<ImagingRecord>(cols?.imaging);

  const filteredConsultations = searchQuery.trim()
    ? consultations.filter((c) =>
        c.question.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : consultations;

  const totalPages = Math.ceil(filteredConsultations.length / pageSize) || 1;
  const paginatedConsultations = filteredConsultations.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  const isStatsLoading = consultationsLoading || patientsLoading || reportsLoading || imagingLoading;

  const evidenceCount = consultations.reduce((n, c) => n + (c.result?.evidence?.length ?? 0), 0);

  const stats = [
    { label: "Consultations", value: consultations.length, icon: Stethoscope, to: "/consultation" },
    { label: "Patients", value: patients.length, icon: UserRound, to: "/patient" },
    { label: "Evidence sources", value: evidenceCount, icon: Library, to: "/literature" },
    { label: "Imaging studies", value: imaging.length, icon: ImageIcon, to: "/imaging" },
    { label: "Reports", value: reports.length, icon: FileText, to: "/reports" },
  ] as const;

  const bands = ["High", "Medium", "Low", "Insufficient evidence"].map((band) => ({
    band: band === "Insufficient evidence" ? "Insufficient" : band,
    count: consultations.filter((c) => c.result?.confidence?.band === band).length,
  }));

  return (
    <AppShell
      title="Dashboard"
      subtitle="Activity and intelligence overview across your clinical workspace"
      actions={
        <Button asChild size="sm">
          <Link to="/consultation">
            New consultation <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {isStatsLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <GlassCard key={i} className="h-full">
                <CardContent className="p-3.5 sm:p-4 space-y-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-7 w-14" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </GlassCard>
            ))
          : stats.map((s) => (
              <Link key={s.label} to={s.to}>
                <GlassCard className="h-full transition-transform hover:-translate-y-0.5">
                  <CardContent className="p-3.5 sm:p-4">
                    <s.icon className="h-4 w-4 text-primary" />
                    <p className="mt-2 sm:mt-3 font-display text-xl sm:text-2xl font-semibold">
                      {s.value}
                    </p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">{s.label}</p>
                  </CardContent>
                </GlassCard>
              </Link>
            ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <CardHeader className="pb-2">
            <SectionTitle
              icon={Activity}
              title="Recent consultations"
              hint={consultationsLoading ? "Loading..." : `${consultations.length} total`}
            />
          </CardHeader>
          <CardContent>
            {consultations.length > 0 && (
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Search consultations…"
                  className="h-8 pl-8 text-xs"
                />
              </div>
            )}
            {consultationsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 p-3"
                  >
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-2.5 w-1/3" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded" />
                  </div>
                ))}
              </div>
            ) : consultations.length === 0 ? (
              <EmptyState
                icon={Stethoscope}
                title="No consultations yet"
                description="Start a consultation to see the multi-agent pipeline run against real medical evidence."
                action={
                  <Button asChild size="sm">
                    <Link to="/consultation">Start now</Link>
                  </Button>
                }
              />
            ) : filteredConsultations.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No consultations match &quot;{searchQuery}&quot;.
              </p>
            ) : (
              <div className="space-y-2">
                {paginatedConsultations.map((c) => (
                  <Link
                    key={c.id}
                    to="/explainability"
                    search={{ id: String(c.id ?? "") }}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 rounded-lg border border-border/60 bg-card/40 p-3 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 w-full">
                      <Stethoscope className="h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.question}</p>
                        <p className="text-[11px] sm:text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleString()} ·{" "}
                          {c.result?.evidence?.length ?? 0} sources
                        </p>
                      </div>
                    </div>
                    {c.result?.confidence && (
                      <div className="self-end sm:self-center shrink-0">
                        <ConfidenceBadge band={c.result.confidence.band} />
                      </div>
                    )}
                  </Link>
                ))}

                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    <span>
                      Page {page + 1} of {totalPages} ({filteredConsultations.length} total)
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2"
                        disabled={page === 0}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2"
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        aria-label="Next page"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader className="pb-2">
            <SectionTitle title="Confidence distribution" hint="Across saved consultations" />
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bands}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="band"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                />
                <YAxis
                  allowDecimals={false}
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
                <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </GlassCard>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: Pill,
            title: "Check drug safety",
            to: "/drugs",
            text: "Interactions and FDA warnings",
          },
          {
            icon: GitBranch,
            title: "Explore the graph",
            to: "/graph",
            text: "Disease to treatment paths",
          },
          {
            icon: ImageIcon,
            title: "Analyse an X-ray",
            to: "/imaging",
            text: "Explainable heatmaps",
          },
        ].map((q) => (
          <Link key={q.title} to={q.to}>
            <GlassCard className="h-full transition-transform hover:-translate-y-0.5">
              <CardContent className="flex items-center gap-3 p-4">
                <q.icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{q.title}</p>
                  <p className="text-xs text-muted-foreground">{q.text}</p>
                </div>
              </CardContent>
            </GlassCard>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
