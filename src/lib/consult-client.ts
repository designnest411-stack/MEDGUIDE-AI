import type { ConsultationInput, ConsultationResult, StreamEvent } from "@/lib/agents/types";

export async function streamConsultation(
  input: ConsultationInput,
  onEvent: (e: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<ConsultationResult | null> {
  const res = await fetch("/api/consult", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    ...(signal ? { signal } : {}),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Consultation failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let final: ConsultationResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line) as StreamEvent;
        onEvent(event);
        if (event.type === "done") final = event.result;
        if (event.type === "error") throw new Error(event.message);
      } catch (err) {
        if (err instanceof SyntaxError) continue;
        throw err;
      }
    }
  }
  return final;
}
