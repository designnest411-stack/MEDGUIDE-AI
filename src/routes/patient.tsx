import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { query, orderBy, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { Lightbulb, Pencil, Play, Trash2, UserPlus, UserRound, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { EmptyState, GlassCard, SectionTitle } from "@/components/medical-ui";
import { FormArea, FormField } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCollections, useTypedCollection, type PatientRecord } from "@/lib/db";
import { auth } from "@/lib/firebase";

export const Route = createFileRoute("/patient")({
  head: () => ({
    meta: [
      { title: "Patient Workspace — MEDGUIDE AI" },
      {
        name: "description",
        content:
          "Record patient demographics, history, medications, allergies, vitals and labs — stored securely in your clinical workspace.",
      },
      { property: "og:title", content: "Patient Workspace — MEDGUIDE AI" },
      {
        property: "og:description",
        content: "Structured patient intake that feeds the clinical reasoning agents.",
      },
    ],
  }),
  component: PatientPage,
});

const blank = {
  name: "",
  question: "",
  age: "",
  sex: "",
  history: "",
  medications: "",
  allergies: "",
  vitals: "",
  labs: "",
};

function PatientPage() {
  const [user] = useAuthState(auth);
  const cols = user ? getCollections(user.uid) : null;
  const [patients] = useTypedCollection<PatientRecord>(
    cols ? query(cols.patients, orderBy("createdAt", "desc")) : null,
  );

  const [form, setForm] = useState({ ...blank });
  const [editingId, setEditingId] = useState<string | null>(null);

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Give the patient a name or identifier.");
      return;
    }
    if (!cols) return;
    if (editingId !== null) {
      await updateDoc(doc(cols.patients, editingId), { ...form });
      toast.success("Patient updated");
    } else {
      await addDoc(cols.patients, { ...form, createdAt: Date.now() });
      toast.success("Patient saved to workspace");
    }
    setForm({ ...blank });
    setEditingId(null);
  };

  const edit = (p: (typeof patients)[number]) => {
    setEditingId(p.id ?? null);
    setForm({
      name: p.name ?? "",
      question: p.question ?? "",
      age: p.age ?? "",
      sex: p.sex ?? "",
      history: p.history ?? "",
      medications: p.medications ?? "",
      allergies: p.allergies ?? "",
      vitals: p.vitals ?? "",
      labs: p.labs ?? "",
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const suggestQuestion = () => {
    const parts = [
      form.age && form.sex
        ? `${form.age}-year-old ${form.sex}`
        : form.age
          ? `${form.age}-year-old`
          : form.sex
            ? `${form.sex}`
            : "",
      form.history ? `with ${form.history}` : "",
      form.vitals ? `presenting with ${form.vitals}` : "",
      form.labs ? `(labs: ${form.labs})` : "",
    ].filter(Boolean);
    if (parts.length === 0) {
      toast.info("Fill at least age, sex, history, vitals or labs to suggest a question.");
      return;
    }
    const meds = form.medications ? ` on ${form.medications}` : "";
    const allergies = form.allergies ? `; allergies: ${form.allergies}` : "";
    const q = `${parts.join(" ")}${meds}${allergies} — what is the most likely diagnosis and evidence-based next step?`;
    setForm((f) => ({ ...f, question: q }));
    toast.success("Question suggested — edit it to match your clinical concern.");
  };

  const set = (k: keyof typeof blank) => (v: string) => setForm({ ...form, [k]: v });

  return (
    <AppShell
      title="Patient Workspace"
      subtitle="Structured patient intake synced securely to your clinical cloud"
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <GlassCard>
          <CardHeader className="pb-2">
            <SectionTitle
              icon={UserPlus}
              title={editingId !== null ? "Edit patient record" : "New patient record"}
              hint="All fields optional except identifier"
              {...(editingId !== null
                ? {
                    right: (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(null);
                          setForm({ ...blank });
                        }}
                      >
                        <X className="mr-1 h-3.5 w-3.5" /> Cancel
                      </Button>
                    ),
                  }
                : {})}
            />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <Label className="text-xs font-semibold text-primary">Clinical question</Label>
                  <p className="text-xs text-muted-foreground">What do you need evidence on?</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={suggestQuestion}
                  className="h-7 gap-1 text-xs"
                >
                  <Lightbulb className="h-3.5 w-3.5" /> Suggest
                </Button>
              </div>
              <Textarea
                className="mt-2 bg-background/60"
                rows={3}
                placeholder="e.g. 52-year-old male with fever, productive cough and right basal crackles — most likely diagnosis and first-line treatment?"
                value={form.question}
                onChange={(e) => set("question")(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                This is saved with the patient and pre-filled when you run the agents. It drives the
                entire evidence search.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label="Name / ID" value={form.name} onChange={set("name")} />
              <FormField label="Age" value={form.age} onChange={set("age")} />
              <FormField label="Sex" value={form.sex} onChange={set("sex")} />
            </div>
            <FormArea label="Past medical history" value={form.history} onChange={set("history")} />
            <FormArea label="Current medications" value={form.medications} onChange={set("medications")} />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormArea label="Allergies" value={form.allergies} onChange={set("allergies")} rows={2} />
              <FormArea label="Vitals" value={form.vitals} onChange={set("vitals")} rows={2} />
            </div>
            <FormArea label="Labs" value={form.labs} onChange={set("labs")} rows={3} />
            <Button onClick={save}>{editingId !== null ? "Update patient" : "Save patient"}</Button>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader className="pb-2">
            <SectionTitle title="Saved patients" hint={`${patients.length} records`} />
          </CardHeader>
          <CardContent className="space-y-2">
            {patients.length === 0 ? (
              <EmptyState
                icon={UserRound}
                title="No patients"
                description="Saved patients appear here and can be attached to consultations."
              />
            ) : (
              patients.map((p) => (
                <div key={p.id} className="rounded-lg border border-border/60 bg-card/40 p-3">
                  <div className="flex items-center gap-2">
                    <p className="flex-1 truncate text-sm font-medium">{p.name}</p>
                    <button
                      type="button"
                      aria-label="Edit patient"
                      onClick={() => edit(p)}
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete patient"
                      onClick={() => cols && p.id && deleteDoc(doc(cols.patients, p.id))}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {[p.age, p.sex].filter(Boolean).join(" · ") || "No demographics"}
                  </p>
                  {p.question && (
                    <p className="mt-1 line-clamp-2 text-xs text-primary/80">Q: {p.question}</p>
                  )}
                  {p.medications && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      Meds: {p.medications}
                    </p>
                  )}
                  <Button asChild size="sm" variant="outline" className="mt-2 h-7 w-full text-xs">
                    <Link to="/consultation" search={{ patient: String(p.id ?? "") }}>
                      <Play className="mr-1 h-3 w-3" /> Run agents on this patient
                    </Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </GlassCard>
      </div>
    </AppShell>
  );
}

