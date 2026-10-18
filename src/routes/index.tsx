import { useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  Brain,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  ArrowRight,
  Library,
  ImageIcon,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

import { auth, loginWithGoogle } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { DISCLAIMER } from "@/lib/agents/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clinical Workspace Login : MEDGUIDE AI" },
      {
        name: "description",
        content:
          "Evidence-based clinical decision support platform for clinicians and medical students: autonomous multi-agent consensus, PubMed grounding, and drug allergy safety.",
      },
      { property: "og:title", content: "Clinical Workspace Login : MEDGUIDE AI" },
      {
        property: "og:description",
        content: "Secure clinical decision support gateway with Google OAuth and multi-tenant patient records.",
      },
    ],
  }),
  component: ClinicalGateway,
});

function ClinicalGateway() {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();

  // If already logged in, automatically navigate to Dashboard
  useEffect(() => {
    if (user && !loading) {
      void navigate({ to: "/dashboard" });
    }
  }, [user, loading, navigate]);

  const handleSignIn = async () => {
    try {
      await loginWithGoogle();
      toast.success("Successfully authenticated. Welcome to your clinical workspace!");
      void navigate({ to: "/dashboard" });
    } catch (err) {
      console.error("Sign-in error:", err);
      toast.error("Google sign-in was interrupted or closed. Please try again.");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-gradient-to-b from-background via-card/50 to-background selection:bg-primary selection:text-primary-foreground">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-br from-primary/15 via-cyan-500/10 to-transparent blur-3xl opacity-70" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-border/40 backdrop-blur-md max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/30 shadow-sm text-primary">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold tracking-tight text-foreground">
              MEDGUIDE AI
            </h1>
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">
              Clinical Decision Support
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild size="sm" className="gap-1.5 text-xs">
              <Link to="/dashboard">
                Open Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSignIn}
              className="gap-2 text-xs font-semibold shadow-sm"
            >
              <GoogleIcon className="h-3.5 w-3.5" />
              Sign In
            </Button>
          )}
        </div>
      </header>

      {/* Main Login & Clinical Hero */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full grid md:grid-cols-12 gap-8 items-center">
          {/* Left Column: Brand & Value Proposition */}
          <div className="md:col-span-7 space-y-5 text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Autonomous Multi-Agent Clinical Engine
            </div>

            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Evidence-based clinical intelligence at the bedside.
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
              MEDGUIDE AI orchestrates 11 specialized clinical agents: structuring patient intake, querying PubMed literature, analyzing chest radiographs, and verifying drug interactions with a zero-tolerance safety net.
            </p>

            {/* Core Trust Pillars */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-border/70 bg-card/60 p-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-primary text-xs font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  Allergy Interceptor
                </div>
                <p className="text-[0.7rem] text-muted-foreground mt-1">
                  Deterministic cross-reactivity screening before any drug recommendation.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-card/60 p-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <Library className="h-4 w-4" />
                  PubMed Provenance
                </div>
                <p className="text-[0.7rem] text-muted-foreground mt-1">
                  Verified NCBI citations & DOI links without hallucinations.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-card/60 p-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 text-xs font-semibold">
                  <ImageIcon className="h-4 w-4" />
                  Chest X-Ray CAM
                </div>
                <p className="text-[0.7rem] text-muted-foreground mt-1">
                  In-browser DenseNet deep learning with explainable saliency heatmaps.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-card/60 p-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  <Lock className="h-4 w-4" />
                  Isolated Records
                </div>
                <p className="text-[0.7rem] text-muted-foreground mt-1">
                  Multi-tenant cloud storage strictly separated per clinician.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Authentication Card */}
          <div className="md:col-span-5">
            <div className="rounded-2xl border border-border/80 bg-card/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-6">
              <div className="space-y-1.5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-3">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  Clinician Sign In
                </h3>
                <p className="text-xs text-muted-foreground">
                  Access your encrypted patient records and consultation engine
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  size="lg"
                  onClick={handleSignIn}
                  className="w-full gap-3 py-6 text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.99] transition-transform"
                >
                  <GoogleIcon className="h-4 w-4 shrink-0" />
                  Continue with Google
                </Button>

                <p className="text-[0.68rem] text-center text-muted-foreground">
                  Secure OAuth 2.0 authentication. No password required.
                </p>
              </div>

              <div className="border-t border-border/60 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-[0.72rem] text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Encrypted multi-tenant patient workspace</span>
                </div>
                <div className="flex items-center gap-2 text-[0.72rem] text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>High-resolution scans via Cloudinary CDN</span>
                </div>
                <div className="flex items-center gap-2 text-[0.72rem] text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Exportable PDF clinical reports with QR codes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer & Clinical Disclaimer */}
      <footer className="relative z-10 border-t border-border/40 py-6 px-4 bg-card/30 backdrop-blur-md">
        <div className="max-w-5xl mx-auto space-y-3 text-center">
          <p className="text-[0.7rem] text-warning bg-warning/10 border border-warning/30 rounded-lg p-2.5 max-w-3xl mx-auto">
            <strong>Clinical Safety Notice:</strong> {DISCLAIMER}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} MEDGUIDE AI</span>
            <span>·</span>
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}
