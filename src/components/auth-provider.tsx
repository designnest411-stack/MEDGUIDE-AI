import React from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import {
  Brain,
  Loader2,
  Plus,
  Activity,
  Hexagon,
  Library,
  GitBranch,
  ShieldCheck,
  ScanEye,
} from "lucide-react";

import { auth, loginWithGoogle, getRedirectResult } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

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
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await loginWithGoogle();
      if (res?.user) {
        setUser(res.user);
      }
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e?.code === "auth/popup-blocked") {
        setAuthError(
          "Your browser blocked the Google popup window. Please click the popup icon in your browser address bar to allow popups.",
        );
      } else if (e?.code === "auth/unauthorized-domain") {
        setAuthError(
          `Domain "${window.location.hostname}" is not authorized in Firebase Console. Please add "${window.location.hostname}" under Firebase Auth > Settings > Authorized domains.`,
        );
      } else if (e?.code === "auth/popup-closed-by-user") {
        // User closed popup
      } else if (e?.message) {
        setAuthError(e.message);
      }
    } finally {
      setIsLoggingIn(false);
    }
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
          {/* Premium Animated Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Slow moving aurora/blobs */}
            <div
              className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/10 mix-blend-screen blur-[120px] animate-pulse"
              style={{ animationDuration: "8s" }}
            />
            <div
              className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-[#A073D9]/10 mix-blend-screen blur-[100px] animate-pulse"
              style={{ animationDuration: "12s", animationDelay: "2s" }}
            />
            <div
              className="absolute -bottom-[20%] left-[20%] w-[80%] h-[80%] rounded-full bg-primary/10 mix-blend-screen blur-[120px] animate-pulse"
              style={{ animationDuration: "10s", animationDelay: "4s" }}
            />

            {/* Floating Medical Symbols */}
            <div className="absolute inset-0 opacity-5">
              <Plus className="absolute top-[15%] left-[20%] w-32 h-32 text-foreground animate-float-slow" />
              <Activity className="absolute bottom-[20%] left-[60%] w-48 h-48 text-foreground animate-float-slower" />
              <Hexagon
                className="absolute top-[40%] right-[15%] w-24 h-24 text-foreground animate-float-slow"
                style={{ animationDelay: "3s" }}
              />
            </div>

            {/* Clinical grid overlay */}
            <div className="absolute inset-0 grid-noise [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-xl">
            <div className="mb-12 flex items-center gap-4 group cursor-default">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-[#A073D9]/20 ring-1 ring-primary/30 shadow-md backdrop-blur-md overflow-hidden">
                <div className="absolute inset-0 bg-primary/10 group-hover:animate-pulse" />
                <Brain className="h-8 w-8 text-primary transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12" />
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-[#A073D9] to-primary bg-clip-text text-transparent animate-text-shimmer">
                MEDGUIDE AI
              </h1>
            </div>

            <h2 className="font-display text-5xl font-semibold tracking-tight text-foreground lg:text-6xl lg:leading-[1.1]">
              Evidence-backed clinical intelligence.
            </h2>
            <p className="mt-8 max-w-lg text-xl leading-relaxed text-muted-foreground">
              Clinical decision support powered by retrieval, medical knowledge graphs, and
              explainable AI.
            </p>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="flex items-start gap-4 group cursor-default">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm border border-border/60 transition-colors group-hover:border-primary/40 group-hover:bg-primary/5">
                  <Library className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
                </div>
                <div className="pt-1">
                  <p className="font-display text-lg font-semibold tracking-tight text-foreground">
                    Evidence Retrieval
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Sources fetched from PubMed & guidelines.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 group cursor-default">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm border border-border/60 transition-colors group-hover:border-[#A073D9]/40 group-hover:bg-[#A073D9]/5">
                  <GitBranch className="h-5 w-5 text-[#A073D9] transition-transform group-hover:scale-110" />
                </div>
                <div className="pt-1">
                  <p className="font-display text-lg font-semibold tracking-tight text-foreground">
                    Knowledge Graph
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Cross-references diseases and drugs.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 group cursor-default">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm border border-border/60 transition-colors group-hover:border-success/40 group-hover:bg-success/5">
                  <ShieldCheck className="h-5 w-5 text-success transition-transform group-hover:scale-110" />
                </div>
                <div className="pt-1">
                  <p className="font-display text-lg font-semibold tracking-tight text-foreground">
                    Safety Audit
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Flags contraindications & red flags.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 group cursor-default">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm border border-border/60 transition-colors group-hover:border-info/40 group-hover:bg-info/5">
                  <ScanEye className="h-5 w-5 text-info transition-transform group-hover:scale-110" />
                </div>
                <div className="pt-1">
                  <p className="font-display text-lg font-semibold tracking-tight text-foreground">
                    Explainable Insights
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Confidence bands & full reasoning paths.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Auth Card */}
        <div className="z-20 flex flex-1 flex-col items-center justify-center border-l border-border/40 bg-card/80 p-8 shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl lg:p-12">
          <div className="w-full max-w-[420px] animate-in fade-in duration-200 ease-out">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Sign in to your clinical workspace.
            </p>

            <div className="mt-10 rounded-2xl border border-border/70 bg-card/90 p-8 shadow-lg backdrop-blur-md">
              <Button
                className="h-12 w-full border border-border/80 bg-secondary/80 text-base font-medium text-foreground shadow-sm transition-all hover:scale-[1.01] hover:border-primary/50 hover:bg-primary/10"
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
                <div className="mt-4 rounded-lg bg-destructive/10 p-3 border border-destructive/30">
                  <p className="text-center text-xs leading-relaxed font-medium text-destructive">
                    {authError}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
