import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { query, orderBy, addDoc, deleteDoc, doc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { Image as ImageIcon, Loader2, ScanEye, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { EmptyState, GlassCard, SectionTitle } from "@/components/medical-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

import { Label } from "@/components/ui/label";
import { getCollections, useTypedCollection, type ImagingRecord } from "@/lib/db";
import { auth } from "@/lib/firebase";
import { SALIENCY_GRID, computeSaliency, heatColor } from "@/lib/imaging/xray";
import { analyzeXray } from "@/lib/imaging/imaging.functions";
import type { ImagingResult } from "@/lib/agents/types";

export const Route = createFileRoute("/imaging")({
  head: () => ({
    meta: [
      { title: "Chest X-ray Analysis — MEDGUIDE AI" },
      {
        name: "description",
        content:
          "Upload a chest radiograph for candidate findings and an explainable in-browser saliency heatmap.",
      },
      { property: "og:title", content: "Chest X-ray Analysis — MEDGUIDE AI" },
      {
        property: "og:description",
        content:
          "Explainable chest X-ray review with saliency overlays — clinician confirmation required.",
      },
    ],
  }),
  component: ImagingPage,
});

function ImagingPage() {
  const analyze = useServerFn(analyzeXray);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [overlay, setOverlay] = useState(true);
  const [result, setResult] = useState<ImagingResult | null>(null);

  const [user] = useAuthState(auth);
  const cols = user ? getCollections(user.uid) : null;
  const [studies] = useTypedCollection<ImagingRecord>(
    cols ? query(cols.imaging, orderBy("createdAt", "desc")) : null,
  );

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const rawUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const maxDim = 1024;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(rawUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.88));
        };
        img.onerror = () => resolve(rawUrl);
        img.src = rawUrl;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onFile = async (file: File) => {
    try {
      const scaledUrl = await resizeImage(file);
      setDataUrl(scaledUrl);
      setFileName(file.name);
      setResult(null);
    } catch {
      toast.error("Could not read the selected image file.");
    }
  };

  const run = async () => {
    if (!dataUrl) return;
    setBusy(true);
    setProgress(0);
    setResult(null);
    
    const commaIdx = dataUrl.indexOf(",");
    const meta = commaIdx !== -1 ? dataUrl.slice(0, commaIdx) : "";
    const rawBase64 = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl;
    let mediaType = meta?.match(/data:(.*?);/)?.[1]?.toLowerCase() ?? "image/jpeg";
    if (mediaType === "image/jpg") mediaType = "image/jpeg";

    try {
      const analysis = await analyze({
        data: { base64: rawBase64, mediaType },
      });

      // Show the radiological read straight away; the saliency overlay is a
      // slower in-browser pass that gets attached to the same result after.
      const base: ImagingResult = {
        findings: analysis.findings,
        quality: analysis.quality,
        narrative: analysis.narrative,
        modelName: "Vision agent only",
        conditions: analysis.conditions,
        urgency: analysis.urgency,
        nextSteps: analysis.nextSteps,
      };
      setResult(base);

      let heatmap: number[][] | undefined;
      let modelName = "Vision agent only";
      try {
        if (imgRef.current) {
          const sal = await computeSaliency(imgRef.current, undefined, (d, t) =>
            setProgress(Math.round((d / t) * 100)),
          );
          heatmap = sal.heatmap;
          modelName = sal.modelName;
        }
      } catch (salErr) {
        console.warn("Saliency calculation error:", salErr);
      }

      const final: ImagingResult = {
        ...base,
        modelName,
        ...(heatmap ? { heatmap } : {}),
      };
      setResult(final);
      if (cols) {
        await addDoc(cols.imaging, {
          name: fileName || "chest-xray",
          imageDataUrl: dataUrl,
          result: final,
          createdAt: Date.now(),
        });
      }
      toast.success("Analysis saved — it will attach to your next consultation.");
    } catch (err) {
      console.error("Image analysis failed:", err);
      toast.error("Image analysis encountered an error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell
      title="Chest X-ray Analysis"
      subtitle="Candidate findings with an explainable in-browser saliency overlay"
      wide
      actions={
        dataUrl ? (
          <Button size="sm" onClick={run} disabled={busy}>
            {busy ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <ScanEye className="mr-1.5 h-4 w-4" />
            )}
            Analyse
          </Button>
        ) : null
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <GlassCard>
          <CardHeader className="pb-2">
            <SectionTitle
              icon={ImageIcon}
              title="Radiograph"
              hint={fileName || "PNG or JPEG, frontal chest film"}
              right={
                dataUrl && result?.heatmap ? (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="ov" className="text-xs text-muted-foreground">
                      Heatmap
                    </Label>
                    <Switch id="ov" checked={overlay} onCheckedChange={setOverlay} />
                  </div>
                ) : undefined
              }
            />
          </CardHeader>
          <CardContent>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
            {!dataUrl ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-border/70 py-20 transition-colors hover:border-primary/50"
              >
                <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-display text-sm font-semibold">Upload a chest X-ray</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The image stays in your browser; only the analysis request leaves the device.
                </p>
              </button>
            ) : (
              <div className="relative mx-auto w-fit overflow-hidden rounded-xl border border-border/60">
                <img
                  ref={imgRef}
                  src={dataUrl}
                  alt="Uploaded chest radiograph"
                  className="max-h-[62vh]"
                />
                {overlay && result?.heatmap && (
                  <div
                    className="pointer-events-none absolute inset-0 grid"
                    style={{
                      gridTemplateColumns: `repeat(${SALIENCY_GRID}, 1fr)`,
                      gridTemplateRows: `repeat(${SALIENCY_GRID}, 1fr)`,
                    }}
                  >
                    {result.heatmap.flat().map((v, i) => (
                      <div key={i} style={{ background: heatColor(v) }} />
                    ))}
                  </div>
                )}
              </div>
            )}
            {busy && (
              <div className="mt-4">
                <Progress value={progress} />
                <p className="mt-1.5 text-center text-xs text-muted-foreground">
                  {progress > 0
                    ? `Computing in-browser saliency… ${progress}% (first run downloads the model)`
                    : "Medical Image Agent is reviewing the radiograph — this can take up to a minute…"}
                </p>
              </div>
            )}
            {dataUrl && (
              <div className="mt-3 flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  Replace image
                </Button>
              </div>
            )}
          </CardContent>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard>
            <CardHeader className="pb-2">
              <SectionTitle
                title="Candidate findings"
                hint={result?.modelName ?? "Awaiting analysis"}
              />
            </CardHeader>
            <CardContent>
              {!result ? (
                <EmptyState
                  icon={ScanEye}
                  title="No analysis yet"
                  description="Upload a radiograph and run the Medical Image Agent."
                />
              ) : (
                <div className="space-y-3">
                  {!result.quality.usable && (
                    <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                      {result.quality.note}
                    </p>
                  )}
                  {result.findings.map((f) => (
                    <div key={f.label}>
                      <div className="flex items-center justify-between text-xs">
                        <span>{f.label}</span>
                        <span className="font-mono text-muted-foreground">
                          {Math.round(f.probability * 100)}%
                        </span>
                      </div>
                      <Progress className="mt-1 h-1.5" value={f.probability * 100} />
                    </div>
                  ))}
                  {result.conditions && result.conditions.length > 0 && (
                    <div className="border-t border-border/60 pt-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
                          Candidate conditions
                        </p>
                        {result.urgency && (
                          <Badge
                            variant="outline"
                            className={
                              result.urgency === "urgent"
                                ? "border-destructive/50 text-destructive"
                                : result.urgency === "prompt"
                                  ? "border-warning/50 text-warning"
                                  : "text-muted-foreground"
                            }
                          >
                            {result.urgency}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        {result.conditions.map((c) => (
                          <div key={c.condition}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium">{c.condition}</span>
                              <span className="font-mono text-muted-foreground">
                                {Math.round(c.likelihood * 100)}%
                              </span>
                            </div>
                            <p className="mt-0.5 text-[0.68rem] leading-relaxed text-muted-foreground">
                              {c.rationale}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.nextSteps && result.nextSteps.length > 0 && (
                    <div className="border-t border-border/60 pt-3">
                      <p className="mb-1.5 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
                        Suggested confirmation
                      </p>
                      <ul className="list-disc space-y-1 pl-4 text-[0.68rem] leading-relaxed text-muted-foreground">
                        {result.nextSteps.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.narrative && (
                    <p className="border-t border-border/60 pt-3 text-xs leading-relaxed text-muted-foreground">
                      {result.narrative}
                    </p>
                  )}
                  <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
                    The heatmap shows which image regions most influence the network's response. It
                    is a localisation aid, not a diagnosis. A radiologist must confirm all findings.
                  </p>
                </div>
              )}
            </CardContent>
          </GlassCard>

          <GlassCard>
            <CardHeader className="pb-2">
              <SectionTitle title="Saved studies" hint={`${studies.length} local`} />
            </CardHeader>
            <CardContent className="space-y-2">
              {studies.length === 0 ? (
                <p className="text-xs text-muted-foreground">No studies saved yet.</p>
              ) : (
                studies.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 p-2"
                  >
                    <img
                      src={s.imageDataUrl}
                      alt={s.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs">{s.name}</p>
                      <p className="text-[0.65rem] text-muted-foreground">
                        {s.result.findings[0]?.label ?? "No findings"} ·{" "}
                        {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[0.6rem]">
                      {s.result.findings.length}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => cols && s.id && deleteDoc(doc(cols.imaging, s.id))}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </CardContent>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
