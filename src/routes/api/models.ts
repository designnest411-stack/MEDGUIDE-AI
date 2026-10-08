import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/models")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { getFreeTierPoolMetrics } = await import("@/lib/ai/llm.server");
          const metrics = getFreeTierPoolMetrics();
          return new Response(JSON.stringify({ success: true, metrics }), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          });
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: (err as Error).message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as {
            tier?: "workhorse" | "reasoning" | "volume";
            testPrompt?: string;
          };

          const { callLlm, getFreeTierPoolMetrics } = await import("@/lib/ai/llm.server");
          const t0 = Date.now();
          const res = await callLlm({
            tier: body.tier ?? "workhorse",
            system: "You are a clinical decision support verification probe. Answer in under 10 words.",
            messages: [
              {
                role: "user",
                content: body.testPrompt || "Confirm AI Engine operational status and response latency.",
              },
            ],
            maxTokens: 100,
          });
          const elapsed = Date.now() - t0;
          const metrics = getFreeTierPoolMetrics();

          return new Response(
            JSON.stringify({
              success: true,
              model: res.model,
              text: res.text.trim(),
              durationMs: elapsed,
              attemptsCount: res.attemptsCount,
              failoverHistory: res.failoverHistory ?? [],
              totalPoolCapacityRpd: res.totalPoolCapacityRpd,
              searchGroundingUsed: res.searchGroundingUsed ?? false,
              metrics,
            }),
            {
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
              },
            },
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: (err as Error).message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
