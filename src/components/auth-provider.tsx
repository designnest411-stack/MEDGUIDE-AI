import React from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import {
  Brain,
  Loader2,
  Library,
  GitBranch,
  ShieldCheck,
  ScanEye,
} from "lucide-react";

import { auth, loginWithGoogle, getRedirectResult } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });

  React.useEffect(() => {
    setMounted(true);

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
        if (currentUser) {
          setIsLoggingIn(false);
          setAuthError(null);
        }
      },
      (err) => {
        setAuthError(err.message);
        setLoading(false);
        setIsLoggingIn(false);
      },
    );

    getRedirectResult(auth)
      .then((cred) => {
        if (cred?.user) {
          setUser(cred.user);
          setIsLoggingIn(false);
          setAuthError(null);
          if (location.pathname === "/") {
            void navigate({ to: "/dashboard" });
          }
        }
      })
      .catch((err: unknown) => {
        const e = err as { code?: string; message?: string };
        if (e?.code === "auth/unauthorized-domain") {
          setAuthError(
            `Domain "${window.location.hostname}" is not authorized in Firebase Console. Please add "${window.location.hostname}" under Firebase Auth > Settings > Authorized domains.`,
          );
        } else if (e?.code && e.code !== "auth/popup-closed-by-user") {
          setAuthError(e.message ?? "Authentication failed.");
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => unsubscribe();
  }, [location.pathname, navigate]);

  const handleLogin = () => {
    setIsLoggingIn(true);
    setAuthError(null);

    loginWithGoogle()
      .then((res) => {
        if (res?.user) {
          setUser(res.user);
          if (location.pathname === "/") {
            void navigate({ to: "/dashboard" });
          }
        }
        setIsLoggingIn(false);
      })

      .catch((err: unknown) => {
        const e = err as { code?: string; message?: string };
        if (e?.code === "auth/popup-blocked") {
          setAuthError(
            "Your browser or ad-blocker blocked the popup window. Please allow popups or disable ad-blockers for this site.",
          );
        } else if (e?.code === "auth/unauthorized-domain") {
          setAuthError(
            `Domain "${window.location.hostname}" is not authorized in Firebase Console. Please add "${window.location.hostname}" under Firebase Auth > Settings > Authorized domains.`,
          );
        } else if (e?.code === "auth/popup-closed-by-user") {
          // Closed by user
        } else if (e?.message) {
          setAuthError(e.message);
        }
        setIsLoggingIn(false);
      });
  };

  if (!mounted || loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen w-full flex-col lg:flex-row antialiased">
        {/* Left Panel: Branding & Capabilities */}
        <div className="relative flex flex-1 flex-col justify-center bg-transparent px-8 py-12 lg:flex-[1.3] lg:px-20 overflow-hidden">
          {/* Subtle Clinical Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-3xl bg-primary/5 blur-[100px]" />
            <div className="absolute -bottom-[10%] right-[10%] w-[50%] h-[50%] rounded-3xl bg-cyan-500/5 blur-[100px]" />
            <div className="absolute inset-0 grid-noise [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-xl">
            <div className="mb-10 flex items-center gap-3.5 group cursor-default">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shadow-sm overflow-hidden">
                <Brain className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                  MEDGUIDE AI
                </h1>
                <p className="font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase">
                  Clinical Insight Engine
                </p>
              </div>
            </div>

            <h2 className="font-display text-4xl font-semibold tracking-tight text-foreground lg:text-5xl lg:leading-[1.15]">
              Evidence-backed clinical intelligence.
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Clinical decision support powered by retrieval, medical knowledge graphs, and
              explainable AI.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Evidence Retrieval */}
              <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-600 text-white shadow-sm">
                    <Library className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-mono text-[0.62rem] uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-semibold">
                      PubMed & WHO
                    </span>
                    <p className="font-display text-sm font-bold tracking-tight text-foreground">
                      Evidence Retrieval
                    </p>
                  </div>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                  Live evidence fetched from PubMed peer-reviewed research and global clinical
                  guidelines.
                </p>
              </div>

              {/* Knowledge Graph */}
              <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                    <GitBranch className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-mono text-[0.62rem] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold">
                      Ontology Graph
                    </span>
                    <p className="font-display text-sm font-bold tracking-tight text-foreground">
                      Knowledge Graph
                    </p>
                  </div>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                  Traverses verified relationships between diseases, symptoms, risk factors, and
                  medications.
                </p>
              </div>

              {/* Safety Audit */}
              <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-mono text-[0.62rem] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
                      Safety Guardrail
                    </span>
                    <p className="font-display text-sm font-bold tracking-tight text-foreground">
                      Safety Audit
                    </p>
                  </div>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                  Flags contraindications, drug interactions, red flags, and verifies reasoning
                  boundaries.
                </p>
              </div>

              {/* Explainable Insights */}
              <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white shadow-sm">
                    <ScanEye className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-mono text-[0.62rem] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
                      Transparent AI
                    </span>
                    <p className="font-display text-sm font-bold tracking-tight text-foreground">
                      Explainable Insights
                    </p>
                  </div>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                  Provides qualitative confidence bands and full reasoning paths with attached
                  citations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Auth Card */}
        <div className="z-20 flex flex-1 flex-col items-center justify-center border-l border-border/70 bg-card/90 p-8 shadow-sm backdrop-blur-xl lg:p-12">
          <div className="w-full max-w-[420px] animate-in fade-in duration-200 ease-out">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Sign in to your clinical workspace.
            </p>

            <div className="mt-10 rounded-xl border border-border/70 bg-card/90 p-8 shadow-lg backdrop-blur-md">
              <Button
                className="h-12 w-full border border-border/80 bg-secondary/80 text-base font-medium text-foreground shadow-sm transition-colors hover:border-primary/50 hover:bg-primary/10 rounded-md"
                variant="outline"
                disabled={isLoggingIn}
                onClick={handleLogin}
              >
                {isLoggingIn ? (
                  <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
                ) : (
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                )}
                {isLoggingIn ? "Connecting to Google..." : "Continue with Google"}
              </Button>

              {authError && (
                <div className="mt-4 rounded-lg bg-destructive/10 p-3.5 border border-destructive/30 text-left">
                  <p className="text-xs leading-relaxed font-medium text-destructive">
                    {authError}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
                Terms and Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
