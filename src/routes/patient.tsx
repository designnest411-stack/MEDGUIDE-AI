import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { query, orderBy, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  Cloud,
  ExternalLink,
  FileText,
  FileUp,
  Image as ImageIcon,
  Lightbulb,
  Loader2,
  Pencil,
  Play,
  Trash2,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { EmptyState, GlassCard, SectionTitle } from "@/components/medical-ui";
import { FormArea, FormField } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getCollections, useTypedCollection, type PatientRecord, type PatientDocument } from "@/lib/db";
import { auth } from "@/lib/firebase";
import { uploadToCloudinary, getCloudinaryThumbnail } from "@/lib/cloudinary";

export const Route = createFileRoute("/patient")({
  head: () => ({
    meta: [
      { title: "Patient Workspace : MEDGUIDE AI" },
      {
        name: "description",
        content:
          "Record patient demographics, history, medications, allergies, vitals, labs, and Cloudinary-stored medical scans: stored securely in your clinical workspace.",
      },
      { property: "og:title", content: "Patient Workspace : MEDGUIDE AI" },
      {
        property: "og:description",
        content: "Structured patient intake that feeds the clinical reasoning agents.",
      },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <AppShell title="Patient Workspace" subtitle="Clinical records module">
      <GlassCard className="p-8 text-center">
        <h2 className="text-lg font-semibold text-destructive">Patient Workspace Error</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {(error as Error)?.message || "Failed to load patient records."}
        </p>
        <Button onClick={reset} className="mt-4" size="sm">
          Retry Workspace
        </Button>
      </GlassCard>
    </AppShell>
  ),
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
  photoUrl: "",
  documents: [] as PatientDocument[],
};

function PatientPage() {
  const [user] = useAuthState(auth);
  const cols = user ? getCollections(user.uid) : null;
  const [patients, patientsLoading] = useTypedCollection<PatientRecord>(
    cols ? query(cols.patients, orderBy("createdAt", "desc")) : null,
  );

  const [form, setForm] = useState({ ...blank });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingDoc(true);
      toast.info("Uploading photo to Cloudinary...");
      const res = await uploadToCloudinary(file, {
        folder: "medguide-patients/photos",
        tags: ["patient-photo", form.name || "patient"],
      });
      const url = res.secureUrl || res.url;
      setForm((f) => ({ ...f, photoUrl: url }));
      toast.success(res.isLocalFallback ? "Photo stored locally" : "Photo uploaded to Cloudinary CDN!");
    } catch (err) {
      toast.error("Failed to upload photo: " + (err as Error).message);
    } finally {
      setUploadingDoc(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingDoc(true);
      toast.info(`Uploading document "${file.name}" to Cloudinary...`);
      const res = await uploadToCloudinary(file, {
        folder: "medguide-patients/documents",
        tags: ["patient-document", form.name || "patient"],
      });
      const newDoc: PatientDocument = {
        id: res.publicId || `doc_${Date.now()}`,
        name: file.name,
        url: res.secureUrl || res.url,
        publicId: res.publicId,
        type: file.type || "application/octet-stream",
        size: file.size,
        uploadedAt: Date.now(),
      };
      setForm((f) => ({
        ...f,
        documents: [...(f.documents || []), newDoc],
      }));
      toast.success(res.isLocalFallback ? "Document attached locally" : "Document saved to Cloudinary CDN!");
    } catch (err) {
      toast.error("Failed to upload document: " + (err as Error).message);
    } finally {
      setUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  };

  const removeDoc = (docId: string) => {
    setForm((f) => ({
      ...f,
      documents: (f.documents || []).filter((d) => d.id !== docId),
    }));
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
      photoUrl: p.photoUrl ?? "",
      documents: p.documents ?? [],
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
    const q = `${parts.join(" ")}${meds}${allergies}. What is the most likely diagnosis and evidence-based next step?`;
    setForm((f) => ({ ...f, question: q }));
    toast.success("Question suggested: edit it to match your clinical concern.");
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
                placeholder="e.g. 52-year-old male with fever, productive cough and right basal crackles: most likely diagnosis and first-line treatment?"
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

            {/* Patient Photo & Attachments */}
            <div className="rounded-lg border border-border/70 bg-card/50 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Cloud className="h-3.5 w-3.5 text-primary" />
                    Patient Photo & Clinical Documents
                  </Label>
                  <p className="text-[0.7rem] text-muted-foreground">
                    Securely encrypted cloud storage for clinical media, labs, and documentation.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={photoInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={uploadingDoc}
                    onClick={() => photoInputRef.current?.click()}
                    className="h-7 gap-1 text-xs"
                  >
                    {uploadingDoc ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <ImageIcon className="h-3 w-3" />
                    )}
                    {form.photoUrl ? "Change Photo" : "Add Photo"}
                  </Button>

                  <input
                    type="file"
                    ref={docInputRef}
                    onChange={handleDocUpload}
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={uploadingDoc}
                    onClick={() => docInputRef.current?.click()}
                    className="h-7 gap-1 text-xs"
                  >
                    <FileUp className="h-3 w-3" />
                    Attach Document
                  </Button>
                </div>
              </div>

              {form.photoUrl && (
                <div className="flex items-center gap-3 rounded border border-border/40 bg-background/50 p-2">
                  <img
                    src={getCloudinaryThumbnail(form.photoUrl, 64, 64)}
                    alt="Patient portrait"
                    className="h-10 w-10 rounded-full object-cover ring-1 ring-primary/40"
                  />
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-medium">Patient Photo Attached</p>
                    <a
                      href={form.photoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[0.65rem] text-primary hover:underline flex items-center gap-1"
                    >
                      View on Cloudinary CDN <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setForm((f) => ({ ...f, photoUrl: "" }))}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {form.documents && form.documents.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[0.7rem] font-medium text-muted-foreground">
                    Attached Files ({form.documents.length}):
                  </p>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {form.documents.map((docItem) => (
                      <div
                        key={docItem.id}
                        className="flex items-center justify-between rounded border border-border/50 bg-background/40 px-2 py-1.5 text-xs"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="truncate text-[0.75rem]">{docItem.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={docItem.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-primary p-0.5"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <button
                            type="button"
                            onClick={() => removeDoc(docItem.id)}
                            className="text-muted-foreground hover:text-destructive p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
            <SectionTitle
              title="Saved patients"
              hint={patientsLoading ? "Loading..." : `${patients.length} records`}
            />
          </CardHeader>
          <CardContent className="space-y-2">
            {patientsLoading ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-border/60 p-3 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-full" />
                </div>
                <div className="rounded-lg border border-border/60 p-3 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ) : patients.length === 0 ? (
              <EmptyState
                icon={UserRound}
                title="No patients"
                description="Saved patients appear here and can be attached to consultations."
              />
            ) : (
              patients.map((p) => (
                <div key={p.id} className="rounded-lg border border-border/60 bg-card/40 p-3">
                  <div className="flex items-center gap-2">
                    {p.photoUrl ? (
                      <img
                        src={getCloudinaryThumbnail(p.photoUrl, 48, 48)}
                        alt={p.name}
                        className="h-8 w-8 rounded-full object-cover ring-1 ring-border"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {(p.name?.[0] || "P").toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-[0.65rem] text-muted-foreground">
                        {[p.age, p.sex].filter(Boolean).join(" · ") || "No demographics"}
                      </p>
                    </div>
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
                  {p.documents && p.documents.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-[0.65rem] text-primary/80">
                      <FileText className="h-3 w-3" />
                      <span>{p.documents.length} document{p.documents.length > 1 ? "s" : ""} attached</span>
                    </div>
                  )}
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

