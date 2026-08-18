/** Free medical data sources. Server-only (avoids browser CORS issues). */

import type { DrugFinding, EvidenceSource } from "@/lib/agents/types";

const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const UA = { "User-Agent": "MedGuideAI/1.0 (clinical decision support)" };

async function safeJson<T>(url: string, fallback: T, attempts = 2): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: UA });
      if (res.ok) return (await res.json()) as T;
      // 429 / 5xx from NCBI etc. — brief backoff then retry
      if (res.status !== 429 && res.status < 500) return fallback;
    } catch {
      /* retry */
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  return fallback;
}

export async function searchPubMed(query: string, limit = 8): Promise<EvidenceSource[]> {
  const term = encodeURIComponent(query);
  const search = await safeJson<{ esearchresult?: { idlist?: string[] } }>(
    `${EUTILS}/esearch.fcgi?db=pubmed&retmode=json&sort=relevance&retmax=${limit}&term=${term}`,
    {},
  );
  const ids = search.esearchresult?.idlist ?? [];
  if (!ids.length) return [];

  const summary = await safeJson<{
    result?: Record<
      string,
      { title?: string; pubdate?: string; authors?: { name: string }[]; source?: string }
    >;
  }>(`${EUTILS}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`, {});

  return ids
    .map((id) => {
      const item = summary.result?.[id];
      if (!item?.title) return null;
      const year = Number((item.pubdate ?? "").slice(0, 4)) || undefined;
      return {
        id: `pmid:${id}`,
        title: item.title.replace(/<\/?[^>]+>/g, ""),
        source: "PubMed" as const,
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        year,
        authors: (item.authors ?? [])
          .slice(0, 3)
          .map((a) => a.name)
          .join(", "),
        snippet: item.source ? `${item.source}${year ? `, ${year}` : ""}` : undefined,
      };
    })
    .filter(Boolean) as EvidenceSource[];
}

export async function searchFdaLabel(drug: string): Promise<{
  evidence: EvidenceSource[];
  findings: DrugFinding[];
}> {
  const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(
    drug,
  )}"+openfda.brand_name:"${encodeURIComponent(drug)}"&limit=1`;
  const data = await safeJson<{
    results?: {
      warnings?: string[];
      contraindications?: string[];
      drug_interactions?: string[];
      adverse_reactions?: string[];
      pregnancy?: string[];
      dosage_and_administration?: string[];
      openfda?: { generic_name?: string[]; brand_name?: string[] };
    }[];
  }>(url, {});

  const r = data.results?.[0];
  if (!r) return { evidence: [], findings: [] };

  const clip = (s?: string[]) => (s?.[0] ?? "").replace(/\s+/g, " ").slice(0, 420);
  const findings: DrugFinding[] = [];
  const push = (kind: DrugFinding["kind"], severity: DrugFinding["severity"], text: string) => {
    if (text)
      findings.push({ kind, severity, drugs: [drug], detail: text, source: "openFDA label" });
  };
  push("warning", "major", clip(r.warnings));
  push("contraindication", "critical", clip(r.contraindications));
  push("interaction", "major", clip(r.drug_interactions));
  push("side-effect", "moderate", clip(r.adverse_reactions));
  push("pregnancy", "major", clip(r.pregnancy));
  push("dosage", "info", clip(r.dosage_and_administration));

  const label = r.openfda?.generic_name?.[0] ?? drug;
  return {
    evidence: [
      {
        id: `fda:${drug}`,
        title: `openFDA drug label — ${label}`,
        source: "openFDA",
        url: `https://labels.fda.gov/?query=${encodeURIComponent(drug)}`,
        snippet: clip(r.warnings) || clip(r.contraindications),
      },
    ],
    findings,
  };
}

export async function rxNormLookup(
  drug: string,
): Promise<{ rxcui?: string | undefined; name?: string | undefined }> {
  const data = await safeJson<{ idGroup?: { rxnormId?: string[]; name?: string } }>(
    `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(drug)}&search=2`,
    {},
  );
  return { rxcui: data.idGroup?.rxnormId?.[0], name: data.idGroup?.name ?? drug };
}

/** RxNav interaction API (ONCHigh source) for a set of drug names. */
export async function rxNormInteractions(drugs: string[]): Promise<DrugFinding[]> {
  const cuis: { name: string; rxcui: string }[] = [];
  for (const d of drugs) {
    const r = await rxNormLookup(d);
    if (r.rxcui) cuis.push({ name: r.name ?? d, rxcui: r.rxcui });
  }
  if (cuis.length < 2) return [];

  const data = await safeJson<{
    fullInteractionTypeGroup?: {
      sourceName?: string;
      fullInteractionType?: {
        interactionPair?: {
          severity?: string;
          description?: string;
          interactionConcept?: { minConceptItem?: { name?: string } }[];
        }[];
      }[];
    }[];
  }>(
    `https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${cuis.map((c) => c.rxcui).join("+")}`,
    {},
  );

  const out: DrugFinding[] = [];
  for (const group of data.fullInteractionTypeGroup ?? []) {
    for (const t of group.fullInteractionType ?? []) {
      for (const p of t.interactionPair ?? []) {
        const names = (p.interactionConcept ?? [])
          .map((c) => c.minConceptItem?.name ?? "")
          .filter(Boolean);
        out.push({
          kind: "interaction",
          severity: /high/i.test(p.severity ?? "") ? "critical" : "major",
          drugs: names.length ? names : drugs,
          detail: p.description ?? "Documented interaction.",
          source: group.sourceName ?? "RxNav",
        });
      }
    }
  }
  return out;
}

export async function whoGuidelines(query: string): Promise<EvidenceSource[]> {
  // WHO does not expose an open full-text search API; link the authoritative
  // guideline search surface so the clinician can verify the primary source.
  return [
    {
      id: `who:${query.slice(0, 40)}`,
      title: `WHO guidelines search — ${query}`,
      source: "WHO",
      url: `https://www.who.int/publications/who-guidelines?q=${encodeURIComponent(query)}`,
      snippet: "Authoritative WHO guideline collection for this clinical topic.",
    },
  ];
}

/* ------------------------------------------------------------------ *
 * Evidence grading — Oxford-style tiers inferred from title/metadata.
 * Purely local heuristics, no paid service involved.
 * ------------------------------------------------------------------ */

export function gradeEvidence(source: EvidenceSource): EvidenceSource {
  const t = `${source.title} ${source.snippet ?? ""}`.toLowerCase();
  let level = { rank: 4, label: "Observational / narrative" };
  if (
    source.source === "WHO" ||
    source.source === "Guideline" ||
    /guideline|consensus statement|recommendation/.test(t)
  )
    level = { rank: 1, label: "Guideline" };
  else if (/systematic review|meta-analysis|cochrane/.test(t))
    level = { rank: 1, label: "Systematic review" };
  else if (/randomi[sz]ed|randomised controlled|rct\b|double-blind|placebo-controlled/.test(t))
    level = { rank: 2, label: "Randomised trial" };
  else if (source.source === "Trial") level = { rank: 2, label: "Registered trial" };
  else if (/cohort|prospective|case-control|registry/.test(t))
    level = { rank: 3, label: "Cohort / case-control" };
  else if (/case report|case series/.test(t)) level = { rank: 5, label: "Case report" };
  else if (source.source === "openFDA") level = { rank: 1, label: "Regulatory label" };
  return { ...source, level };
}

/** Europe PMC — free, no key, wider coverage than PubMed alone (incl. preprints, EU journals). */
export async function searchEuropePmc(query: string, limit = 6): Promise<EvidenceSource[]> {
  const data = await safeJson<{
    resultList?: {
      result?: {
        id?: string;
        source?: string;
        title?: string;
        authorString?: string;
        pubYear?: string;
        journalTitle?: string;
        abstractText?: string;
        pubType?: string;
        doi?: string;
      }[];
    };
  }>(
    `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(
      query,
    )}&format=json&pageSize=${limit}&resultType=lite`,
    {},
  );
  return (data.resultList?.result ?? [])
    .filter((r) => r.title)
    .map((r) => ({
      id: `epmc:${r.source ?? "MED"}${r.id ?? ""}`,
      title: (r.title ?? "").replace(/<\/?[^>]+>/g, "").replace(/\.$/, ""),
      source: "Europe PMC" as const,
      url: r.doi
        ? `https://doi.org/${r.doi}`
        : `https://europepmc.org/article/${r.source ?? "MED"}/${r.id ?? ""}`,
      year: Number(r.pubYear) || undefined,
      authors: (r.authorString ?? "").split(",").slice(0, 3).join(",").trim() || undefined,
      snippet: [r.journalTitle, r.pubType].filter(Boolean).join(" — ") || undefined,
    }));
}

/** ClinicalTrials.gov v2 — free, no key. Surfaces active/recruiting studies. */
export async function searchTrials(condition: string, limit = 3): Promise<EvidenceSource[]> {
  if (!condition.trim()) return [];
  const data = await safeJson<{
    studies?: {
      protocolSection?: {
        identificationModule?: { nctId?: string; briefTitle?: string };
        statusModule?: { overallStatus?: string; startDateStruct?: { date?: string } };
        designModule?: { phases?: string[]; enrollmentInfo?: { count?: number } };
      };
    }[];
  }>(
    `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodeURIComponent(
      condition,
    )}&filter.overallStatus=RECRUITING|ACTIVE_NOT_RECRUITING|COMPLETED&pageSize=${limit}&sort=LastUpdatePostDate:desc`,
    {},
  );
  return (data.studies ?? [])
    .map((s) => {
      const p = s.protocolSection;
      const id = p?.identificationModule?.nctId;
      const title = p?.identificationModule?.briefTitle;
      if (!id || !title) return null;
      const phase = p?.designModule?.phases?.join("/");
      const n = p?.designModule?.enrollmentInfo?.count;
      return {
        id: `nct:${id}`,
        title,
        source: "Trial" as const,
        url: `https://clinicaltrials.gov/study/${id}`,
        year: Number((p?.statusModule?.startDateStruct?.date ?? "").slice(0, 4)) || undefined,
        snippet: [p?.statusModule?.overallStatus, phase, n ? `n=${n}` : ""]
          .filter(Boolean)
          .join(" · "),
      } satisfies EvidenceSource;
    })
    .filter(Boolean) as EvidenceSource[];
}

/* ------------------------------------------------------------------ *
 * Specialty-aware guideline routing — free public guideline libraries.
 * Makes the platform usable beyond adult internal medicine.
 * ------------------------------------------------------------------ */

export type Specialty =
  | "cardiology"
  | "pulmonology"
  | "infectious-disease"
  | "neurology"
  | "oncology"
  | "pediatrics"
  | "obstetrics"
  | "psychiatry"
  | "endocrinology"
  | "nephrology"
  | "gastroenterology"
  | "dermatology"
  | "rheumatology"
  | "emergency"
  | "general";

const SPECIALTY_TERMS: Record<Exclude<Specialty, "general">, RegExp> = {
  cardiology:
    /chest pain|myocardial|angina|heart failure|arrhythmi|atrial fibrillation|hypertens|acs\b|stemi|troponin/i,
  pulmonology: /cough|dyspn|pneumon|asthma|copd|pulmonary|tuberculosis|pleural|hypox/i,
  "infectious-disease":
    /fever|sepsis|infection|malaria|dengue|hiv|covid|antibiotic|abscess|meningitis/i,
  neurology:
    /seizure|stroke|headache|migraine|neuropath|parkinson|epilep|weakness|paresis|dementia/i,
  oncology: /cancer|tumou?r|carcinoma|lymphoma|leukemi|metasta|chemotherap|oncolog/i,
  pediatrics: /child|infant|neonat|p(a)?ediatric|toddler|newborn|\b\d{1,2}\s*(month|week)s?\s*old/i,
  obstetrics: /pregnan|obstetric|postpartum|gestation|preeclamp|labour|labor\b|fetal/i,
  psychiatry: /depress|anxiety|psychosis|schizophren|bipolar|suicid|substance use/i,
  endocrinology: /diabet|thyroid|insulin|hba1c|adrenal|pituitary|obesity|hypoglyc/i,
  nephrology: /renal|kidney|creatinine|dialysis|nephro|proteinuria|aki\b|ckd\b/i,
  gastroenterology: /abdominal pain|liver|hepat|gastro|diarrh|ulcer|pancreat|jaundice|ibd|colitis/i,
  dermatology: /rash|skin lesion|dermat|eczema|psoria|urticaria|pruritus/i,
  rheumatology: /arthrit|lupus|joint pain|vasculitis|rheumat|autoimmune|gout/i,
  emergency: /trauma|shock|resuscitat|unconscious|collapse|overdose|cardiac arrest/i,
};

/**
 * Score-based specialty detection. Terms found in `primaryText` (the clinical
 * question / presenting complaint) count far more than terms found only in the
 * background context, so a comorbidity like "hypertension" in the history does
 * not hijack the specialty of a respiratory case.
 */
export function detectSpecialty(text: string, primaryText?: string): Specialty {
  const context = text.toLowerCase();
  const primary = (primaryText ?? "").toLowerCase();
  let best: Specialty = "general";
  let bestScore = 0;

  for (const [key, re] of Object.entries(SPECIALTY_TERMS) as [
    Exclude<Specialty, "general">,
    RegExp,
  ][]) {
    const global = new RegExp(re.source, "gi");
    const contextHits = (context.match(global) ?? []).length;
    if (!contextHits) continue;
    const primaryHits = primary ? (primary.match(new RegExp(re.source, "gi")) ?? []).length : 0;
    const score = contextHits + primaryHits * 4;
    if (score > bestScore) {
      bestScore = score;
      best = key;
    }
  }

  return best;
}

const SPECIALTY_SOURCES: Record<Specialty, { name: string; url: (q: string) => string }[]> = {
  cardiology: [
    {
      name: "ESC clinical practice guidelines",
      url: (q) => `https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines?q=${q}`,
    },
  ],
  pulmonology: [
    {
      name: "WHO respiratory guidance",
      url: (q) => `https://www.who.int/publications/who-guidelines?q=${q}`,
    },
  ],
  "infectious-disease": [
    { name: "CDC clinical guidance", url: (q) => `https://search.cdc.gov/search/?query=${q}` },
  ],
  neurology: [
    { name: "NICE neurological guidance", url: (q) => `https://www.nice.org.uk/search?q=${q}` },
  ],
  oncology: [
    {
      name: "NCI PDQ cancer information",
      url: (q) => `https://www.cancer.gov/search/results?swKeyword=${q}`,
    },
  ],
  pediatrics: [
    {
      name: "WHO pocket book of hospital care for children",
      url: (q) => `https://www.who.int/publications/who-guidelines?q=${q}+child`,
    },
  ],
  obstetrics: [
    {
      name: "WHO maternal health guidelines",
      url: (q) => `https://www.who.int/publications/who-guidelines?q=${q}+pregnancy`,
    },
  ],
  psychiatry: [
    {
      name: "WHO mhGAP intervention guide",
      url: (q) => `https://www.who.int/publications/who-guidelines?q=${q}+mental+health`,
    },
  ],
  endocrinology: [
    { name: "NICE endocrine guidance", url: (q) => `https://www.nice.org.uk/search?q=${q}` },
  ],
  nephrology: [{ name: "KDIGO guidelines", url: (q) => `https://kdigo.org/?s=${q}` }],
  gastroenterology: [
    { name: "NICE gastroenterology guidance", url: (q) => `https://www.nice.org.uk/search?q=${q}` },
  ],
  dermatology: [
    { name: "DermNet clinical reference", url: (q) => `https://dermnetnz.org/search?q=${q}` },
  ],
  rheumatology: [
    { name: "EULAR recommendations", url: (q) => `https://www.eular.org/search?q=${q}` },
  ],
  emergency: [
    {
      name: "WHO emergency care guidance",
      url: (q) => `https://www.who.int/publications/who-guidelines?q=${q}+emergency`,
    },
  ],
  general: [
    { name: "NICE clinical guidance", url: (q) => `https://www.nice.org.uk/search?q=${q}` },
  ],
};

/** Returns guideline entry points for the detected specialty (always free/public). */
export function specialtyGuidelines(specialty: Specialty, query: string): EvidenceSource[] {
  const q = encodeURIComponent(query.slice(0, 80));
  return SPECIALTY_SOURCES[specialty].map((s, i) => ({
    id: `guide:${specialty}:${i}`,
    title: `${s.name} — ${query.slice(0, 70)}`,
    source: "Guideline" as const,
    url: s.url(q),
    snippet: `Specialty guideline library selected for ${specialty.replace("-", " ")}.`,
  }));
}

/* ------------------------------------------------------------------ *
 * Topical relevance filter.
 * Citation-heavy indexes happily return famous but unrelated papers
 * (AHA statistics, AF guidelines) for a pneumonia query. Keep only
 * sources that share meaningful clinical terms with the case.
 * ------------------------------------------------------------------ */

const REL_STOP = new Set(
  (
    "a an and or of the for with in on to is are was were what which who how why patient patients " +
    "male female year years old man woman history presents presenting management diagnosis diagnostic " +
    "treatment evidence based next step steps most likely clinical case review study report update " +
    "guideline guidelines report data global"
  ).split(" "),
);

function relTerms(text: string): string[] {
  return [
    ...new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !REL_STOP.has(w)),
    ),
  ];
}

/**
 * Drop sources with no topical overlap with the query/conditions.
 * Curated sources (WHO, specialty guideline library, openFDA labels) are
 * always kept — they were selected deterministically for this case.
 */
export function filterRelevant(
  sources: EvidenceSource[],
  queryText: string,
  minKeep = 4,
): EvidenceSource[] {
  const terms = relTerms(queryText);
  if (!terms.length) return sources;

  const scored = sources.map((s) => {
    const hay = `${s.title} ${s.snippet ?? ""}`.toLowerCase();
    const hits = terms.filter((t) => hay.includes(t)).length;
    const curated = s.source === "WHO" || s.source === "Guideline" || s.source === "openFDA";
    return { source: s, score: curated ? 99 : hits };
  });

  const kept = scored.filter((s) => s.score > 0);
  // Never starve retrieval: if the filter is too aggressive, fall back to the
  // best-scoring sources so downstream confidence is not falsely penalised.
  if (kept.length >= minKeep) return kept.map((s) => s.source);
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(minKeep, kept.length))
    .map((s) => s.source);
}
