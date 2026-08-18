import { createServerFn } from "@tanstack/react-start";
import type { ImagingCondition, ImagingFinding } from "@/lib/agents/types";

interface XrayAnalysis {
  findings: ImagingFinding[];
  conditions: ImagingCondition[];
  urgency: "routine" | "prompt" | "urgent";
  nextSteps: string[];
  quality: { usable: boolean; note: string };
  narrative: string;
  provider: string;
}

const FALLBACK: XrayAnalysis = {
  findings: [],
  conditions: [],
  urgency: "routine",
  nextSteps: [],
  quality: { usable: false, note: "Image analysis unavailable — no provider response." },
  narrative: "",
  provider: "fallback",
};

const clamp01 = (n: unknown) =>
  typeof n === "number" && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;

export const analyzeXray = createServerFn({ method: "POST" })
  .inputValidator((input: { base64: string; mediaType: string; context?: string }) => input)
  .handler(async ({ data }): Promise<XrayAnalysis> => {
    const { callLlmJson } = await import("@/lib/ai/llm.server");

    const { value, provider } = await callLlmJson<XrayAnalysis>(
      {
        system:
          "You are the Medical Image Agent inside a clinical decision-support platform for clinicians. " +
          "You review chest radiographs and report candidate radiological findings plus the disease-level " +
          "differentials those findings would raise, for a qualified clinician to confirm. " +
          "Never state a definitive diagnosis. Report calibrated probabilities between 0 and 1. " +
          "If the image is not a chest X-ray or is unreadable, mark quality.usable false and return empty arrays.",
        messages: [
          {
            role: "user",
            content:
              "Review this chest radiograph. Return JSON of the shape " +
              '{"findings":[{"label":string,"probability":number}],' +
              '"conditions":[{"condition":string,"likelihood":number,"rationale":string}],' +
              '"urgency":"routine"|"prompt"|"urgent","nextSteps":[string],' +
              '"quality":{"usable":boolean,"note":string},"narrative":string}. ' +
              "findings use standard radiological labels (e.g. Consolidation, Pleural effusion, Cardiomegaly, " +
              "Pneumothorax, Atelectasis, Nodule/mass, Interstitial opacities, No acute cardiopulmonary abnormality) — max 6. " +
              "conditions are the candidate diseases those findings suggest (e.g. Community-acquired pneumonia, " +
              "Pulmonary oedema, COPD, Tuberculosis, Lung malignancy) — max 4, each with a one-sentence radiological rationale. " +
              "nextSteps are 2-4 concrete confirmatory actions (imaging, labs, clinical correlation). " +
              "The narrative is 3-5 sentences of structured radiological description. " +
              (data.context ? `Clinical context: ${data.context}` : ""),
          },
        ],
        image: { mediaType: data.mediaType, base64: data.base64 },
        maxTokens: 2000,
      },
      FALLBACK,
    );

    return {
      findings: (Array.isArray(value.findings) ? value.findings : []).slice(0, 6).map((f) => ({
        label: String(f?.label ?? "Finding"),
        probability: clamp01(f?.probability),
      })),
      conditions: (Array.isArray(value.conditions) ? value.conditions : [])
        .slice(0, 4)
        .map((c) => ({
          condition: String(c?.condition ?? ""),
          likelihood: clamp01(c?.likelihood),
          rationale: String(c?.rationale ?? ""),
        }))
        .filter((c) => c.condition),
      urgency: value.urgency === "urgent" || value.urgency === "prompt" ? value.urgency : "routine",
      nextSteps: (Array.isArray(value.nextSteps) ? value.nextSteps : []).slice(0, 4).map(String),
      quality: value.quality ?? FALLBACK.quality,
      narrative: value.narrative ?? "",
      provider,
    };
  });
