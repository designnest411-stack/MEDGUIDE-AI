import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { createThread, listThreads } from "@/lib/assistant/threads";

export const Route = createFileRoute("/assistant/")({
  head: () => ({
    meta: [
      { title: "Ask MedGuide — In-app Clinical Guide" },
      {
        name: "description",
        content:
          "Chat with the MedGuide guide to interpret consultation results, evidence tiers and safety findings, or learn how to use each module.",
      },
      { property: "og:title", content: "Ask MedGuide — In-app Clinical Guide" },
      {
        property: "og:description",
        content: "Interpret results and learn the platform with the in-app MedGuide guide.",
      },
    ],
  }),
  component: AssistantIndex,
});

function AssistantIndex() {
  const navigate = useNavigate();
  useEffect(() => {
    const id = listThreads()[0]?.id ?? createThread().id;
    void navigate({ to: "/assistant/$threadId", params: { threadId: id }, replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">
        Opening conversation…
      </p>
    </div>
  );
}
