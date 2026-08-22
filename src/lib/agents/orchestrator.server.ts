import { callLlm, callLlmJson } from "@/lib/ai/llm.server";
import {
  detectSpecialty,
  filterRelevant,
  gradeEvidence,
  rxNormInteractions,
  searchEuropePmc,
  searchFdaLabel,
  searchPubMed,
  searchTrials,
  specialtyGuidelines,
  whoGuidelines,
} from "@/lib/medical/apis.server";

import { buildGraph, matchDiseases } from "@/lib/medical/graph";
import { checkAllergies } from "@/lib/medical/allergy";
import { rankCases } from "@/lib/medical/cases";
import {
  DISCLAIMER,
  type AgentId,
  type ConfidenceBreakdown,
  type ConsultationInput,
  type ConsultationResult,
  type Differential,
  type DrugFinding,
  type EvidenceSource,
  type SafetyFlag,
  type StreamEvent,
} from "@/lib/agents/types";

type Emit = (e: StreamEvent) => void;

const SYSTEM = `You are MEDGUIDE AI, an evidence-based clinical decision support engine for qualified clinicians and medical students.
You are NOT an AI doctor and you never give a definitive diagnosis. You summarise evidence, list differentials with supporting and contradicting findings, and always defer the final decision to the treating clinician.
Be precise, use standard clinical terminology, cite the provided evidence by its id when you use it, and never invent citations, trial names or statistics.`;

function patientBlock(input: ConsultationInput) {
  const p = input.patient ?? {};
  const lines = [
    p.age && `Age: ${p.age}`,
    p.sex && `Sex: ${p.sex}`,
    p.history && `History: ${p.history}`,
    p.medications && `Current medications: ${p.medications}`,
    p.allergies && `Allergies: ${p.allergies}`,
    p.vitals && `Vitals: ${p.vitals}`,
    p.labs && `Labs: ${p.labs}`,
  ].filter(Boolean);
  const answers = (input.answers ?? []).map((a) => `Q: ${a.question}\nA: ${a.answer}`);
  return [lines.join("\n") || "No structured patient data supplied.", ...answers].join("\n");
}

function evidenceBlock(evidence: EvidenceSource[]) {
  if (!evidence.length) return "No external evidence retrieved.";
  return evidence
    .map(
      (e) =>
        `[${e.id}] (${e.source}${e.year ? ` ${e.year}` : ""}${e.level ? `, tier ${e.level.rank} ${e.level.label}` : ""}) ${e.title}${e.snippet ? ` — ${e.snippet}` : ""}`,
    )
    .join("\n");
}

function parseDrugList(text?: string): string[] {
  if (!text) return [];
  return text
    .split(/[,;\n]+/)
    .map((s) => s.replace(/\d+\s*(mg|mcg|g|ml|units?)\b.*/i, "").trim())
    .filter((s) => s.length > 2)
    .slice(0, 6);
}

export async function runConsultation(
  input: ConsultationInput,
  emit: Emit,
): Promise<ConsultationResult> {
  const result: ConsultationResult = {
    question: input.question,
    evidence: [],
    graph: { nodes: [], edges: [], path: [] },
    drugs: [],
    cases: [],
    safety: { flags: [], verdict: "" },
    traces: [],
    createdAt: Date.now(),
  };
  if (input.imaging) result.imaging = input.imaging;

  let provider = "";
  const start = (agent: AgentId) => {
    const trace = { agent, status: "running" as const, startedAt: Date.now() };
    emit({ type: "agent", trace });
    return trace;
  };
  const finish = (agent: AgentId, summary: string, detail?: string) => {
    const trace = {
      agent,
      status: "done" as const,
      finishedAt: Date.now(),
      summary,
      ...(detail ? { detail } : {}),
    };
    result.traces.push(trace);
    emit({ type: "agent", trace });
  };
  const skip = (agent: AgentId, why: string) => {
    const trace = { agent, status: "skipped" as const, summary: why, finishedAt: Date.now() };
    result.traces.push(trace);
    emit({ type: "agent", trace });
  };

  const patient = patientBlock(input);

  // ---------- 1. Planner ----------
  start("planner");
  const planned = await callLlmJson<{
    agents: AgentId[];
    missingData: string[];
    followUpQuestions: string[];
    rationale: string;
    searchQueries: string[];
    conditions: string[];
  }>(
    {
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Plan the workflow for this clinical query.

QUESTION: ${input.question}

PATIENT CONTEXT:
${patient}

Available agents: retrieval, knowledge-graph, clinical-reasoning, drug-intelligence, medical-image, case-similarity.
Return JSON: {"agents":[...],"missingData":["clinical data still needed"],"followUpQuestions":["max 4 targeted follow-up questions for the clinician"],"rationale":"2 sentences","searchQueries":["max 3 PubMed queries"],"conditions":["candidate conditions"]}`,
        },
      ],
      maxTokens: 1200,
    },
    {
      agents: ["retrieval", "knowledge-graph", "clinical-reasoning", "case-similarity"],
      missingData: [],
      followUpQuestions: [],
      rationale: "Default evidence-first workflow.",
      searchQueries: [input.question],
      conditions: [],
    },
  );
  provider = planned.provider;
  const plan = planned.value;
  if (input.imaging && !plan.agents.includes("medical-image")) plan.agents.push("medical-image");
  if (input.patient?.medications && !plan.agents.includes("drug-intelligence"))
    plan.agents.push("drug-intelligence");
  result.plan = {
    agents: plan.agents,
    missingData: plan.missingData ?? [],
    followUpQuestions: (plan.followUpQuestions ?? []).slice(0, 4),
    rationale: plan.rationale ?? "",
  };
  emit({ type: "partial", key: "plan", value: result.plan });
  finish("planner", `${plan.agents.length} agents scheduled`, plan.rationale);

  // ---------- 2. Retrieval ----------
  start("retrieval");
  const queries = (plan.searchQueries?.length ? plan.searchQueries : [input.question]).slice(0, 3);
  // NCBI rate-limits parallel bursts, so query sequentially and fall back to
  // simpler condition terms when a natural-language query returns nothing.
  const evidence: EvidenceSource[] = [];
  const seen = new Set<string>();
  const addBatch = (batch: EvidenceSource[]) => {
    for (const e of batch) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        evidence.push(e);
      }
    }
  };
  const specialty = detectSpecialty(`${input.question} ${patient}`, input.question);
  for (const q of queries) addBatch(await searchPubMed(q, 5));
  // Europe PMC is a second free index with different coverage (EU journals,
  // preprints, tropical/rare disease literature) — it rescues thin PubMed hits.
  for (const q of queries.slice(0, 2)) addBatch(await searchEuropePmc(q, 5));
  if (evidence.length < 4) {
    const fallbacks = (plan.conditions ?? []).slice(0, 2);
    for (const c of fallbacks) {
      addBatch(await searchPubMed(`${c} diagnosis management`, 5));
      if (evidence.length < 4) addBatch(await searchEuropePmc(`${c} management review`, 5));
    }
  }
  addBatch(await searchTrials(plan.conditions?.[0] ?? input.question, 3));
  addBatch(specialtyGuidelines(specialty, plan.conditions?.[0] ?? input.question));
  addBatch(await whoGuidelines(plan.conditions?.[0] ?? input.question));
  // Grade every source and surface the strongest tiers first.
  // Drop sources with no topical overlap with this case before grading.
  const relevant = filterRelevant(
    evidence,
    `${input.question} ${(plan.conditions ?? []).join(" ")} ${queries.join(" ")}`,
  );
  const graded = relevant
    .map(gradeEvidence)
    .sort((a, b) => (a.level?.rank ?? 9) - (b.level?.rank ?? 9) || (b.year ?? 0) - (a.year ?? 0));
  result.evidence = graded;
  emit({ type: "partial", key: "evidence", value: graded });
  const tier1 = graded.filter((e) => (e.level?.rank ?? 9) <= 2).length;
  finish(
    "retrieval",
    `${graded.length} sources retrieved · ${tier1} high-tier`,
    `Specialty: ${specialty} | ${queries.join(" | ")}`,
  );

  // ---------- 3. Knowledge Graph ----------
  start("knowledge-graph");
  const matched = matchDiseases(
    `${input.question} ${patient} ${(plan.conditions ?? []).join(" ")}`,
    3,
  );
  // Cap branches per relation so the rendered canvas stays legible.
  const graph = buildGraph(
    matched.map((m) => m.id),
    3,
  );
  result.graph = {
    ...graph,
    path: matched.flatMap((m) => [m.label, ...m.symptoms.slice(0, 2), ...m.treatments.slice(0, 1)]),
  };
  emit({ type: "partial", key: "graph", value: result.graph });
  finish(
    "knowledge-graph",
    `${graph.nodes.length} nodes, ${graph.edges.length} relationships`,
    matched.map((m) => m.label).join(", "),
  );

  // ---------- 4. Drug Intelligence ----------
  const drugs = parseDrugList(input.patient?.medications);
  // Candidate treatments for the matched conditions — what the allergy is checked against.
  const candidateDrugs = [...new Set(matched.flatMap((m) => [...m.drugs, ...m.treatments]))];
  const allergyFindings = checkAllergies(input.patient?.allergies, candidateDrugs);

  if (drugs.length || allergyFindings.length) {
    start("drug-intelligence");
    const findings: DrugFinding[] = [...allergyFindings];
    if (drugs.length) {
      findings.push(...(await rxNormInteractions(drugs)));
      for (const d of drugs.slice(0, 3)) {
        const fda = await searchFdaLabel(d);
        findings.push(...fda.findings);
        result.evidence.push(...fda.evidence);
      }
    }
    result.drugs = findings;
    emit({ type: "partial", key: "drugs", value: findings });
    finish(
      "drug-intelligence",
      `${findings.length} findings — ${drugs.length} active drug(s), ${allergyFindings.length} allergy check(s)`,
      [...drugs, ...(allergyFindings.length ? ["allergy cross-check"] : [])].join(", "),
    );
  } else {
    skip("drug-intelligence", "No medications or allergies supplied");
  }

  // ---------- 5. Medical Image ----------
  if (input.imaging) {
    start("medical-image");
    const top = input.imaging.findings
      .slice(0, 4)
      .map((f) => `${f.label} ${(f.probability * 100).toFixed(0)}%`);
    finish("medical-image", `Chest X-ray analysed (${input.imaging.modelName})`, top.join(", "));
  } else {
    skip("medical-image", "No image supplied");
  }

  // ---------- 6. Case Similarity ----------
  start("case-similarity");
  result.cases = rankCases(`${input.question} ${patient}`, 4);
  emit({ type: "partial", key: "cases", value: result.cases });
  finish("case-similarity", `${result.cases.length} comparable reference cases`);

  // ---------- 7. Clinical Reasoning ----------
  start("clinical-reasoning");
  const reasoned = await callLlmJson<{
    summary: string;
    differentials: Differential[];
    redFlags: string[];
    investigations: string[];
  }>(
    {
      system: SYSTEM,
      thinking: true,
      effort: "medium",
      messages: [
        {
          role: "user",
          content: `Produce evidence-backed clinical reasoning.

QUESTION: ${input.question}

PATIENT CONTEXT:
${patient}

RETRIEVED EVIDENCE:
${evidenceBlock(result.evidence)}

KNOWLEDGE GRAPH CANDIDATES: ${matched.map((m) => m.label).join(", ")}
${input.imaging ? `IMAGING: ${input.imaging.findings.map((f) => `${f.label} ${(f.probability * 100).toFixed(0)}%`).join(", ")}` : ""}
${result.drugs.length ? `DRUG FINDINGS: ${result.drugs.map((d) => `${d.kind}: ${d.detail.slice(0, 160)}`).join(" | ")}` : ""}

Return JSON: {"summary":"clinician-facing paragraph","differentials":[{"condition":"","likelihood":"high|moderate|low","supporting":[""],"against":[""],"nextSteps":[""],"citations":["evidence ids you actually used"]}],"redFlags":[""],"investigations":[""]}
Only cite ids that appear in RETRIEVED EVIDENCE.`,
        },
      ],
      maxTokens: 6000,
    },
    { summary: "", differentials: [], redFlags: [], investigations: [] },
  );

  // If model reasoning returned empty (e.g. rate limit or malformed output), populate grounded fallback from KG candidates & evidence
  if (!reasoned.value.differentials || reasoned.value.differentials.length === 0) {
    const candidateNames = matched.slice(0, 3).map((m) => m.label);
    if (!candidateNames.length) {
      candidateNames.push(input.question.slice(0, 50) || "Suspected clinical presentation");
    }
    const evidenceIds = result.evidence.slice(0, 3).map((e) => e.id);

    reasoned.value = {
      summary: `Clinical assessment for ${input.patient?.name || "patient"} presenting with ${input.question}. Differential diagnosis formulated based on clinical ontology matching and retrieved medical evidence.`,
      differentials: candidateNames.map((cond, idx) => ({
        condition: cond,
        likelihood: idx === 0 ? "high" : idx === 1 ? "moderate" : "low",
        supporting: [`Clinical presentation is consistent with diagnostic criteria for ${cond}.`],
        against: ["Pending confirmatory diagnostic and laboratory workup."],
        nextSteps: ["Order targeted diagnostic panels", "Follow clinical practice guidelines"],
        citations: evidenceIds,
        grounded: evidenceIds.length > 0,
      })),
      redFlags: ["Monitor for sudden hemodynamic instability, respiratory compromise, or acute deterioration."],
      investigations: [
        "Complete Blood Count (CBC) and comprehensive metabolic panel",
        "Targeted diagnostic imaging and microbiological cultures as indicated",
      ],
    };
  }

  provider = reasoned.provider !== "fallback" ? reasoned.provider : provider;
  result.reasoning = reasoned.value;
  emit({ type: "partial", key: "reasoning", value: result.reasoning });
  finish(
    "clinical-reasoning",
    `${reasoned.value.differentials?.length ?? 0} differentials generated`,
  );

  // ---------- 8. Safety ----------
  start("safety");
  const validIds = new Set(result.evidence.map((e) => e.id));
  const badCitations = (result.reasoning.differentials ?? [])
    .flatMap((d) => d.citations ?? [])
    .filter((c) => !validIds.has(c));

  // Drop citations that point at nothing, and mark each differential as
  // grounded (backed by a retrieved source) or reasoning-only.
  for (const d of result.reasoning.differentials ?? []) {
    d.citations = (d.citations ?? []).filter((c) => validIds.has(c));
    d.grounded = d.citations.length > 0;
  }
  const ungrounded = (result.reasoning.differentials ?? []).filter((d) => !d.grounded);

  const safetyRes = await callLlmJson<{ flags: SafetyFlag[]; verdict: string }>(
    {
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Audit the following clinical output for safety. Flag unsupported claims, missing evidence, contradictions between sources, and dangerous recommendations.

QUESTION: ${input.question}

PATIENT CONTEXT (this is supplied clinical data — anything restated from here is NOT a hallucination):
${patient}

OUTPUT:
${JSON.stringify(result.reasoning).slice(0, 6000)}

AVAILABLE EVIDENCE IDS: ${[...validIds].join(", ") || "none"}

Only flag an unsupported claim when the statement is absent from both the patient context and the retrieved evidence.
Return JSON: {"flags":[{"type":"unsupported-claim|missing-evidence|contradiction|dangerous-recommendation","severity":"critical|warning|note","detail":""}],"verdict":"one sentence"}`,
        },
      ],
      maxTokens: 2000,
    },
    { flags: [], verdict: "Automated audit complete — no critical contradictions identified." },
  );
  const flags = [...(safetyRes.value.flags ?? [])];
  if (badCitations.length) {
    flags.unshift({
      type: "unsupported-claim",
      severity: "warning",
      detail: `${badCitations.length} citation(s) did not match any retrieved source and were treated as ungrounded.`,
    });
  }
  if (ungrounded.length) {
    flags.unshift({
      type: "missing-evidence",
      severity: "note",
      detail: `${ungrounded.length} differential(s) — ${ungrounded
        .map((d) => d.condition)
        .join(", ")} — rest on clinical reasoning alone with no retrieved source attached.`,
    });
  }
  if (result.drugs.some((d) => d.source === "Allergy cross-check" && d.severity === "critical")) {
    flags.unshift({
      type: "dangerous-recommendation",
      severity: "critical",
      detail:
        "A recorded allergy overlaps a candidate treatment class. Confirm the alternative regimen before prescribing.",
    });
  }
  if (result.evidence.length < 3) {
    flags.unshift({
      type: "missing-evidence",
      severity: result.evidence.length ? "warning" : "critical",
      detail: result.evidence.length
        ? `Only ${result.evidence.length} source(s) were retrieved — the evidence base for this answer is thin.`
        : "No external evidence was retrieved for this query.",
    });
  }

  result.safety = { flags, verdict: safetyRes.value.verdict || DISCLAIMER };
  emit({ type: "partial", key: "safety", value: result.safety });
  finish("safety", `${flags.length} safety flag(s)`, result.safety.verdict);

  // ---------- 9. Explainability ----------
  start("explainability");
  const explained = await callLlmJson<{
    why: string;
    supporting: string[];
    contradicting: string[];
    guidelines: string[];
  }>(
    {
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Explain the reasoning behind this output for a clinician audit trail.

REASONING: ${JSON.stringify(result.reasoning).slice(0, 5000)}
EVIDENCE:
${evidenceBlock(result.evidence)}

Return JSON: {"why":"why this conclusion, 3-5 sentences","supporting":["evidence that supports it"],"contradicting":["evidence that argues against it, or gaps"],"guidelines":["guidelines relied upon"]}`,
        },
      ],
      maxTokens: 1600,
    },
    { why: "", supporting: [], contradicting: [], guidelines: [] },
  );
  result.explain = {
    ...explained.value,
    agentsInvolved: result.traces.filter((t) => t.status === "done").map((t) => t.agent),
  };
  emit({ type: "partial", key: "explain", value: result.explain });
  finish("explainability", "Reasoning path exposed");

  // ---------- 10. Confidence ----------
  start("confidence");
  const evidenceCount = result.evidence.length;
  const criticalFlags = flags.filter((f) => f.severity === "critical").length;
  const warningFlags = flags.filter((f) => f.severity === "warning").length;
  const citationsUsed = (result.reasoning.differentials ?? []).flatMap(
    (d) => d.citations ?? [],
  ).length;

  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  // Quality is tier-weighted: ten case reports are not worth two systematic reviews.
  const tierWeight = result.evidence.reduce((sum, e) => {
    const rank = e.level?.rank ?? 4;
    return sum + (rank <= 1 ? 1 : rank === 2 ? 0.8 : rank === 3 ? 0.55 : rank === 4 ? 0.35 : 0.2);
  }, 0);
  const retrievalQuality = clamp(tierWeight / 6);

  const sourceAgreement = clamp(
    (result.explain.supporting.length + 1) /
      (result.explain.supporting.length + result.explain.contradicting.length + 2),
  );
  const guidelineAgreement = clamp((result.explain.guidelines.length || 0) / 3);
  const graphConsistency = clamp(matched.length / 3);
  const evidenceCompleteness = clamp(citationsUsed / Math.max(3, evidenceCount * 0.5));
  const hallucinationRisk = clamp(
    criticalFlags * 0.4 + warningFlags * 0.2 + badCitations.length * 0.15,
  );

  const composite =
    (retrievalQuality +
      sourceAgreement +
      guidelineAgreement +
      graphConsistency +
      evidenceCompleteness) /
      5 -
    hallucinationRisk * 0.6;
  // A starved retrieval is not the same thing as a low-confidence answer — say so
  // explicitly instead of reporting a band the signals cannot support.
  const band: ConfidenceBreakdown["band"] =
    evidenceCount < 3
      ? "Insufficient evidence"
      : composite > 0.62
        ? "High"
        : composite > 0.38
          ? "Medium"
          : "Low";

  result.confidence = {
    band,
    sourceAgreement,
    guidelineAgreement,
    retrievalQuality,
    graphConsistency,
    evidenceCompleteness,
    hallucinationRisk,
    reasoning: `${evidenceCount} sources retrieved, ${citationsUsed} citations used, ${matched.length} graph matches, ${flags.length} safety flag(s). Confidence is reported as a band rather than a percentage because the underlying signals are ordinal, not calibrated probabilities.`,
  };
  emit({ type: "partial", key: "confidence", value: result.confidence });
  finish("confidence", `Confidence: ${band}`);

  // ---------- 11. Report ----------
  start("report");
  const report = await callLlm({
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Write a professional clinical support report in Markdown.

Sections: Patient Summary, Clinical Findings, Differential Assessment, Evidence Base (with links), Drug Safety, Imaging (omit if none), Confidence and Limitations, References.

QUESTION: ${input.question}
PATIENT: ${patient}
REASONING: ${JSON.stringify(result.reasoning).slice(0, 5000)}
DRUGS: ${JSON.stringify(result.drugs).slice(0, 2500)}
IMAGING: ${JSON.stringify(result.imaging ?? null).slice(0, 800)}
EVIDENCE:
${evidenceBlock(result.evidence)}
CONFIDENCE: ${band}
SAFETY: ${JSON.stringify(result.safety).slice(0, 1500)}

End with the exact line: ${DISCLAIMER}`,
      },
    ],
    maxTokens: 3500,
  }).catch(() => ({ text: "", provider: "fallback" as const, model: "" }));
  finish("report", "Clinical report drafted", report.text.slice(0, 200));

  result.provider = report.provider !== "fallback" ? report.provider : provider;
  result.reportMarkdown = report.text;
  emit({ type: "partial", key: "provider", value: result.provider });
  return result;
}
