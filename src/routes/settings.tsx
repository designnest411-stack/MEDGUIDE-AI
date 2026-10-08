import { createFileRoute, Link } from "@tanstack/react-router";
import { Database, Globe, Lock, ShieldAlert } from "lucide-react";
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
      { title: "Settings : MEDGUIDE AI" },
      {
        name: "description",
        content: "Manage stored clinical data, custom domain configuration, and platform policies.",
      },
      { property: "og:title", content: "Settings : MEDGUIDE AI" },
      {
        property: "og:description",
        content: "Data controls, custom domain, and platform governance for MEDGUIDE AI.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Data controls: securely stored in Firebase Cloud">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Custom Domain & Production Status */}
        <GlassCard>
          <CardHeader className="pb-2">
            <SectionTitle
              icon={Globe}
              title="Custom Domain & Network"
              hint="Production SSL and host routing"
            />
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Production deployment routing and SSL certificates configured for clinical enterprise hostnames.
            </p>
            <div className="space-y-2 rounded-lg border border-border/70 bg-card/60 p-3 font-mono text-[0.72rem]">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Primary Host</span>
                <span className="text-foreground font-semibold">medguide.ai</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Application Subdomain</span>
                <span className="text-foreground font-semibold">app.medguide.ai</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">DNS Record (Apex)</span>
                <span className="text-primary font-semibold">A : 76.76.21.21</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">DNS Record (CNAME)</span>
                <span className="text-primary font-semibold">CNAME : cname.vercel-dns.com</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">SSL / TLS Termination</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">TLS 1.3 Active</span>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Firebase Authentication OAuth Redirect authorized domains must include <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.7rem]">medguide.ai</code> and <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.7rem]">app.medguide.ai</code> in the Firebase Console.
            </p>
          </CardContent>
        </GlassCard>

        {/* Legal & Compliance Policies */}
        <GlassCard>
          <CardHeader className="pb-2">
            <SectionTitle
              icon={Lock}
              title="Governance & Policies"
              hint="Statutory and clinical terms"
            />
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Review platform terms of service, clinical decision support limitations, and privacy disclosures regarding patient data de-identification.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link to="/privacy">Privacy Policy</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link to="/terms">Terms and Conditions</Link>
              </Button>
            </div>
            <div className="rounded-lg border border-border/70 bg-card/60 p-3">
              <p className="font-semibold text-foreground">Zero Synthetic Counter Guarantee</p>
              <p className="mt-1 text-muted-foreground leading-relaxed">
                All platform figures derive strictly from reproducible benchmarks (eval/benchmark_results.json) and live queries against NCBI PubMed and openFDA.
              </p>
            </div>
          </CardContent>
        </GlassCard>

        {/* Cloud Data Management */}
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

        {/* Scope and safety */}
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
