import { createFileRoute } from "@tanstack/react-router";
import type { ConsultationInput, StreamEvent } from "@/lib/agents/types";

export const Route = createFileRoute("/api/consult")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const input = (await request.json()) as ConsultationInput;
        if (!input?.question || typeof input.question !== "string" || !input.question.trim()) {
          return new Response("Missing question", { status: 400 });
        }
        input.question = input.question.trim().slice(0, 4000);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const send = (e: StreamEvent) => {
              try {
                controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
              } catch {
                /* client disconnected */
              }
            };
            try {
              const { runConsultation } = await import("@/lib/agents/orchestrator.server");
              const result = await runConsultation(input, send);
              send({ type: "done", result });
            } catch (err) {
              send({ type: "error", message: (err as Error).message ?? "Consultation failed" });
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
