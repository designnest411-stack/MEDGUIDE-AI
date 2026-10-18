import { createFileRoute, Link } from "@tanstack/react-router";
import {
  User,
  ShieldCheck,
  Database,
  Lock,
  ShieldAlert,
  Moon,
  Sun,
  Laptop,
  CheckCircle2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { GlassCard, SectionTitle } from "@/components/medical-ui";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { wipeAll } from "@/lib/db";
import { DISCLAIMER } from "@/lib/agents/types";
import { auth, logout } from "@/lib/firebase";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Clinical Workspace Settings : MEDGUIDE AI" },
      {
        name: "description",
        content: "Manage clinician profile, display preferences, clinical safety parameters, and cloud records.",
      },
      { property: "og:title", content: "Clinical Workspace Settings : MEDGUIDE AI" },
      {
        property: "og:description",
        content: "Clinician profile, workspace preferences, and clinical decision support controls.",
      },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <AppShell title="Settings" subtitle="Workspace controls">
      <GlassCard className="p-8 text-center">
        <h2 className="text-lg font-semibold text-destructive">Settings Error</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {(error as Error)?.message || "Failed to load workspace configuration."}
        </p>
        <Button onClick={reset} className="mt-4" size="sm">
          Retry Settings
        </Button>
      </GlassCard>
    </AppShell>
  ),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const user = auth.currentUser;

  return (
    <AppShell
      title="Settings"
      subtitle="Clinician profile, clinical safety defaults, and data management"
    >
      <div className="space-y-4 max-w-5xl mx-auto">
        {/* Clinician Profile & Session Card */}
        <GlassCard>
          <CardHeader className="pb-3">
            <SectionTitle
              icon={User}
              title="Clinician Profile"
              hint="Authenticated clinical session & role"
            />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border/70 bg-card/50 p-4">
              <div className="flex items-center gap-3">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/40"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary ring-1 ring-primary/30">
                    {(user?.displayName?.[0] || user?.email?.[0] || "C").toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {user?.displayName || "Licensed Healthcare Professional"}
                  </h3>
                  <p className="text-xs text-muted-foreground">{user?.email || "clinical-workspace@medguide.ai"}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Active Secure Session
                    </span>
                    <span className="text-[0.65rem] text-muted-foreground">
                      Google OAuth 2.0 Verified
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive self-start sm:self-auto text-xs"
              >
                Sign out
              </Button>
            </div>
          </CardContent>
        </GlassCard>

        {/* Display & Workspace Preferences */}
        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard>
            <CardHeader className="pb-3">
              <SectionTitle
                icon={Moon}
                title="Workspace Appearance"
                hint="Visual theme & reading comfort"
              />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Select your preferred interface styling. The Obsidian Dark theme is optimized for low-light clinical environments and night ward rounds.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-all ${
                    theme === "light"
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border/70 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <Sun className="h-4 w-4" />
                  <span>Clinical Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-all ${
                    theme === "dark"
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border/70 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <Moon className="h-4 w-4" />
                  <span>Obsidian Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-all ${
                    theme === "system"
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border/70 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <Laptop className="h-4 w-4" />
                  <span>System Sync</span>
                </button>
              </div>
            </CardContent>
          </GlassCard>

          {/* Clinical Decision Support Safeguards */}
          <GlassCard>
            <CardHeader className="pb-3">
              <SectionTitle
                icon={ShieldCheck}
                title="Clinical Decision Support"
                hint="Active medical safety guardrails"
              />
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/40 p-2.5">
                <div>
                  <p className="font-semibold text-foreground">Drug Allergy Interceptor</p>
                  <p className="text-[0.7rem] text-muted-foreground">
                    Deterministic cross-reactivity screening (penicillins, sulfas, NSAIDs)
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Enforced
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/40 p-2.5">
                <div>
                  <p className="font-semibold text-foreground">Evidence Grounding</p>
                  <p className="text-[0.7rem] text-muted-foreground">
                    Mandatory PubMed ID and openFDA provenance attribution
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/40 p-2.5">
                <div>
                  <p className="font-semibold text-foreground">Diagnostic Uncertainty</p>
                  <p className="text-[0.7rem] text-muted-foreground">
                    Calibrated confidence scoring with counter-evidence visibility
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Calibrated
                </span>
              </div>
            </CardContent>
          </GlassCard>
        </div>

        {/* Data Storage & HIPAA Governance */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Cloud Records Management */}
          <GlassCard>
            <CardHeader className="pb-3">
              <SectionTitle
                icon={Database}
                title="Clinical Records & Cloud Storage"
                hint="Encrypted synchronization across your devices"
              />
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                Patient records, clinical consultations, imaging studies, and generated reports are encrypted and synchronized securely to your clinician account.
              </p>
              <div className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Storage Security:</span>
                  <span className="font-medium text-foreground">Multi-Tenant Tenant Isolation</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Imaging & Media CDN:</span>
                  <span className="font-medium text-foreground">Cloud Storage CDN</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Data Encryption:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">AES-256 at Rest & TLS 1.3 in Transit</span>
                </div>
              </div>
              <div className="pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                  onClick={async () => {
                    if (
                      confirm(
                        "Are you sure you want to delete ALL clinical records, patients, and saved consultations? This action cannot be undone.",
                      )
                    ) {
                      await wipeAll();
                      toast.success("All clinical records have been cleared from your account.");
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear All Saved Clinical Records
                </Button>
              </div>
            </CardContent>
          </GlassCard>

          {/* Legal, Statutory & Scope Disclaimers */}
          <GlassCard>
            <CardHeader className="pb-3">
              <SectionTitle
                icon={Lock}
                title="Governance & Policies"
                hint="Clinical decision support boundaries"
              />
            </CardHeader>
            <CardContent className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p>
                MEDGUIDE AI operates in strict compliance with clinical decision support (CDS) regulations. De-identification protocols ensure that protected health information (PHI) is processed safely.
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1 text-xs gap-1">
                  <Link to="/privacy">
                    Privacy Policy <ExternalLink className="h-3 w-3 opacity-70" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1 text-xs gap-1">
                  <Link to="/terms">
                    Terms & Conditions <ExternalLink className="h-3 w-3 opacity-70" />
                  </Link>
                </Button>
              </div>
              <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-[0.72rem] text-warning flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{DISCLAIMER}</span>
              </div>
            </CardContent>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
