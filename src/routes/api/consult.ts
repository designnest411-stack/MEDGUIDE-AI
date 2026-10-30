import { createFileRoute } from "@tanstack/react-router";
import type { ConsultationInput, StreamEvent } from "@/lib/agents/types";
import { checkRateLimit } from "@/lib/rate-limit.server";
import { verifyAuthToken } from "@/lib/auth.server";

export const Route = createFileRoute("/api/consult")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Enforce Server-Side Firebase Authentication
        const auth = await verifyAuthToken(request);
        if (!auth.authenticated || !auth.user) {
          return new Response(
            JSON.stringify({
              error: auth.error ?? "Authentication required to run clinical consultations.",
            }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // 2. Sliding Window Rate Limiting (Per Authenticated Clinician UID)
        const rateLimit = checkRateLimit(request, `consult:${auth.user.uid}`, {
          windowMs: 60_000,
          maxRequests: 15,
        });
        if (!rateLimit.success && rateLimit.response) {
          return rateLimit.response;
        }

        // 3. Request Size & Payload Schema Guard
        const contentLength = request.headers.get("content-length");
        if (contentLength && parseInt(contentLength, 10) > 102_400) {
          return new Response(JSON.stringify({ error: "Payload exceeds 100KB limit." }), {
            status: 413,
            headers: { "Content-Type": "application/json" },
          });
        }

        let input: ConsultationInput;
        try {
          input = (await request.json()) as ConsultationInput;
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON request body." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!input?.question || typeof input.question !== "string" || !input.question.trim()) {
          return new Response(JSON.stringify({ error: "Missing clinical question." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Sanitize string bounds
        input.question = input.question.trim().slice(0, 4000);
        if (input.patient) {
          if (typeof input.patient.history === "string")
            input.patient.history = input.patient.history.slice(0, 3000);
          if (typeof input.patient.medications === "string")
            input.patient.medications = input.patient.medications.slice(0, 2000);
          if (typeof input.patient.allergies === "string")
            input.patient.allergies = input.patient.allergies.slice(0, 2000);
          if (typeof input.patient.vitals === "string")
            input.patient.vitals = input.patient.vitals.slice(0, 2000);
          if (typeof input.patient.labs === "string")
            input.patient.labs = input.patient.labs.slice(0, 2000);
        }

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
