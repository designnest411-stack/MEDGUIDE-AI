import { createFileRoute } from "@tanstack/react-router";
import { Database, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { GlassCard, SectionTitle } from "@/components/medical-ui";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { wipeAll } from "@/lib/db";
import { DISCLAIMER } from "@/lib/agents/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — MEDGUIDE AI" },
      {
        name: "description",
        content: "Manage stored clinical data: wipe everything from your cloud storage.",
      },
      { property: "og:title", content: "Settings — MEDGUIDE AI" },
      {
        property: "og:description",
        content: "Data controls and platform information for MEDGUIDE AI.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Data controls — securely stored in Firebase Cloud">
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <CardHeader className="pb-2">
            <SectionTitle
              icon={Database}
              title="Cloud data"
              hint="Stored securely in your Firebase account"
            />
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Your patient records, consultations, and timelines are securely synced across your
              devices. If you wish to delete all your data permanently from the cloud, use the
              button below.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  if (
                    confirm("Are you sure you want to delete ALL your data? This cannot be undone.")
                  ) {
                    await wipeAll();
                    toast.success("All data cleared from the cloud.");
                  }
                }}
              >
                Wipe all data
              </Button>
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader className="pb-2">
            <SectionTitle icon={ShieldAlert} title="Scope and safety" />
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              MEDGUIDE AI is an evidence-based clinical decision support tool for clinicians and
              medical students. It is not an AI doctor and does not issue diagnoses.
            </p>
            <p>
              Every answer carries an explicit evidence trail, a safety audit and a confidence band
              of High, Medium or Low. Findings from the imaging module are localisation and triage
              aids that require radiologist confirmation.
            </p>
            <p className="rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
              {DISCLAIMER}
            </p>
          </CardContent>
        </GlassCard>
      </div>
    </AppShell>
  );
}
