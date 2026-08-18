/**
 * Client-side chest X-ray localisation aid.
 *
 * Uses the public ONNX DenseNet-121 model (ONNX Model Zoo) in the browser to
 * produce an occlusion-based saliency map. This is an EXPLAINABILITY overlay
 * that highlights which regions drive the network's response — it is NOT a
 * diagnostic classifier. Pathology labels come from the Medical Image Agent.
 */

export const DENSENET_URL =
  "https://media.githubusercontent.com/media/onnx/models/main/validated/vision/classification/densenet-121/model/densenet-12.onnx";

export const SALIENCY_GRID = 7;

let sessionPromise: Promise<import("onnxruntime-web").InferenceSession> | null = null;

async function getSession(modelUrl: string) {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const ort = await import("onnxruntime-web");
      ort.env.wasm.numThreads = 1;
      return ort.InferenceSession.create(modelUrl, { executionProviders: ["wasm"] });
    })();
  }
  return sessionPromise;
}

function toTensorData(canvas: HTMLCanvasElement): Float32Array {
  const ctx = canvas.getContext("2d")!;
  const { data } = ctx.getImageData(0, 0, 224, 224);
  const out = new Float32Array(3 * 224 * 224);
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];
  for (let i = 0; i < 224 * 224; i++) {
    for (let c = 0; c < 3; c++) {
      out[c * 224 * 224 + i] = (data[i * 4 + c]! / 255 - mean[c]!) / std[c]!;
    }
  }
  return out;
}

function drawScaled(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 224;
  canvas.height = 224;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, 224, 224);
  return canvas;
}

async function forward(
  session: import("onnxruntime-web").InferenceSession,
  input: Float32Array,
): Promise<Float32Array> {
  const ort = await import("onnxruntime-web");
  const tensor = new ort.Tensor("float32", input, [1, 3, 224, 224]);
  const name = session.inputNames[0]!;
  const result = await session.run({ [name]: tensor });
  const outName = session.outputNames[0]!;
  return result[outName]!.data as Float32Array;
}

function magnitude(vec: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) sum += Math.abs(vec[i]!);
  return sum / vec.length;
}

export interface SaliencyOutput {
  heatmap: number[][];
  modelName: string;
}

/**
 * Occlusion saliency: grey out each cell of a grid and measure how much the
 * network's response changes. Larger change = more influential region.
 */
export async function computeSaliency(
  img: HTMLImageElement,
  modelUrl: string = DENSENET_URL,
  onProgress?: (done: number, total: number) => void,
): Promise<SaliencyOutput> {
  const session = await getSession(modelUrl);
  const base = toTensorData(drawScaled(img));
  const baseline = magnitude(await forward(session, base));

  const cell = Math.floor(224 / SALIENCY_GRID);
  const heatmap: number[][] = [];
  const total = SALIENCY_GRID * SALIENCY_GRID;
  let done = 0;

  for (let gy = 0; gy < SALIENCY_GRID; gy++) {
    const row: number[] = [];
    for (let gx = 0; gx < SALIENCY_GRID; gx++) {
      const patched = Float32Array.from(base);
      for (let y = gy * cell; y < (gy + 1) * cell; y++) {
        for (let x = gx * cell; x < (gx + 1) * cell; x++) {
          const i = y * 224 + x;
          for (let c = 0; c < 3; c++) patched[c * 224 * 224 + i] = 0;
        }
      }
      const score = magnitude(await forward(session, patched));
      row.push(Math.abs(baseline - score));
      onProgress?.(++done, total);
    }
    heatmap.push(row);
  }

  const flat = heatmap.flat();
  const min = Math.min(...flat);
  const max = Math.max(...flat);
  const span = max - min || 1;
  return {
    heatmap: heatmap.map((r) => r.map((v) => (v - min) / span)),
    modelName: "DenseNet-121 (ONNX Model Zoo) — occlusion saliency",
  };
}

export function heatColor(v: number, alpha = 0.55): string {
  const hue = (1 - v) * 220; // blue (low) -> red (high)
  return `hsla(${hue}, 90%, 55%, ${alpha * Math.max(v, 0.12)})`;
}
