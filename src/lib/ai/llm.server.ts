/**
 * Google AI Studio Gemini LLM Router.
 * Uses Google AI Studio free tier models with automatic cascading fallbacks
 * and tier-aware workload distribution.
 * Server-only. Never import from client code.
 */

export const GEMINI_WORKHORSE_MODELS = [
  "gemini-3.1-flash-lite", // 500 RPD, 15 RPM (Verified Active & Operational)
  "gemini-3.5-flash-lite", // 500 RPD, 15 RPM (Verified Active & Operational)
] as const;

export const GEMINI_REASONING_MODELS = [
  "gemini-3.5-flash", // 20 RPD, 5 RPM (Verified Active & Operational)
  "gemini-3.7-flash", // 20 RPD, 5 RPM (Agentic reasoning / coding)
  "gemini-3.6-flash", // 20 RPD, 5 RPM
] as const;

export const GEMINI_VOLUME_MODELS = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite"] as const;

export const GEMINI_FREE_TIER_MODELS = [
  ...GEMINI_WORKHORSE_MODELS,
  ...GEMINI_REASONING_MODELS,
  ...GEMINI_VOLUME_MODELS,
] as const;

export type GeminiModel = (typeof GEMINI_FREE_TIER_MODELS)[number] | string;

export interface LlmMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LlmOptions {
  system?: string;
  messages: LlmMessage[];
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
  thinking?: boolean;
  /** Optional priority tier */
  tier?: "workhorse" | "reasoning" | "volume";
  /** Optional Google Search grounding */
  grounding?: boolean;
  /** Optional image attached to the first user message (multimodal vision). */
  image?: { mediaType: string; base64: string } | undefined;
  /** Optional structured JSON output enforcement */
  responseMimeType?: "application/json" | "text/plain";
}

export interface LlmResult {
  text: string;
  provider: "google-gemini";
  model: string;
}

class GeminiApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function getApiKey(): string | undefined {
  return (
    process.env["GEMINI_API_KEY"] ||
    process.env["GOOGLE_API_KEY"] ||
    process.env["GOOGLE_AI_API_KEY"]
  );
}

async function callSingleGeminiModel(
  opts: LlmOptions,
  model: string,
  apiKey: string,
): Promise<LlmResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const contents = opts.messages.map((m, i) => {
    const role = m.role === "assistant" ? "model" : "user";
    const parts: Array<Record<string, unknown>> = [];

    if (i === 0 && opts.image) {
      parts.push({
        inlineData: {
          mimeType: opts.image.mediaType,
          data: opts.image.base64,
        },
      });
    }

    parts.push({ text: m.content });
    return { role, parts };
  });

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: opts.maxTokens ?? 4096,
      temperature: 0.2,
      ...(opts.responseMimeType ? { responseMimeType: opts.responseMimeType } : {}),
    },
  };

  if (opts.system) {
    body["systemInstruction"] = {
      parts: [{ text: opts.system }],
    };
  }

  if (opts.grounding) {
    body["tools"] = [{ googleSearch: {} }];
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const retryable = res.status === 429 || res.status >= 500;
    throw new GeminiApiError(
      `Gemini API (${model}) ${res.status}: ${detail.slice(0, 400)}`,
      res.status,
      retryable,
    );
  }

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = (json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");

  return { text, provider: "google-gemini", model };
}

function getModelCascade(opts: LlmOptions): string[] {
  if (opts.tier === "reasoning" || opts.thinking || opts.effort === "high") {
    return [...GEMINI_REASONING_MODELS, ...GEMINI_WORKHORSE_MODELS, ...GEMINI_VOLUME_MODELS];
  }
  if (opts.tier === "volume") {
    return [...GEMINI_VOLUME_MODELS, ...GEMINI_WORKHORSE_MODELS, ...GEMINI_REASONING_MODELS];
  }
  // Default: Workhorse first (500 RPD / 15 RPM), then reasoning, then volume
  return [...GEMINI_WORKHORSE_MODELS, ...GEMINI_REASONING_MODELS, ...GEMINI_VOLUME_MODELS];
}

export async function callLlm(opts: LlmOptions): Promise<LlmResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "No Gemini API key found. Please set GEMINI_API_KEY or GOOGLE_API_KEY in your environment.",
    );
  }

  const cascade = getModelCascade(opts);
  let lastError: Error | null = null;

  for (const model of cascade) {
    try {
      return await callSingleGeminiModel(opts, model, apiKey);
    } catch (err) {
      const e = err as GeminiApiError;
      lastError = e;
      // If 429 rate limit, 404, or 5xx, fall through to next free tier model immediately
      if (e.status === 429 || e.status >= 500 || e.status === 404) {
        console.warn(
          `[Gemini Free Tier] Model ${model} returned ${e.status}, falling back to next free tier model...`,
        );
        await sleep(250);
        continue;
      }
      // For other client errors (e.g. 400 bad request payload), do not cascade blindly
      break;
    }
  }

  throw (
    lastError ??
    new Error("All Gemini free tier models failed to respond. Please check your API quota.")
  );
}

/** Ask the model for JSON and parse it defensively. */
export async function callLlmJson<T>(
  opts: LlmOptions,
  fallback: T,
): Promise<{ value: T; provider: string }> {
  const system = `${opts.system ?? ""}\n\nRespond with valid JSON only. No markdown fences, no prose before or after.`;
  try {
    const res = await callLlm({
      ...opts,
      system,
      responseMimeType: "application/json",
    });
    const text = res.text.trim();
    const start = text.indexOf("{");
    const startArr = text.indexOf("[");
    const first = start === -1 ? startArr : startArr === -1 ? start : Math.min(start, startArr);
    const lastObj = text.lastIndexOf("}");
    const lastArr = text.lastIndexOf("]");
    const last = Math.max(lastObj, lastArr);
    if (first === -1 || last === -1) return { value: fallback, provider: res.provider };
    return { value: JSON.parse(text.slice(first, last + 1)) as T, provider: res.provider };
  } catch {
    return { value: fallback, provider: "fallback" };
  }
}
