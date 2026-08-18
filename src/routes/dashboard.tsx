import { createFileRoute, Link } from "@tanstack/react-router";
import { query, orderBy } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  Activity,
  ArrowRight,
  FileText,
  GitBranch,
  Image as ImageIcon,
  Library,
  Pill,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/app-shell";
import { GlassCard, EmptyState, SectionTitle, ConfidenceBadge } from "@/components/medical-ui";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
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
      { title: "Dashboard — MEDGUIDE AI" },
      {
        name: "description",
        content:
          "Overview of consultations, evidence retrieved, imaging studies and generated clinical reports.",
      },
      { property: "og:title", content: "Dashboard — MEDGUIDE AI" },
      {
        property: "og:description",
        content:
          "Your clinical intelligence overview: consultations, evidence, imaging and reports.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [user] = useAuthState(auth);
  const cols = user ? getCollections(user.uid) : null;

  const [consultations] = useTypedCollection<ConsultationRecord>(
    cols ? query(cols.consultations, orderBy("createdAt", "desc")) : null,
  );
  const [patients] = useTypedCollection<PatientRecord>(cols?.patients);
  const [reports] = useTypedCollection<ReportRecord>(cols?.reports);
  const [imaging] = useTypedCollection<ImagingRecord>(cols?.imaging);

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
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} to={s.to}>
            <GlassCard className="h-full transition-transform hover:-translate-y-0.5">
              <CardContent className="p-4">
                <s.icon className="h-4 w-4 text-primary" />
                <p className="mt-3 font-display text-2xl font-semibold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
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
              hint="Synced with your clinical cloud"
            />
          </CardHeader>
          <CardContent>
            {consultations.length === 0 ? (
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
            ) : (
              <div className="space-y-2">
                {consultations.slice(0, 6).map((c) => (
                  <Link
                    key={c.id}
                    to="/explainability"
                    search={{ id: String(c.id ?? "") }}
                    className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/40 p-3 transition-colors hover:border-primary/40"
                  >
                    <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{c.question}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleString()} · {c.result?.evidence?.length ?? 0}{" "}
                        sources
                      </p>
                    </div>
                    {c.result?.confidence && <ConfidenceBadge band={c.result.confidence.band} />}
                  </Link>
                ))}
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
