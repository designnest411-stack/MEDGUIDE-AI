import { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Bot,
  Brain,
  CheckCircle2,
  Cpu,
  FileText,
  GitBranch,
  Image as ImageIcon,
  Library,
  Microscope,
  Pill,
  ScanEye,
  ShieldAlert,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AGENTS, type AgentId, type AgentMeta, type AgentStatus } from "@/lib/agents/types";

interface CircularAgentFlowProps {
  onSelectAgent: (meta: AgentMeta) => void;
  getAgentSummary: (id: AgentId) => { status: AgentStatus; summary: string };
  isRunning: boolean;
  selectedCaseQuestion?: string | undefined;
}

const AGENT_ORDER: AgentId[] = [
  "planner",
  "retrieval",
  "knowledge-graph",
  "clinical-reasoning",
  "drug-intelligence",
  "medical-image",
  "case-similarity",
  "safety",
  "explainability",
  "confidence",
  "report",
];

const AGENT_ICONS: Record<AgentId, React.ComponentType<{ className?: string }>> = {
  planner: Target,
  retrieval: Library,
  "knowledge-graph": GitBranch,
  "clinical-reasoning": Brain,
  "drug-intelligence": Pill,
  "medical-image": ImageIcon,
  "case-similarity": Microscope,
  safety: ShieldAlert,
  explainability: ScanEye,
  confidence: CheckCircle2,
  research: Cpu,
  report: FileText,
};

const PHASE_COLORS: Record<string, { ring: string; fill: string; border: string; glow: string; text: string }> = {
  intake: {
    ring: "#10b981", // Emerald Mint
    fill: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.4)",
    glow: "rgba(16, 185, 129, 0.35)",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  reasoning: {
    ring: "#8b5cf6", // Neural Violet
    fill: "rgba(139, 92, 246, 0.12)",
    border: "rgba(139, 92, 246, 0.4)",
    glow: "rgba(139, 92, 246, 0.35)",
    text: "text-violet-600 dark:text-violet-400",
  },
  verification: {
    ring: "#f59e0b", // Warm Amber
    fill: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.4)",
    glow: "rgba(245, 158, 11, 0.35)",
    text: "text-amber-600 dark:text-amber-400",
  },
};

function getPhase(id: AgentId): "intake" | "reasoning" | "verification" {
  if (["planner", "retrieval", "knowledge-graph"].includes(id)) return "intake";
  if (["clinical-reasoning", "drug-intelligence", "medical-image"].includes(id)) return "reasoning";
  return "verification";
}

export function CircularAgentFlow({
  onSelectAgent,
  getAgentSummary,
  isRunning,
  selectedCaseQuestion,
}: CircularAgentFlowProps) {
  const [hoveredAgentId, setHoveredAgentId] = useState<AgentId | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);

  // When a consultation pipeline is running, advance active node pulse
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % AGENT_ORDER.length);
    }, 1100);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Center hovered or currently active agent
  const currentAgentId = hoveredAgentId || (isRunning ? AGENT_ORDER[activeStep]! : null);
  const currentMeta = useMemo(() => {
    return AGENTS.find((a) => a.id === currentAgentId) || null;
  }, [currentAgentId]);

  const currentSummary = useMemo(() => {
    return currentAgentId ? getAgentSummary(currentAgentId) : null;
  }, [currentAgentId, getAgentSummary]);

  // SVG dimensions & node trigonometry
  const size = 640;
  const center = size / 2;
  const radius = 225;

  const nodePositions = useMemo(() => {
    return AGENT_ORDER.map((id, index) => {
      // 11 items around circle, starting at top (-pi/2)
      const angle = (2 * Math.PI * index) / AGENT_ORDER.length - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return { id, index, x, y, angle };
    });
  }, [center, radius]);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-emerald-500/20 bg-card/60 p-4 sm:p-6 backdrop-blur-xl shadow-lg shadow-emerald-500/5">
      {/* Top Banner Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="font-display text-base font-bold text-foreground">
              Consensus Orbit Architecture
            </h3>
            <Badge
              variant="outline"
              className="text-[0.62rem] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
            >
              11 Synchronized Agents
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Continuous evidence-grounded consensus loop: Hover or click any station to inspect telemetry
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Phase Legend Pills */}
          <div className="flex items-center gap-1.5 text-[0.65rem] font-mono">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Intake
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-2 py-0.5 text-violet-600 dark:text-violet-400 border border-violet-500/25">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> Reasoning
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-600 dark:text-amber-400 border border-amber-500/25">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Verification
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Circular Canvas Container */}
      <div className="relative mx-auto mt-4 w-full max-w-[580px] aspect-square flex items-center justify-center select-none">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full drop-shadow-sm"
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* Emerald Core Glow Filter */}
            <filter id="emerald-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Violet Reasoning Glow Filter */}
            <filter id="violet-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Flow Path Gradient */}
            <linearGradient id="orbital-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="45%" stopColor="#8b5cf6" stopOpacity="0.8" />
              <stop offset="85%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
            </linearGradient>

            {/* Radial Core Gradient */}
            <radialGradient id="core-radial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.22)" />
              <stop offset="65%" stopColor="rgba(139, 92, 246, 0.08)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* 1. Concentric Gyroscope / Radar Tracks */}
          <circle
            cx={center}
            cy={center}
            r={radius + 34}
            fill="none"
            stroke="currentColor"
            className="text-border/40"
            strokeWidth="1"
            strokeDasharray="4 8"
          />

          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="url(#orbital-gradient)"
            strokeWidth="2.5"
            strokeOpacity="0.45"
          />

          <circle
            cx={center}
            cy={center}
            r={radius - 50}
            fill="none"
            stroke="currentColor"
            className="text-border/30"
            strokeWidth="1"
            strokeDasharray="3 6"
          />

          {/* Animated Orbital Energy Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="url(#orbital-gradient)"
            strokeWidth="3.5"
            strokeDasharray="18 120"
            className="animate-spin"
            style={{
              animationDuration: "14s",
              transformOrigin: "center",
            }}
          />

          {/* 2. Synapse Radial Beams connecting Core to each Node */}
          {nodePositions.map((pos) => {
            const isHovered = currentAgentId === pos.id;
            const phase = getPhase(pos.id);
            const color = PHASE_COLORS[phase]!;

            return (
              <g key={`ray-${pos.id}`}>
                <line
                  x1={center}
                  y1={center}
                  x2={pos.x}
                  y2={pos.y}
                  stroke={isHovered ? color.ring : "currentColor"}
                  strokeWidth={isHovered ? 2 : 1}
                  strokeOpacity={isHovered ? 0.9 : 0.15}
                  strokeDasharray={isHovered ? "none" : "2 5"}
                  className="transition-all duration-300"
                />

                {/* Traveling photon dot when active */}
                {isHovered && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={6}
                    fill={color.ring}
                    filter="url(#emerald-glow)"
                    className="animate-ping"
                  />
                )}
              </g>
            );
          })}

          {/* 3. Central Consensus Core Hub */}
          <g className="cursor-default">
            {/* Core Backdrop Radial Aura */}
            <circle cx={center} cy={center} r={95} fill="url(#core-radial)" />

            <circle
              cx={center}
              cy={center}
              r={72}
              className="fill-card/90 stroke-emerald-500/30 transition-all duration-300 hover:stroke-emerald-500/70"
              strokeWidth="2"
              filter="url(#emerald-glow)"
            />

            {/* Inner Rotating Dashed Orbit */}
            <circle
              cx={center}
              cy={center}
              r={62}
              fill="none"
              stroke="currentColor"
              className="text-emerald-500/30 animate-spin"
              strokeWidth="1.5"
              strokeDasharray="5 7"
              style={{
                animationDuration: "28s",
                animationDirection: "reverse",
                transformOrigin: "center",
              }}
            />

            {/* Core Text & State Content */}
            <foreignObject
              x={center - 64}
              y={center - 64}
              width={128}
              height={128}
              className="pointer-events-none"
            >
              <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center select-none">
                {currentMeta ? (
                  <>
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-500 mb-1">
                      {(() => {
                        const Icon = AGENT_ICONS[currentMeta.id] || Brain;
                        return <Icon className="h-3.5 w-3.5" />;
                      })()}
                    </div>
                    <p className="font-display text-[0.68rem] font-bold text-foreground line-clamp-1 leading-tight">
                      {currentMeta.name}
                    </p>
                    <span className="font-mono text-[0.55rem] uppercase text-emerald-600 dark:text-emerald-400 mt-0.5">
                      #{String(AGENT_ORDER.indexOf(currentMeta.id) + 1).padStart(2, "0")} · Active
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 mb-1 shadow-sm shadow-emerald-500/20">
                      <Activity className="h-4 w-4 animate-pulse" />
                    </div>
                    <p className="font-display text-[0.72rem] font-bold text-foreground leading-tight">
                      CONSENSUS CORE
                    </p>
                    <span className="font-mono text-[0.58rem] text-emerald-600 dark:text-emerald-400 font-medium">
                      11 / 11 Active
                    </span>
                  </>
                )}
              </div>
            </foreignObject>
          </g>

          {/* 4. The 11 Autonomous Agent Station Nodes */}
          {nodePositions.map((pos) => {
            const meta = AGENTS.find((a) => a.id === pos.id)!;
            const phase = getPhase(pos.id);
            const color = PHASE_COLORS[phase]!;
            const isHovered = currentAgentId === pos.id;
            const Icon = AGENT_ICONS[pos.id] || Brain;
            const summary = getAgentSummary(pos.id);
            const isDone = summary.status === "done";
            const isRunningNode = summary.status === "running" || (isRunning && AGENT_ORDER[activeStep] === pos.id);

            return (
              <g
                key={pos.id}
                className="cursor-pointer transition-transform duration-200"
                style={{
                  transformOrigin: `${pos.x}px ${pos.y}px`,
                  transform: isHovered ? "scale(1.15)" : "scale(1)",
                }}
                onMouseEnter={() => setHoveredAgentId(pos.id)}
                onMouseLeave={() => setHoveredAgentId(null)}
                onClick={() => onSelectAgent(meta)}
              >
                {/* Active Pulsing Ring */}
                {isRunningNode && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={28}
                    fill="none"
                    stroke={color.ring}
                    strokeWidth="2"
                    className="animate-ping"
                    strokeOpacity="0.4"
                  />
                )}

                {/* Node Outer Circle Backdrop */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={22}
                  className={`transition-colors duration-200 ${
                    isHovered
                      ? "fill-card stroke-2"
                      : isRunningNode
                      ? "fill-card stroke-2"
                      : "fill-card/95 stroke-1"
                  }`}
                  style={{
                    stroke: isHovered || isRunningNode ? color.ring : "var(--glass-border)",
                    filter: isHovered ? "url(#emerald-glow)" : "none",
                  }}
                />

                {/* Node Phase Ring Accent */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={18}
                  fill={isHovered ? color.fill : "transparent"}
                  stroke={color.ring}
                  strokeWidth="1.2"
                  strokeOpacity={isHovered ? 1 : 0.4}
                />

                {/* Node Icon */}
                <foreignObject
                  x={pos.x - 12}
                  y={pos.y - 12}
                  width={24}
                  height={24}
                  className="pointer-events-none"
                >
                  <div
                    className={`flex h-full w-full items-center justify-center transition-colors ${
                      isHovered ? color.text : "text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </foreignObject>

                {/* Agent Number Badge Pill */}
                <rect
                  x={pos.x - 11}
                  y={pos.y + 13}
                  width={22}
                  height={11}
                  rx={4}
                  className="fill-background/95 stroke-border"
                  strokeWidth="0.8"
                />
                <text
                  x={pos.x}
                  y={pos.y + 21}
                  textAnchor="middle"
                  className="fill-muted-foreground font-mono text-[7px] font-bold select-none"
                >
                  #{String(pos.index + 1).padStart(2, "0")}
                </text>

                {/* Agent Short Label */}
                <text
                  x={pos.x}
                  y={pos.y + (pos.y > center ? 36 : -26)}
                  textAnchor="middle"
                  className={`font-display text-[9.5px] font-bold select-none transition-colors ${
                    isHovered ? color.text : "fill-foreground"
                  }`}
                >
                  {meta.name.replace(/ Agent$/i, "")}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Dynamic Telemetry Snapshot Box underneath circle */}
      <div className="mt-4 rounded-2xl border border-border/70 bg-card/70 p-3.5 sm:p-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                Live Focus Payload:
              </span>
              <span className="font-display text-xs font-bold text-foreground">
                {currentMeta ? currentMeta.name : "Continuous Consensus Engine"}
              </span>
              {currentMeta && (
                <Badge
                  variant="outline"
                  className="text-[0.6rem] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                >
                  {getPhase(currentMeta.id).toUpperCase()}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {currentSummary?.summary ||
                "All 11 autonomous agents are synchronized in a continuous multi-agent consensus RAG loop. Click any agent station to inspect its biomedical engine and full runtime payload."}
            </p>
          </div>

          {currentMeta && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSelectAgent(currentMeta)}
              className="text-xs shrink-0 h-8 gap-1 border-emerald-500/30 hover:border-emerald-500/60"
            >
              Inspect Agent #{String(AGENT_ORDER.indexOf(currentMeta.id) + 1).padStart(2, "0")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

