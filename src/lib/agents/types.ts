export type AgentId =
  | "planner"
  | "retrieval"
  | "knowledge-graph"
  | "clinical-reasoning"
  | "drug-intelligence"
  | "medical-image"
  | "case-similarity"
  | "safety"
  | "explainability"
  | "confidence"
  | "research"
  | "report";

export type AgentStatus = "idle" | "running" | "done" | "skipped" | "error";

export interface AgentMeta {
  id: AgentId;
  name: string;
  short: string;
  description: string;
}

export const AGENTS: AgentMeta[] = [
  {
    id: "planner",
    name: "Planner Agent",
    short: "Planner",
    description: "Chooses which agents run, and what clinical data is still missing.",
  },
  {
    id: "retrieval",
    name: "Retrieval Agent",
    short: "Retrieval",
    description: "Pulls PubMed papers, WHO guidance and FDA safety data.",
  },
  {
    id: "knowledge-graph",
    name: "Knowledge Graph Agent",
    short: "Graph",
    description: "Traverses disease, symptom, drug and treatment relationships.",
  },
  {
    id: "clinical-reasoning",
    name: "Clinical Reasoning Agent",
    short: "Reasoning",
    description: "Builds evidence-backed differentials from the collected context.",
  },
  {
    id: "drug-intelligence",
    name: "Drug Intelligence Agent",
    short: "Drugs",
    description: "Checks interactions, contraindications and FDA warnings.",
  },
  {
    id: "medical-image",
    name: "Medical Image Agent",
    short: "Imaging",
    description: "Analyses chest X-rays with explainable heatmaps.",
  },
  {
    id: "case-similarity",
    name: "Case Similarity Agent",
    short: "Cases",
    description: "Finds clinically similar cases and their outcomes.",
  },
  {
    id: "safety",
    name: "Safety Agent",
    short: "Safety",
    description: "Flags unsupported claims, contradictions and unsafe advice.",
  },
  {
    id: "explainability",
    name: "Explainability Agent",
    short: "Explain",
    description: "Exposes the reasoning path and the evidence behind it.",
  },
  {
    id: "confidence",
    name: "Confidence Agent",
    short: "Confidence",
    description: "Rates the answer High, Medium or Low from measurable signals.",
  },
  {
    id: "research",
    name: "Research Agent",
    short: "Research",
    description: "Benchmarks LLM, RAG, Graph RAG and Agentic Graph RAG.",
  },
  {
    id: "report",
    name: "Report Generator",
    short: "Report",
    description: "Assembles the professional clinical report for export.",
  },
];

export const AGENT_MAP = Object.fromEntries(AGENTS.map((a) => [a.id, a])) as Record<
  AgentId,
  AgentMeta
>;

export interface EvidenceSource {
  id: string;
  title: string;
  source:
    | "PubMed"
    | "Europe PMC"
    | "Trial"
    | "WHO"
    | "openFDA"
    | "RxNorm"
    | "Guideline"
    | "Textbook"
    | "Case";
  url?: string | undefined;
  year?: number | undefined;
  snippet?: string | undefined;
  authors?: string | undefined;
  /** Oxford-style evidence tier: 1 = systematic review / guideline, 5 = expert opinion. */
  level?: { rank: number; label: string } | undefined;
}

export interface GraphNode {
  id: string;
  label: string;
  type:
    | "disease"
    | "symptom"
    | "risk"
    | "lab"
    | "drug"
    | "contraindication"
    | "treatment"
    | "complication";
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string | undefined;
}

export interface Differential {
  condition: string;
  likelihood: "high" | "moderate" | "low";
  supporting: string[];
  against: string[];
  nextSteps: string[];
  citations: string[];
  /** True when at least one citation resolves to a retrieved source. */
  grounded?: boolean | undefined;
}

export interface DrugFinding {
  kind: "interaction" | "contraindication" | "side-effect" | "pregnancy" | "dosage" | "warning";
  severity: "critical" | "major" | "moderate" | "minor" | "info";
  drugs: string[];
  detail: string;
  source?: string | undefined;
}

export interface SafetyFlag {
  type: "unsupported-claim" | "missing-evidence" | "contradiction" | "dangerous-recommendation";
  severity: "critical" | "warning" | "note";
  detail: string;
}

export type ConfidenceBand = "High" | "Medium" | "Low" | "Insufficient evidence";

export interface ConfidenceBreakdown {
  band: ConfidenceBand;
  sourceAgreement: number;
  guidelineAgreement: number;
  retrievalQuality: number;
  graphConsistency: number;
  evidenceCompleteness: number;
  hallucinationRisk: number;
  reasoning: string;
}

export interface ImagingFinding {
  label: string;
  probability: number;
}

export interface ImagingCondition {
  condition: string;
  likelihood: number;
  rationale: string;
}

export interface ImagingResult {
  findings: ImagingFinding[];
  quality: { usable: boolean; note: string };
  heatmap?: number[][] | undefined;
  narrative?: string | undefined;
  modelName: string;
  /** Candidate disease-level interpretations derived from the findings. */
  conditions?: ImagingCondition[] | undefined;
  urgency?: "routine" | "prompt" | "urgent" | undefined;
  nextSteps?: string[] | undefined;
}

export interface SimilarCase {
  id: string;
  title: string;
  age: number;
  sex: "M" | "F";
  presentation: string;
  diagnosis: string;
  treatment: string;
  outcome: string;
  tags: string[];
  score?: number | undefined;
}

export interface AgentTrace {
  agent: AgentId;
  status: AgentStatus;
  startedAt?: number | undefined;
  finishedAt?: number | undefined;
  summary?: string | undefined;
  detail?: string | undefined;
  error?: string | undefined;
}

export interface ConsultationResult {
  question: string;
  plan?: {
    agents: AgentId[];
    missingData: string[];
    followUpQuestions: string[];
    rationale: string;
  };
  evidence: EvidenceSource[];
  graph: { nodes: GraphNode[]; edges: GraphEdge[]; path: string[] };
  reasoning?: {
    summary: string;
    differentials: Differential[];
    redFlags: string[];
    investigations: string[];
  };
  drugs: DrugFinding[];
  imaging?: ImagingResult | undefined;
  cases: SimilarCase[];
  safety: { flags: SafetyFlag[]; verdict: string };
  explain?: {
    why: string;
    supporting: string[];
    contradicting: string[];
    guidelines: string[];
    agentsInvolved: AgentId[];
  };
  confidence?: ConfidenceBreakdown | undefined;
  traces: AgentTrace[];
  provider?: string | undefined;
  reportMarkdown?: string | undefined;
  createdAt: number;
}

export interface ConsultationInput {
  question: string;
  patient?: {
    age?: string;
    sex?: string;
    history?: string;
    medications?: string;
    allergies?: string;
    vitals?: string;
    labs?: string;
  };
  answers?: { question: string; answer: string }[];
  imaging?: ImagingResult | null | undefined;
}

export type StreamEvent =
  | { type: "agent"; trace: AgentTrace }
  | { type: "partial"; key: keyof ConsultationResult; value: unknown }
  | { type: "done"; result: ConsultationResult }
  | { type: "error"; message: string };

export const DISCLAIMER =
  "Clinical decisions should be confirmed by a qualified healthcare professional.";
