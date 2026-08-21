import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { query, orderBy, where, addDoc, doc, deleteDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  AlertCircle,
  CheckCircle,
  FileSearch,
  Image as ImageIcon,
  Pill,
  StickyNote,
  Timer,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { EmptyState, GlassCard, SectionTitle } from "@/components/medical-ui";
import { FormArea, FormField } from "@/components/form-fields";
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

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Clinical Timeline — MEDGUIDE AI" },
      {
        name: "description",
        content:
          "Track symptoms, tests, medications, imaging and clinical outcomes chronologically.",
      },
      { property: "og:title", content: "Clinical Timeline — MEDGUIDE AI" },
      {
        property: "og:description",
        content: "A chronological clinical log for structured patient course tracking.",
      },
    ],
  }),
  component: TimelinePage,
});

const kinds: { value: TimelineEvent["kind"]; icon: typeof AlertCircle }[] = [
  { value: "symptom", icon: AlertCircle },
  { value: "test", icon: FileSearch },
  { value: "medication", icon: Pill },
  { value: "imaging", icon: ImageIcon },
  { value: "outcome", icon: CheckCircle },
  { value: "note", icon: StickyNote },
];

function TimelinePage() {
  const [user] = useAuthState(auth);
  const cols = user ? getCollections(user.uid) : null;

  // Patient selection and filtering
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [patients] = useTypedCollection<PatientRecord>(
    cols ? query(cols.patients, orderBy("createdAt", "desc")) : null,
  );

  // Events filtered by selected patient (or all if none selected)
  const [events] = useTypedCollection<TimelineEvent>(
    cols && selectedPatient
      ? query(cols.timeline, where("patientId", "==", selectedPatient), orderBy("date", "desc"))
      : cols
        ? query(cols.timeline, orderBy("date", "desc"))
        : null,
  );

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
      await addDoc(cols.timeline, {
        date,
        kind,
        title,
        detail,
        ...(selectedPatient ? { patientId: selectedPatient } : {}),
        createdAt: Date.now(),
      });
    }
    setTitle("");
    setDetail("");
    toast.success("Event added");
  };

  return (
    <AppShell
      title="Clinical Timeline"
      subtitle="Chronological view of the patient's course"
      actions={
        <Select value={selectedPatient} onValueChange={setSelectedPatient}>
          <SelectTrigger className="w-[180px] h-9 text-xs">
            <SelectValue placeholder="All patients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All patients</SelectItem>
            {patients.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <GlassCard>
          <CardHeader className="pb-2">
            <SectionTitle icon={Timer} title="Add event" />
          </CardHeader>
          <CardContent className="space-y-3">
            {patients.length > 0 && (
              <div>
                <Label className="text-sm text-muted-foreground">Patient (optional)</Label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All timeline (no patient)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All timeline (no patient)</SelectItem>
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
              <Label className="text-sm text-muted-foreground">Date</Label>
              <Input
                type="date"
                className="mt-1"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as TimelineEvent["kind"])}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kinds.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                      {k.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FormField label="Title" value={title} onChange={setTitle} />
            <FormArea label="Detail" value={detail} onChange={setDetail} />
            <Button onClick={add}>Add to timeline</Button>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader className="pb-2">
            <SectionTitle title="Course" hint={`${events.length} events`} />
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <EmptyState
                icon={Timer}
                title="Timeline empty"
                description="Add symptoms, tests, medications and outcomes to build the clinical course."
              />
            ) : (
              <ol className="relative space-y-4 border-l border-border/60 pl-6">
                {events.map((e) => {
                  const Icon = kinds.find((k) => k.value === e.kind)?.icon ?? StickyNote;
                  return (
                    <li key={e.id} className="relative">
                      <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border border-primary/40 bg-card">
                        <Icon className="h-3 w-3 text-primary" />
                      </span>
                      <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <div className="flex items-center gap-2">
                          <p className="flex-1 text-base font-medium">{e.title}</p>
                          <span className="font-mono text-xs text-muted-foreground">{e.date}</span>
                          <button
                            type="button"
                            onClick={() => cols && e.id && deleteDoc(doc(cols.timeline, e.id))}
                            className="text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {e.detail && (
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
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
