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
        "relative overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-[1px] hover:shadow-md",
        className,
      )}
    >
      {children}
    </Card>
  );
}

/**
 * Section heading: a mono, letter-spaced label sitting on a hairline rule —
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
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border border-primary/25 bg-primary/10">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-foreground/90">
            {title}
          </h2>
          {hint && <p className="mt-0.5 truncate text-sm text-muted-foreground">{hint}</p>}
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
  High: "border-success/40 bg-success/10 text-success",
  Medium: "border-warning/40 bg-warning/10 text-warning",
  Low: "border-destructive/40 bg-destructive/10 text-destructive",
  "Insufficient evidence": "border-muted-foreground/40 bg-muted/40 text-muted-foreground",
};

export function ConfidenceBadge({ band }: { band: ConfidenceBand }) {
  const insufficient = band === "Insufficient evidence";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded border px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-[0.14em]",
        BAND_STYLES[band],
      )}
      title={
        insufficient
          ? "Too few sources were retrieved to rate this answer."
          : "Confidence band derived from retrieval, agreement and safety signals."
      }
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {insufficient ? "Evidence insufficient" : `Confidence ${band}`}
    </span>
  );
}

/** Marks whether a claim resolves to a retrieved source. */
export function GroundingBadge({ grounded }: { grounded?: boolean | undefined }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.12em]",
        grounded
          ? "border-evidence/40 bg-evidence/10 text-evidence"
          : "border-warning/40 bg-warning/10 text-warning",
      )}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
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
    done: <CheckCircle2 className="h-3.5 w-3.5 text-success" />,
    skipped: <MinusCircle className="h-3.5 w-3.5 text-muted-foreground/70" />,
    error: <AlertTriangle className="h-3.5 w-3.5 text-destructive" />,
  };
  return (
    <div
      className={cn(
        "group relative flex items-start gap-2.5 border-l-2 py-2 pl-3 pr-2 text-xs transition-colors",
        status === "running"
          ? "border-l-primary bg-primary/[0.07]"
          : status === "done"
            ? "border-l-success/60"
            : status === "error"
              ? "border-l-destructive/70 bg-destructive/[0.06]"
              : "border-l-border",
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
        <span className="mt-0.5 block truncate text-muted-foreground">
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
      className="group block border-l-2 border-l-border py-2.5 pl-3 pr-2 transition-colors hover:border-l-primary hover:bg-primary/[0.05]"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-evidence">
          {source.source}
        </span>
        {source.year && (
          <span className="font-mono text-xs text-muted-foreground">{source.year}</span>
        )}
        {source.level && (
          <span
            className="rounded-sm border border-border/70 px-1.5 py-px font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground"
            title={`Evidence tier ${source.level.rank}`}
          >
            T{source.level.rank} · {source.level.label}
          </span>
        )}
        <span className="ml-auto font-mono text-[0.65rem] text-muted-foreground/70">
          {source.id}
        </span>
        <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground" />
      </div>
      <p className="mt-1 text-sm leading-snug">{source.title}</p>
      {source.snippet && (
        <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {source.snippet}
        </p>
      )}
      {source.authors && (
        <p className="mt-1.5 font-mono text-xs text-muted-foreground/80">{source.authors}</p>
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
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 px-6 py-14 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border/70 bg-muted/40">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </span>
      <p className="font-mono text-xs uppercase tracking-[0.16em]">{title}</p>
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
