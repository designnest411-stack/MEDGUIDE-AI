import { useEffect, useRef, useState } from "react";
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
  Search,
  Stethoscope,
  Trash2,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { GlassCard, SectionTitle } from "@/components/medical-ui";
import { FormArea, FormField } from "@/components/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  getCollections,
  useTypedCollection,
  type PatientRecord,
  type PatientDocument,
} from "@/lib/db";
import { auth } from "@/lib/firebase";
import { uploadToCloudinary, getCloudinaryThumbnail } from "@/lib/cloudinary";
import { seedIndianClinicalCohort } from "@/lib/clinical-seed-data";

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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const autoSeededRef = useRef(false);

  // Auto-initialize realistic Indian clinical cases if a logged-in clinician's directory is empty
  useEffect(() => {
    if (user && !patientsLoading && patients.length === 0 && !autoSeededRef.current) {
      autoSeededRef.current = true;
      seedIndianClinicalCohort(user.uid)
        .then(() => {
          toast.info("Initialized clinical directory with verified cases");
        })
        .catch(() => {});
    }
  }, [user, patientsLoading, patients.length]);

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
    setIsFormOpen(false);
  };

  const getPatientFolder = (subfolder: "photos" | "documents") => {
    const uid = auth.currentUser?.uid || "clinician";
    const patientSlug = (editingId || form.name || "patient")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_")
      .slice(0, 32);
    return `medguide/${uid}/patients/${patientSlug}/${subfolder}`;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingDoc(true);
      toast.info("Uploading photo to secure cloud storage...");
      const res = await uploadToCloudinary(file, {
        folder: getPatientFolder("photos"),
        tags: ["patient-photo", form.name || "patient"],
      });
      const url = res.secureUrl || res.url;
      setForm((f) => ({ ...f, photoUrl: url }));
      toast.success(
        res.isLocalFallback ? "Photo stored locally" : "Photo uploaded to secure cloud!",
      );
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
      toast.info(`Uploading document "${file.name}" to secure cloud...`);
      const res = await uploadToCloudinary(file, {
        folder: getPatientFolder("documents"),
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
      toast.success(
        res.isLocalFallback ? "Document attached locally" : "Document saved to Cloudinary CDN!",
      );
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
    setIsFormOpen(true);
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

  const isFormActive = isFormOpen || editingId !== null;

  return (
    <AppShell
      title="Patient Workspace"
      subtitle="Structured patient intake synced securely to your clinical cloud"
      actions={
        !isFormActive ? (
          <Button
            size="sm"
            onClick={() => {
              setEditingId(null);
              setForm({ ...blank });
              setIsFormOpen(true);
            }}
            className="h-8 gap-1.5 text-xs shadow-xs"
          >
            <UserPlus className="h-3.5 w-3.5" /> Add Patient Record
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* Expandable New / Edit Patient Intake Form */}
        {isFormActive && (
          <GlassCard className="border-emerald-500/30 shadow-lg shadow-emerald-500/5 animate-in fade-in slide-in-from-top-2 duration-300">
            <CardHeader className="pb-3 border-b border-border/50">
              <SectionTitle
                icon={UserPlus}
                title={
                  editingId !== null
                    ? `Edit: ${form.name || "Patient Record"}`
                    : "New Clinical Patient Intake"
                }
                hint="All fields optional except identifier"
                right={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1 text-xs"
                    onClick={() => {
                      setEditingId(null);
                      setIsFormOpen(false);
                      setForm({ ...blank });
                    }}
                  >
                    <X className="h-3.5 w-3.5" /> Close Form
                  </Button>
                }
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
                  This is saved with the patient and pre-filled when you run the agents. It drives
                  the entire evidence search.
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

              <FormArea
                label="Past medical history"
                value={form.history}
                onChange={set("history")}
              />
              <FormArea
                label="Current medications"
                value={form.medications}
                onChange={set("medications")}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <FormArea
                  label="Allergies"
                  value={form.allergies}
                  onChange={set("allergies")}
                  rows={2}
                />
                <FormArea label="Vitals" value={form.vitals} onChange={set("vitals")} rows={2} />
              </div>
              <FormArea label="Labs" value={form.labs} onChange={set("labs")} rows={3} />
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <Button onClick={save} className="h-9 gap-1.5 text-xs">
                  {editingId !== null ? "Update Patient Record" : "Save Patient to Roster"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setIsFormOpen(false);
                    setForm({ ...blank });
                  }}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </GlassCard>
        )}

        {/* Saved Patients Directory (Full-Width Responsive Cards Grid) */}
        {(() => {
          const filteredPatients = (patients || []).filter((p) => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
              p.name?.toLowerCase().includes(q) ||
              p.history?.toLowerCase().includes(q) ||
              p.medications?.toLowerCase().includes(q) ||
              p.question?.toLowerCase().includes(q)
            );
          });

          return (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-bold text-foreground">
                    Clinical Patient Directory
                  </h3>
                  <Badge
                    variant="outline"
                    className="text-xs font-mono border-primary/30 text-primary bg-primary/10"
                  >
                    {patientsLoading ? "Loading..." : `${patients.length} Records`}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search patients, meds, history..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 pl-8 text-xs bg-card/60"
                    />
                  </div>
                  {!isFormActive && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingId(null);
                        setForm({ ...blank });
                        setIsFormOpen(true);
                      }}
                      className="h-8 gap-1.5 text-xs shrink-0"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Add Patient
                    </Button>
                  )}
                </div>
              </div>

              {patientsLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-16 w-full rounded-lg" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))}
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center space-y-3 bg-card/30">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <UserRound className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-bold text-foreground">
                      {searchQuery ? "No matching patients found" : "No patients in roster"}
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                      {searchQuery
                        ? `No patient records matched "${searchQuery}". Try a different keyword.`
                        : "Add your first patient record to begin clinical consultations and tracking."}
                    </p>
                  </div>
                  {!searchQuery && !isFormActive && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingId(null);
                        setForm({ ...blank });
                        setIsFormOpen(true);
                      }}
                      className="gap-1.5 text-xs h-8 shadow-xs"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Add Patient Record
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredPatients.map((p) => (
                    <GlassCard
                      key={p.id}
                      className="p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-200 shadow-xs group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {p.photoUrl ? (
                              <img
                                src={getCloudinaryThumbnail(p.photoUrl, 48, 48)}
                                alt={p.name}
                                className="h-10 w-10 rounded-full object-cover ring-2 ring-emerald-500/20 shrink-0"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20 shrink-0">
                                {(p.name?.[0] || "P").toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="font-display text-sm font-bold text-foreground truncate">
                                {p.name}
                              </h4>
                              <p className="font-mono text-[0.68rem] text-muted-foreground">
                                {[p.age ? `${p.age}y` : "", p.sex].filter(Boolean).join(" · ") ||
                                  "Demographics pending"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={() => edit(p)}
                              title="Edit patient record"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => cols && p.id && deleteDoc(doc(cols.patients, p.id))}
                              title="Delete patient record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {p.question && (
                          <div className="rounded-lg border border-border/50 bg-background/50 p-2.5 text-xs text-foreground/90 space-y-1">
                            <div className="flex items-center gap-1 text-[0.65rem] font-semibold text-primary">
                              <Stethoscope className="h-3 w-3" />
                              <span>Clinical Question:</span>
                            </div>
                            <p className="line-clamp-2 text-[0.72rem] leading-relaxed text-muted-foreground">
                              {p.question}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1 text-[0.65rem]">
                          {p.medications && (
                            <span className="inline-flex items-center rounded-md bg-card px-2 py-0.5 border border-border/60 text-muted-foreground">
                              💊 <strong className="ml-1 text-foreground">Meds:</strong>&nbsp;
                              {p.medications.length > 28
                                ? `${p.medications.slice(0, 28)}...`
                                : p.medications}
                            </span>
                          )}
                          {p.allergies && (
                            <span className="inline-flex items-center rounded-md bg-red-500/10 px-2 py-0.5 border border-red-500/25 text-red-600 dark:text-red-400 font-medium">
                              ⚠️ {p.allergies}
                            </span>
                          )}
                          {p.documents && p.documents.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 border border-primary/20 text-primary">
                              <FileText className="h-3 w-3" /> {p.documents.length} doc
                              {p.documents.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-border/50">
                        <Button asChild size="sm" className="w-full h-8 text-xs gap-1.5 shadow-xs">
                          <Link to="/consultation" search={{ patient: String(p.id ?? "") }}>
                            <Play className="h-3 w-3" /> Run Agents on this Patient
                          </Link>
                        </Button>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </AppShell>
  );
}
