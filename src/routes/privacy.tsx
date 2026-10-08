import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield, Lock, FileText, Database, Server, UserCheck } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { GlassCard, SectionTitle } from "@/components/medical-ui";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy : MEDGUIDE AI" },
      {
        name: "description",
        content:
          "Privacy policy, data protection, patient confidentiality, and security standards for the MEDGUIDE AI clinical platform.",
      },
      { property: "og:title", content: "Privacy Policy : MEDGUIDE AI" },
      {
        property: "og:description",
        content:
          "Clinical data protection, row-level tenant isolation, and verification architecture.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <AppShell
      title="Privacy Policy"
      subtitle="Data protection standards, clinical confidentiality, and architecture security"
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
        <GlassCard>
          <CardHeader className="pb-3">
            <SectionTitle
              icon={Shield}
              title="Overview and Commitment"
              hint="Effective Date: October 2026"
            />
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p className="text-foreground font-medium">
              MEDGUIDE AI operates as an evidence-based clinical decision support tool designed for licensed clinicians, healthcare trainees, and medical researchers. We adhere to rigorous information security, patient data privacy, and minimal retention principles.
            </p>
            <p>
              This Privacy Policy explains how information entered into the platform is handled, where it is processed, and how your clinician account data is isolated.
            </p>
          </CardContent>
        </GlassCard>

        <div className="grid gap-6 md:grid-cols-2">
          <GlassCard>
            <CardHeader className="pb-3">
              <SectionTitle icon={Lock} title="1. Patient Data and Confidentiality" />
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">De-Identified Data Input:</strong> Clinicians are required to enter only de-identified or pseudonymized clinical case summaries. Do not input unmasked direct identifiers such as full patient legal names, national identification numbers, or residential addresses.
              </p>
              <p>
                <strong className="text-foreground">Clinical Purpose Limitation:</strong> Information submitted during consultation intake is utilized exclusively to perform real-time literature retrieval, allergy verification, drug-drug interaction auditing, and differential reasoning.
              </p>
            </CardContent>
          </GlassCard>

          <GlassCard>
            <CardHeader className="pb-3">
              <SectionTitle icon={Server} title="2. Edge and In-Browser Processing" />
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">Local Vision Inference:</strong> Radiograph saliency evaluation occurs inside your client browser through ONNX Runtime WebAssembly. Full-resolution imaging files remain on your local device.
              </p>
              <p>
                <strong className="text-foreground">Local Guidance Sessions:</strong> Conversations initiated with the in-app guide ("Ask MedGuide") are stored directly in your browser local storage and can be deleted locally at any time.
              </p>
            </CardContent>
          </GlassCard>
        </div>

        <GlassCard>
          <CardHeader className="pb-3">
            <SectionTitle icon={Database} title="3. Cloud Storage and Tenant Isolation" />
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              When authenticated via Google OAuth, your workspace records (saved patients, consultation traces, clinical timelines, downsampled imaging thumbnails, and generated reports) are stored in Cloud Firestore under strict row-level security rules:
            </p>
            <div className="rounded-lg border border-border/80 bg-card/60 p-3 font-mono text-xs text-foreground">
              match /users/&#123;userId&#125;/&#123;document=**&#125; &#123; allow read, write: if request.auth != null &amp;&amp; request.auth.uid == userId; &#125;
            </div>
            <p>
              Every user account is partitioned into an isolated data partition. No clinician can read, modify, or query clinical records belonging to another clinician account.
            </p>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader className="pb-3">
            <SectionTitle icon={FileText} title="4. External Biomedical Query Services" />
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              To synthesize verifiable differential diagnoses, MEDGUIDE AI communicates with authoritative public medical databases:
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong className="text-foreground">National Center for Biotechnology Information (NCBI):</strong> Keyword queries to PubMed E-utilities for peer-reviewed studies.
              </li>
              <li>
                <strong className="text-foreground">Europe PMC:</strong> Supplemental biomedical literature indexing.
              </li>
              <li>
                <strong className="text-foreground">U.S. National Library of Medicine (NLM):</strong> RxNav API for standardized drug interaction checks.
              </li>
              <li>
                <strong className="text-foreground">U.S. Food and Drug Administration (FDA):</strong> openFDA API for official drug labeling and boxed warnings.
              </li>
              <li>
                <strong className="text-foreground">World Health Organization (WHO):</strong> Clinical practice guideline indices.
              </li>
              <li>
                <strong className="text-foreground">Google Generative AI (AI Studio):</strong> Server-side processing for synthesis and safety guardrail auditing under enterprise API terms with zero model training on customer data.
              </li>
            </ul>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader className="pb-3">
            <SectionTitle icon={UserCheck} title="5. Data Retention, Portability, and Deletion" />
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              You maintain complete ownership and control over your clinical workspace data.
            </p>
            <p>
              To permanently remove all patient records, consultations, timelines, and reports from the cloud database, navigate to the <Link to="/settings" className="text-primary underline font-medium">Settings</Link> page and use the "Wipe all data" utility. This initiates an immediate batch deletion across all sub-collections.
            </p>
          </CardContent>
        </GlassCard>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/80 bg-card/60 p-4 text-xs text-muted-foreground">
          <p>
            Questions or security reports regarding data privacy may be directed to your local system administrator.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="text-primary hover:underline font-medium">
              Terms and Conditions
            </Link>
            <Link to="/settings" className="text-primary hover:underline font-medium">
              Data Settings
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
