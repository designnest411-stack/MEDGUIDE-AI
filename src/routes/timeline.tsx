import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { query, orderBy, where, addDoc, doc, deleteDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  AlertCircle,
  CheckCircle,
  FileSearch,
  Filter,
  Image as ImageIcon,
  Pill,
  PlusCircle,
  StickyNote,
  Timer,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { EmptyState, GlassCard, SectionTitle } from "@/components/medical-ui";
import { FormArea, FormField } from "@/components/form-fields";
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
import {
  getCollections,
  useTypedCollection,
  type PatientRecord,
  type TimelineEvent,
} from "@/lib/db";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Clinical Timeline · MEDGUIDE AI" },
      {
        name: "description",
        content:
          "Track symptoms, tests, medications, imaging and clinical outcomes chronologically.",
      },
      {
        property: "og:description",
        content:
          "Track symptoms, tests, medications, imaging and clinical outcomes chronologically.",
      },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <AppShell title="Clinical Timeline" subtitle="Patient trajectory">
      <GlassCard className="p-8 text-center">
        <h2 className="text-lg font-semibold text-destructive">Timeline Error</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {(error as Error)?.message || "Failed to load clinical timeline events."}
        </p>
        <Button onClick={reset} className="mt-4" size="sm">
          Retry Timeline
        </Button>
      </GlassCard>
    </AppShell>
  ),
  component: TimelinePage,
});

const kinds: Array<{
  value: TimelineEvent["kind"];
  label: string;
  icon: typeof AlertCircle;
  badgeCls: string;
  dotCls: string;
}> = [
  {
    value: "symptom",
    label: "Symptom",
    icon: AlertCircle,
    badgeCls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    dotCls: "border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10",
  },
  {
    value: "test",
    label: "Laboratory & Diagnostic",
    icon: FileSearch,
    badgeCls: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    dotCls: "border-sky-500/50 text-sky-600 dark:text-sky-400 bg-sky-500/10",
  },
  {
    value: "medication",
    label: "Medication & Rx",
    icon: Pill,
    badgeCls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    dotCls: "border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  },
  {
    value: "imaging",
    label: "Imaging & Radiology",
    icon: ImageIcon,
    badgeCls: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
    dotCls: "border-violet-500/50 text-violet-600 dark:text-violet-400 bg-violet-500/10",
  },
  {
    value: "outcome",
    label: "Clinical Outcome",
    icon: CheckCircle,
    badgeCls: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
    dotCls: "border-teal-500/50 text-teal-600 dark:text-teal-400 bg-teal-500/10",
  },
  {
    value: "note",
    label: "Clinical Note",
    icon: StickyNote,
    badgeCls: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
    dotCls: "border-slate-500/50 text-slate-600 dark:text-slate-400 bg-slate-500/10",
  },
];

function TimelinePage() {
  const [user] = useAuthState(auth);
  const cols = user ? getCollections(user.uid) : null;

  // Toggle for Collapsible Event Intake Form (Hidden by default)
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Patient selection and filtering
  const [selectedPatient, setSelectedPatient] = useState<string>("all");
  const [kindFilter, setKindFilter] = useState<string>("all");

  const [patients] = useTypedCollection<PatientRecord>(
    cols ? query(cols.patients, orderBy("createdAt", "desc")) : null,
  );

  // Events filtered by selected patient (or all if "all" selected)
  const [events] = useTypedCollection<TimelineEvent>(
    cols && selectedPatient && selectedPatient !== "all"
      ? query(cols.timeline, where("patientId", "==", selectedPatient), orderBy("date", "desc"))
      : cols
        ? query(cols.timeline, orderBy("date", "desc"))
        : null,
  );

  // Form intake state
  const [intakePatientId, setIntakePatientId] = useState<string>("all");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [kind, setKind] = useState<TimelineEvent["kind"]>("symptom");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");

  const add = async () => {
    if (!title.trim()) {
      toast.error("Add a short title for the event.");
      return;
    }
    if (cols) {
      const assignedPatientId =
        intakePatientId !== "all"
          ? intakePatientId
          : selectedPatient !== "all"
            ? selectedPatient
            : undefined;

      await addDoc(cols.timeline, {
        date,
        kind,
        title: title.trim(),
        detail: detail.trim(),
        ...(assignedPatientId ? { patientId: assignedPatientId } : {}),
        createdAt: Date.now(),
      });
    }
    setTitle("");
    setDetail("");
    setIsFormOpen(false);
    toast.success("Event added to clinical timeline");
  };

  const filteredEvents = events.filter((e) => {
    if (kindFilter !== "all" && e.kind !== kindFilter) return false;
    return true;
  });

  const counts: {
    all: number;
    symptom: number;
    test: number;
    medication: number;
    imaging: number;
    outcome: number;
    note: number;
  } = {
    all: events.length,
    symptom: events.filter((e) => e.kind === "symptom").length,
    test: events.filter((e) => e.kind === "test").length,
    medication: events.filter((e) => e.kind === "medication").length,
    imaging: events.filter((e) => e.kind === "imaging").length,
    outcome: events.filter((e) => e.kind === "outcome").length,
    note: events.filter((e) => e.kind === "note").length,
  };

  return (
    <AppShell
      title="Clinical Timeline"
      subtitle="Chronological trajectory of patient signs, investigations, therapies, and outcomes"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger className="h-8 w-[190px] text-xs">
              <SelectValue placeholder="All patients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All timeline (All patients)</SelectItem>
              {patients.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!isFormOpen && (
            <Button
              size="sm"
              onClick={() => {
                setIntakePatientId(selectedPatient !== "all" ? selectedPatient : "all");
                setIsFormOpen(true);
              }}
              className="h-8 gap-1.5 text-xs shadow-xs"
            >
              <PlusCircle className="h-3.5 w-3.5" /> Add Event
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Expandable Clinical Event Intake Card */}
        {isFormOpen && (
          <GlassCard className="border-primary/40 shadow-xl shadow-primary/5 animate-in fade-in slide-in-from-top-2 duration-300">
            <CardHeader className="border-b border-border/50 pb-3">
              <SectionTitle
                icon={Timer}
                title="New Clinical Timeline Event"
                hint="Record symptoms, diagnostic findings, prescriptions, imaging results, or clinical outcomes"
                right={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1 text-xs"
                    onClick={() => setIsFormOpen(false)}
                  >
                    <X className="h-3.5 w-3.5" /> Close Form
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {patients.length > 0 && (
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Patient (optional)
                    </Label>
                    <Select value={intakePatientId} onValueChange={setIntakePatientId}>
                      <SelectTrigger className="mt-1 h-9 text-xs">
                        <SelectValue placeholder="All timeline (no patient)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All timeline (no patient)</SelectItem>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">Event Date</Label>
                  <Input
                    type="date"
                    className="mt-1 h-9 text-xs"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">Event Type</Label>
                  <Select value={kind} onValueChange={(v) => setKind(v as TimelineEvent["kind"])}>
                    <SelectTrigger className="mt-1 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {kinds.map((k) => (
                        <SelectItem key={k.value} value={k.value}>
                          <span className="capitalize">{k.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <FormField
                label="Event Title"
                placeholder="e.g. Acute onset dyspnea, Elevated troponin I (1.8 ng/mL), Started Azithromycin 500mg IV"
                value={title}
                onChange={setTitle}
              />

              <FormArea
                label="Clinical Details & Observations"
                placeholder="Detailed findings, physical exam observations, lab values, dosages, response to therapy, or progression notes..."
                value={detail}
                onChange={setDetail}
              />

              <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsFormOpen(false);
                    setTitle("");
                    setDetail("");
                  }}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={add} className="h-8 gap-1.5 text-xs">
                  <PlusCircle className="h-3.5 w-3.5" /> Add to Timeline
                </Button>
              </div>
            </CardContent>
          </GlassCard>
        )}

        {/* Full-Width Clinical Course Timeline */}
        <GlassCard>
          <CardHeader className="border-b border-border/50 pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SectionTitle
                icon={Timer}
                title="Clinical Course"
                hint={
                  selectedPatient !== "all"
                    ? `${filteredEvents.length} events for ${patients.find((p) => String(p.id) === selectedPatient)?.name || "selected patient"}`
                    : `${filteredEvents.length} of ${events.length} chronological events recorded`
                }
              />

              {/* Event Type Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setKindFilter("all")}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                    kindFilter === "all"
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-border/60 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  All ({counts.all || 0})
                </button>
                {kinds.map((k) => {
                  const c = counts[k.value] || 0;
                  if (c === 0 && kindFilter !== k.value) return null;
                  const active = kindFilter === k.value;
                  return (
                    <button
                      key={k.value}
                      type="button"
                      onClick={() => setKindFilter(active ? "all" : k.value)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-all",
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-xs"
                          : "border-border/60 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {k.value} ({c})
                    </button>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            {events.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  icon={Timer}
                  title="Timeline empty"
                  description="No clinical events recorded yet. Add symptoms, lab tests, medications, imaging, or outcomes to build the trajectory."
                  action={
                    !isFormOpen ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setIntakePatientId(selectedPatient !== "all" ? selectedPatient : "all");
                          setIsFormOpen(true);
                        }}
                        className="mt-3 gap-1.5 text-xs"
                      >
                        <PlusCircle className="h-3.5 w-3.5" /> Add First Event
                      </Button>
                    ) : undefined
                  }
                />
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="py-8 text-center">
                <Filter className="mx-auto h-8 w-8 text-muted-foreground/60" />
                <p className="mt-2 text-sm font-medium">
                  No events matching &ldquo;{kindFilter}&rdquo; filter
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try selecting another category or view all events.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setKindFilter("all")}
                  className="mt-3 h-8 text-xs"
                >
                  Clear Filter
                </Button>
              </div>
            ) : (
              <ol className="relative space-y-4 border-l-2 border-border/70 pl-6 dark:border-white/10">
                {filteredEvents.map((e) => {
                  const kindMeta = kinds.find((k) => k.value === e.kind) || kinds[0]!;
                  const Icon = kindMeta.icon;
                  const patientObj = e.patientId
                    ? patients.find((p) => String(p.id) === String(e.patientId))
                    : null;

                  return (
                    <li key={e.id} className="relative group">
                      {/* Timeline Node Pin */}
                      <span
                        className={cn(
                          "absolute -left-[33px] flex h-7 w-7 items-center justify-center rounded-lg border shadow-xs transition-transform group-hover:scale-110",
                          kindMeta.dotCls,
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>

                      {/* Event Card */}
                      <div className="rounded-xl border border-border/70 bg-card/60 p-4 backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:bg-card/90 hover:shadow-md dark:border-white/[0.08] dark:bg-slate-900/40 dark:hover:border-white/[0.18]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                                kindMeta.badgeCls,
                              )}
                            >
                              {kindMeta.label}
                            </Badge>

                            {patientObj && (
                              <Badge
                                variant="secondary"
                                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium"
                              >
                                <User className="h-3 w-3 text-primary" />
                                {patientObj.name}
                              </Badge>
                            )}

                            <span className="font-mono text-xs font-semibold text-muted-foreground">
                              {e.date}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (cols && e.id) {
                                deleteDoc(doc(cols.timeline, e.id));
                                toast.success("Timeline event deleted");
                              }
                            }}
                            title="Delete timeline event"
                            aria-label="Delete timeline event"
                            className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <h3 className="mt-2 text-base font-semibold text-foreground">{e.title}</h3>

                        {e.detail && (
                          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                            {e.detail}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </GlassCard>
      </div>
    </AppShell>
  );
}
