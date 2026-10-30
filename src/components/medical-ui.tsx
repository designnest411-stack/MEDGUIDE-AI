import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  Loader2,
  MinusCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AGENT_MAP,
  type AgentId,
  type AgentStatus,
  type ConfidenceBand,
  type EvidenceSource,
} from "@/lib/agents/types";

export function GlassCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/80 dark:border-white/[0.12] bg-card/90 dark:bg-card/85 shadow-sm shadow-slate-950/4 dark:shadow-black/50 backdrop-blur-xl transition-all duration-200 ease-out hover:-translate-y-[1.5px] hover:shadow-md hover:shadow-slate-950/8 dark:hover:shadow-cyan-950/35 hover:border-primary/40 dark:hover:border-white/[0.22] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/60 dark:before:via-white/20 before:to-transparent",
        className,
      )}
    >
      {children}
    </Card>
  );
}

/**
 * Section heading: a mono, letter-spaced label sitting on a hairline rule:
 * closer to a lab report header than a generic card title.
 */
export function SectionTitle({
  icon: Icon,
  title,
  hint,
  right,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        {Icon && (
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 shadow-xs">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-foreground/90">
            {title}
          </h2>
          {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

/** Thin ruled divider with an optional mono caption, used between report blocks. */
export function Rule({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="h-px flex-1 bg-border/70" />
      {label && (
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
      )}
      <span className="h-px flex-1 bg-border/70" />
    </div>
  );
}

const BAND_STYLES: Record<ConfidenceBand, string> = {
  High: "border-emerald-500/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 shadow-xs shadow-emerald-500/10",
  Medium:
    "border-sky-500/35 bg-sky-500/12 text-sky-700 dark:text-sky-300 shadow-xs shadow-sky-500/10",
  Low: "border-amber-500/35 bg-amber-500/12 text-amber-700 dark:text-amber-300 shadow-xs shadow-amber-500/10",
  "Insufficient evidence": "border-muted-foreground/30 bg-muted/60 text-muted-foreground",
};

export function ConfidenceBadge({ band }: { band: ConfidenceBand }) {
  const insufficient = band === "Insufficient evidence";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.68rem] font-medium uppercase tracking-[0.12em] backdrop-blur-xs select-none",
        BAND_STYLES[band],
      )}
      title={
        insufficient
          ? "Too few sources were retrieved to rate this answer."
          : "Confidence band derived from retrieval, agreement and safety signals."
      }
    >
      <span className="relative flex h-1.5 w-1.5">
        {!insufficient && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
        )}
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      {insufficient ? "Evidence insufficient" : `Confidence ${band}`}
    </span>
  );
}

/** Marks whether a claim resolves to a retrieved source. */
export function GroundingBadge({ grounded }: { grounded?: boolean | undefined }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[0.64rem] font-medium uppercase tracking-[0.1em] backdrop-blur-xs select-none",
        grounded
          ? "border-evidence/30 bg-evidence/10 text-evidence"
          : "border-warning/30 bg-warning/10 text-warning",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {grounded ? "Sourced" : "Reasoning only"}
    </span>
  );
}

export function AgentPill({
  agent,
  status,
  summary,
  index,
}: {
  agent: AgentId;
  status: AgentStatus;
  summary?: string;
  index?: number;
}) {
  const meta = AGENT_MAP[agent];
  const icons: Record<AgentStatus, ReactNode> = {
    idle: <CircleDashed className="h-3.5 w-3.5 text-muted-foreground" />,
    running: <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />,
    done: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />,
    skipped: <MinusCircle className="h-3.5 w-3.5 text-muted-foreground/70" />,
    error: <AlertTriangle className="h-3.5 w-3.5 text-destructive" />,
  };
  return (
    <div
      className={cn(
        "group relative flex items-start gap-2.5 rounded-xl border p-2.5 text-xs transition-all duration-200 ease-out hover:-translate-y-[1px]",
        status === "running"
          ? "border-primary/50 bg-primary/[0.10] shadow-sm shadow-primary/10"
          : status === "done"
            ? "border-emerald-500/35 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.10] dark:border-emerald-500/25"
            : status === "error"
              ? "border-destructive/40 bg-destructive/[0.08]"
              : "border-border/70 dark:border-white/[0.08] bg-card/60 hover:bg-card hover:border-primary/30",
      )}
    >
      <span className="mt-0.5 shrink-0">{icons[status]}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          {typeof index === "number" && (
            <span className="font-mono text-[0.65rem] text-muted-foreground/70">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
          <span
            className={cn("truncate font-medium", status === "skipped" && "text-muted-foreground")}
          >
            {meta?.name ?? agent}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-[0.72rem] text-muted-foreground">
          {summary ?? meta?.description}
        </span>
      </span>
    </div>
  );
}

export function EvidenceItem({ source }: { source: EvidenceSource }) {
  return (
    <a
      href={source.url ?? "#"}
      target="_blank"
      rel="noreferrer"
      className="group block rounded-xl border border-border/70 dark:border-white/[0.07] bg-card/50 p-3.5 shadow-xs backdrop-blur-xs transition-all duration-200 hover:-translate-y-[1px] hover:border-primary/40 hover:bg-card/90 hover:shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-evidence">
          {source.source}
        </span>
        {source.year && (
          <span className="font-mono text-xs text-muted-foreground">{source.year}</span>
        )}
        {source.level && (
          <span
            className="rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-muted-foreground"
            title={`Evidence tier ${source.level.rank}`}
          >
            T{source.level.rank} · {source.level.label}
          </span>
        )}
        <span className="ml-auto font-mono text-[0.65rem] text-muted-foreground/70">
          {source.id}
        </span>
        <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
      </div>
      <p className="mt-1.5 text-sm font-medium leading-snug group-hover:text-primary transition-colors">
        {source.title}
      </p>
      {source.snippet && (
        <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
          {source.snippet}
        </p>
      )}
      {source.authors && (
        <p className="mt-2 font-mono text-[0.7rem] text-muted-foreground/80">{source.authors}</p>
      )}
    </a>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card/30 px-6 py-14 text-center backdrop-blur-xs">
      <span className="mb-4 flex h-13 w-13 items-center justify-center rounded-2xl border border-border/80 bg-secondary/60 shadow-xs">
        <Icon className="h-6 w-6 text-primary" />
      </span>
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-foreground/90">
        {title}
      </p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Compact label/value pair used across the clinical read-outs. */
export function DataPoint({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-relaxed">{value}</dd>
    </div>
  );
}

export { Badge };
