import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { query, orderBy, limit } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  AlertTriangle,
  Loader2,
  Save,
  Send,
  Stethoscope,
  StopCircle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import {
  ConfidenceBadge,
  EvidenceItem,
  GlassCard,
  GroundingBadge,
  SectionTitle,
} from "@/components/medical-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  getCollections,
  useTypedCollection,
  type ImagingRecord,
  type PatientRecord,
} from "@/lib/db";
import { auth } from "@/lib/firebase";
import { consultRunStore, emptyPatientDraft } from "@/lib/consult-run-store";
import {
  AGENTS,
  type AgentId,
  type AgentStatus,
  type ConsultationInput,
  type ConsultationResult,
} from "@/lib/agents/types";

export const Route = createFileRoute("/consultation")({
  head: () => ({
    meta: [
      { title: "AI Consultation — MEDGUIDE AI" },
      {
        name: "description",
        content:
          "Run a multi-agent clinical consultation: structured intake, retrieved evidence, differentials, drug safety and explainable confidence.",
      },
      { property: "og:title", content: "AI Consultation — MEDGUIDE AI" },
      {
        property: "og:description",
        content:
          "Evidence-based clinical assistant with follow-up questioning and full reasoning traces.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { patient?: string } =>
    typeof search["patient"] === "string" ? { patient: search["patient"] as string } : {},
  component: Consultation,
});

function Consultation() {
  const navigate = useNavigate();
  const run$ = useSyncExternalStore(
    consultRunStore.subscribe,
    consultRunStore.getSnapshot,
    consultRunStore.getServerSnapshot,
  );
  const { question, patient, answers, running, statuses, result, selectedPatient } = run$;

  const setQuestion = consultRunStore.setQuestion;
  const setPatient = consultRunStore.setPatient;
  const setAnswers = consultRunStore.setAnswers;

  const [user] = useAuthState(auth);
  const cols = user ? getCollections(user.uid) : null;

  const [imagingDocs] = useTypedCollection<ImagingRecord>(
    cols ? query(cols.imaging, orderBy("createdAt", "desc"), limit(1)) : null,
  );
  const latestImaging = imagingDocs?.[0];

  const [patients] = useTypedCollection<PatientRecord>(
    cols ? query(cols.patients, orderBy("createdAt", "desc")) : null,
  );

  const loadPatient = useCallback(
    (id: string) => {
      const p = patients?.find((x) => String(x.id) === id);
      if (!p) return;
      consultRunStore.setSelectedPatient(id);
      consultRunStore.setPatient({
        age: p.age ?? "",
        sex: p.sex ?? "",
        history: p.history ?? "",
        medications: p.medications ?? "",
        allergies: p.allergies ?? "",
        vitals: p.vitals ?? "",
        labs: p.labs ?? "",
      });
      if (p.question?.trim()) consultRunStore.setQuestion(p.question);
      toast.success(`Loaded ${p.name}`);
    },
    [patients],
  );

  const clearPatient = useCallback(() => {
    consultRunStore.setSelectedPatient("");
    consultRunStore.setPatient({ ...emptyPatientDraft });
  }, []);

  const { patient: patientParam } = Route.useSearch();
  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current || !patientParam || patients.length === 0) return;
    loadedRef.current = true;
    loadPatient(patientParam);
  }, [patientParam, patients, loadPatient]);

  const agentList = useMemo(() => AGENTS.filter((a) => a.id !== "research"), []);

  const run = useCallback(async () => {
    if (!question.trim()) {
      toast.error("Enter a clinical question first.");
      return;
    }

    const input: ConsultationInput = {
      question,
      patient,
      answers: Object.entries(answers)
        .filter(([, v]) => v.trim())
        .map(([q, a]) => ({ question: q, answer: a })),
      imaging: latestImaging?.result ?? null,
    };

    await consultRunStore.start(input, {
      onDone: () => toast.success("Consultation complete"),
      onError: (m) => toast.error(m),
    });
  }, [question, patient, answers, latestImaging]);

  const save = useCallback(async () => {
    if (!result || !result.traces) return;
    if (!cols) return;
    const { addDoc } = await import("firebase/firestore");

    const docRef = await addDoc(cols.consultations, {
      question,
      result: result as ConsultationResult,
      createdAt: Date.now(),
    });
    if (result.reportMarkdown) {
      await addDoc(cols.reports, {
        consultationId: docRef.id,
        title: question.slice(0, 80),
        patientName: patient.age
          ? `${patient.age}${patient.sex ? ` ${patient.sex}` : ""}`
          : "Unnamed",
        markdown: result.reportMarkdown,
        createdAt: Date.now(),
      });
    }
    toast.success("Consultation saved to your cloud workspace");
    navigate({ to: "/explainability", search: { id: docRef.id as string } });
  }, [result, question, patient, navigate, cols]);

  const followUps = result?.plan?.followUpQuestions ?? [];

  return (
    <AppShell
      title="AI Consultation"
      subtitle="Evidence-based clinical assistant — every claim traced to a source"
      wide
      actions={
        <div className="flex items-center gap-2">
          {result?.confidence && <ConfidenceBadge band={result.confidence.band} />}
          {running ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                consultRunStore.stop();
              }}
            >
              <StopCircle className="mr-1.5 h-4 w-4" /> Stop
            </Button>
          ) : (
            <Button size="sm" onClick={run}>
              <Send className="mr-1.5 h-4 w-4" /> Run agents
            </Button>
          )}
          {result?.traces?.length ? (
            <Button size="sm" variant="outline" onClick={save}>
              <Save className="mr-1.5 h-4 w-4" /> Save
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* -------- intake -------- */}
        <div className="space-y-4">
          <GlassCard>
            <CardHeader className="pb-2">
              <SectionTitle title="Clinical question" hint="What do you need evidence on?" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. 68-year-old smoker with 3 days of productive cough, fever and pleuritic chest pain — what is the evidence-based workup and antibiotic choice?"
                rows={5}
              />

              <div className="rounded-md border border-border/60 bg-card/40 p-2.5">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                  Patient context for this run
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Load a saved record from the Patient Workspace, or type a one-off case below.
                  These fields are what the agents actually reason on.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Select value={selectedPatient} onValueChange={loadPatient}>
                    <SelectTrigger className="h-8 flex-1 text-xs">
                      <SelectValue
                        placeholder={patients.length ? "Load saved patient" : "No saved patients"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                          {p.age ? ` · ${p.age}` : ""}
                          {p.sex ? ` · ${p.sex}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="h-8" onClick={clearPatient}>
                    Clear
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="Age"
                  value={patient.age}
                  onChange={(v) => setPatient({ ...patient, age: v })}
                />
                <Field
                  label="Sex"
                  value={patient.sex}
                  onChange={(v) => setPatient({ ...patient, sex: v })}
                />
              </div>
              <Area
                label="History"
                value={patient.history}
                onChange={(v) => setPatient({ ...patient, history: v })}
              />
              <Area
                label="Current medications"
                value={patient.medications}
                onChange={(v) => setPatient({ ...patient, medications: v })}
                placeholder="Comma separated — triggers drug safety checks"
              />
              <Area
                label="Allergies"
                value={patient.allergies}
                onChange={(v) => setPatient({ ...patient, allergies: v })}
                rows={2}
              />
              <Area
                label="Vitals"
                value={patient.vitals}
                onChange={(v) => setPatient({ ...patient, vitals: v })}
                rows={2}
              />
              <Area
                label="Labs"
                value={patient.labs}
                onChange={(v) => setPatient({ ...patient, labs: v })}
                rows={2}
              />
              {latestImaging && (
                <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
                  Attaching latest chest X-ray analysis ({latestImaging.name}).
                </p>
              )}
            </CardContent>
          </GlassCard>

          <GlassCard>
            <CardContent className="py-4">
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-sm font-semibold">Agent Pipeline</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Track clinical reasoning agents as they execute.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto h-8 text-xs shrink-0"
                  onClick={() => navigate({ to: "/pipeline" })}
                >
                  View live status <ArrowRight className="ml-1.5 h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </GlassCard>
        </div>

        {/* -------- output -------- */}
        <div className="space-y-4">
          {!result && !running && (
            <GlassCard>
              <CardContent className="p-10 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                  <Stethoscope className="h-5 w-5 text-primary" />
                </span>
                <p className="mt-3 font-mono text-[0.7rem] uppercase tracking-[0.18em]">
                  Awaiting clinical question
                </p>
                <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
                  The Planner Agent decides which specialists to call, then retrieval, graph,
                  reasoning, drug safety, case comparison, safety audit, explainability and
                  confidence run in sequence.
                </p>
              </CardContent>
            </GlassCard>
          )}

          {followUps.length > 0 && (
            <GlassCard className="border-primary/30">
              <CardHeader className="pb-2">
                <SectionTitle
                  title="Follow-up questions"
                  hint="The planner needs more clinical detail"
                />
              </CardHeader>
              <CardContent className="space-y-2">
                {followUps.map((q) => (
                  <div key={q}>
                    <Label className="text-xs text-muted-foreground">{q}</Label>
                    <Input
                      className="mt-1"
                      value={answers[q] ?? ""}
                      onChange={(e) => setAnswers({ ...answers, [q]: e.target.value })}
                      placeholder="Your answer"
                    />
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={run} disabled={running}>
                  {running ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                  Re-run with answers
                </Button>
                {result?.plan?.missingData?.length ? (
                  <p className="pt-1 text-xs text-warning">
                    Missing data: {result.plan.missingData.join(", ")}
                  </p>
                ) : null}
              </CardContent>
            </GlassCard>
          )}

          {result?.reasoning && (
            <GlassCard>
              <CardHeader className="pb-2">
                <SectionTitle
                  title="Clinical reasoning"
                  hint="Evidence-backed differentials"
                  right={
                    result.confidence ? (
                      <ConfidenceBadge band={result.confidence.band} />
                    ) : undefined
                  }
                />
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{result.reasoning.summary}</p>

                <Tabs defaultValue="differentials" className="mt-4">
                  <TabsList>
                    <TabsTrigger value="differentials">Differentials</TabsTrigger>
                    <TabsTrigger value="redflags">Red flags</TabsTrigger>
                    <TabsTrigger value="investigations">Investigations</TabsTrigger>
                  </TabsList>

                  <TabsContent value="differentials" className="space-y-3 pt-3">
                    {result.reasoning.differentials?.map((d, i) => (
                      <div
                        key={d.condition}
                        className={cn(
                          "border-l-2 py-2.5 pl-3.5 pr-2",
                          d.likelihood === "high"
                            ? "border-l-success"
                            : d.likelihood === "moderate"
                              ? "border-l-warning"
                              : "border-l-muted-foreground/50",
                        )}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[0.6rem] text-muted-foreground/70">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <p className="font-display text-sm font-semibold">{d.condition}</p>
                          <span
                            className={cn(
                              "rounded border px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.12em]",
                              d.likelihood === "high"
                                ? "border-success/40 text-success"
                                : d.likelihood === "moderate"
                                  ? "border-warning/40 text-warning"
                                  : "border-muted-foreground/40 text-muted-foreground",
                            )}
                          >
                            {d.likelihood}
                          </span>
                          <span className="ml-auto">
                            <GroundingBadge
                              grounded={d.grounded ?? (d.citations?.length ?? 0) > 0}
                            />
                          </span>
                        </div>
                        <ListBlock label="Supporting" items={d.supporting} tone="success" />
                        <ListBlock label="Against" items={d.against} tone="destructive" />
                        <ListBlock label="Next steps" items={d.nextSteps} />
                        {d.citations?.length ? (
                          <p className="mt-2 font-mono text-[0.65rem] text-muted-foreground">
                            {d.citations.join(" · ")}
                          </p>
                        ) : (
                          <p className="mt-2 text-[0.65rem] text-warning/90">
                            No retrieved source attached — treat as clinical reasoning, not
                            evidence.
                          </p>
                        )}
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="redflags" className="pt-3">
                    <ListBlock items={result.reasoning.redFlags ?? []} tone="destructive" />
                  </TabsContent>
                  <TabsContent value="investigations" className="pt-3">
                    <ListBlock items={result.reasoning.investigations ?? []} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </GlassCard>
          )}

          {result?.safety?.flags?.length ? (
            <GlassCard className="border-warning/30">
              <CardHeader className="pb-2">
                <SectionTitle
                  icon={AlertTriangle}
                  title="Safety audit"
                  hint={result.safety.verdict}
                />
              </CardHeader>
              <CardContent className="space-y-2">
                {result.safety.flags.map((f, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border/60 bg-card/40 p-3 text-xs"
                  >
                    <Badge
                      variant="outline"
                      className={
                        f.severity === "critical"
                          ? "border-destructive/50 text-destructive"
                          : f.severity === "warning"
                            ? "border-warning/50 text-warning"
                            : "border-muted-foreground/40 text-muted-foreground"
                      }
                    >
                      {f.type.replace(/-/g, " ")}
                    </Badge>
                    <p className="mt-1.5 leading-relaxed">{f.detail}</p>
                  </div>
                ))}
              </CardContent>
            </GlassCard>
          ) : null}

          {result?.drugs?.length ? (
            <GlassCard>
              <CardHeader className="pb-2">
                <SectionTitle title="Drug safety" hint="RxNav interactions and openFDA labels" />
              </CardHeader>
              <CardContent className="space-y-2">
                {result.drugs.slice(0, 8).map((d, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border/60 bg-card/40 p-3 text-xs"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[0.65rem]">
                        {d.kind}
                      </Badge>
                      <span className="text-muted-foreground">{d.drugs.join(" + ")}</span>
                      <span className="ml-auto text-[0.65rem] text-muted-foreground">
                        {d.source}
                      </span>
                    </div>
                    <p className="mt-1.5 leading-relaxed">{d.detail}</p>
                  </div>
                ))}
              </CardContent>
            </GlassCard>
          ) : null}

          {result?.evidence?.length ? (
            <GlassCard>
              <CardHeader className="pb-2">
                <SectionTitle
                  title="Retrieved evidence"
                  hint={`${result.evidence.length} sources`}
                />
              </CardHeader>
              <CardContent className="grid gap-2 md:grid-cols-2">
                {result.evidence.map((e) => (
                  <EvidenceItem key={e.id} source={e} />
                ))}
              </CardContent>
            </GlassCard>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input className="mt-1" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Area({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Textarea
        className="mt-1"
        rows={rows}
        value={value}
        placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ListBlock({
  label,
  items,
  tone,
}: {
  label?: string;
  items: string[];
  tone?: "success" | "destructive";
}) {
  if (!items?.length) return null;
  const color =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : "text-primary";
  return (
    <div className="mt-2">
      {label && (
        <p className="text-[0.68rem] uppercase tracking-wider text-muted-foreground">{label}</p>
      )}
      <ul className="mt-1 space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-xs leading-relaxed">
            <span className={color}>•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
