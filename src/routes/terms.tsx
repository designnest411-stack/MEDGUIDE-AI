import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldAlert, AlertTriangle, Scale, Stethoscope, CheckCircle2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { GlassCard, SectionTitle } from "@/components/medical-ui";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DISCLAIMER } from "@/lib/agents/types";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions : MEDGUIDE AI" },
      {
        name: "description",
        content:
          "Terms of service, clinical decision support disclaimer, professional scope, and liability conditions for MEDGUIDE AI.",
      },
      { property: "og:title", content: "Terms and Conditions : MEDGUIDE AI" },
      {
        property: "og:description",
        content:
          "Statutory clinical decision support terms, user responsibilities, and medical disclaimers.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <AppShell
      title="Terms and Conditions"
      subtitle="Terms of use, clinical decision support boundaries, and legal conditions"
      wide
      actions={
        <Button asChild size="sm" variant="outline">
          <Link to="/dashboard">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
      }
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <GlassCard className="border-warning/40 bg-warning/5">
          <CardHeader className="pb-3">
            <SectionTitle
              icon={ShieldAlert}
              title="Statutory Clinical Decision Support Disclaimer"
              hint="Mandatory Notice"
            />
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-foreground">
            <p className="font-semibold text-warning">
              {DISCLAIMER}
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              MEDGUIDE AI is an evidence aggregation and clinical decision support system designed solely for educational, informational, and advisory exploration by qualified healthcare professionals and students under supervision. It is not an autonomous medical practitioner, does not provide medical diagnoses, and cannot substitute for individualized clinical evaluation, physical examination, and professional judgment.
            </p>
          </CardContent>
        </GlassCard>

        <div className="grid gap-6 md:grid-cols-2">
          <GlassCard>
            <CardHeader className="pb-3">
              <SectionTitle icon={AlertTriangle} title="1. Emergency Medical Disclaimer" />
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">Do not use in acute medical emergencies:</strong> If you are evaluating a patient with sudden cardiovascular collapse, acute respiratory arrest, active severe hemorrhage, or immediate life-threatening conditions, bypass software decision tools and activate local emergency medical protocols immediately.
              </p>
            </CardContent>
          </GlassCard>

          <GlassCard>
            <CardHeader className="pb-3">
              <SectionTitle icon={Stethoscope} title="2. Intended Users and Verification" />
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">Clinician Responsibility:</strong> The treating clinician retains exclusive legal, ethical, and clinical responsibility for patient care. Every proposed differential diagnosis, drug recommendation, laboratory test, and radiologic finding must be corroborated against standard hospital protocols, drug formularies, and primary literature.
              </p>
            </CardContent>
          </GlassCard>
        </div>

        <GlassCard>
          <CardHeader className="pb-3">
            <SectionTitle icon={Scale} title="3. Limitation of Liability" />
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              To the fullest extent permitted by applicable law, MEDGUIDE AI, its contributors, and developers shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages resulting from:
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Clinical decisions, prescriptions, or therapeutic courses initiated using system outputs.</li>
              <li>Omissions, inaccuracies, or delays in external biomedical APIs (PubMed, openFDA, RxNav, WHO).</li>
              <li>Radiological interpretations derived from browser-based WebAssembly occlusion heatmaps.</li>
              <li>Temporary unavailability or degradation of third-party network services.</li>
            </ul>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader className="pb-3">
            <SectionTitle icon={CheckCircle2} title="4. Scientific Integrity and Sourced Inferences" />
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              The platform implements algorithmic citation verification to identify and prune unsupported citation IDs. Inferences marked as "Reasoning only" represent synthetic reasoning steps without an attached peer-reviewed document ID and must be treated with heightened scrutiny.
            </p>
            <p>
              Qualitative confidence bands (High, Medium, Low, Insufficient evidence) represent empirical proxy metrics derived from citation counts and guideline concordance, not statistical guarantees of diagnostic precision.
            </p>
          </CardContent>
        </GlassCard>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/80 bg-card/60 p-4 text-xs text-muted-foreground">
          <p>
            By using MEDGUIDE AI, you acknowledge and agree to these terms and clinical boundaries.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-primary hover:underline font-medium">
              Privacy Policy
            </Link>
            <Link to="/settings" className="text-primary hover:underline font-medium">
              Workspace Settings
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
