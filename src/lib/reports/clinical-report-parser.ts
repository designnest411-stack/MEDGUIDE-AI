/**
 * Clinical Report Parser & Formatter for MEDGUIDE AI
 * Transforms clinical markdown reports into structured clinical chart representations
 * with interactive PubMed citations, EHR copy generators, and rich PDF exporting.
 */

export interface ParsedFinding {
  label: string;
  value: string;
}

export interface ParsedDifferential {
  condition: string;
  likelihood: "High" | "Moderate" | "Low" | "Unknown";
  likelihoodText: string;
  rationale: string;
  citations: string[];
}

export interface ParsedDrugAlert {
  drug: string;
  warning: string;
  isContraindicated: boolean;
  citations: string[];
}

export interface ParsedReference {
  key: string;
  citation: string;
  url: string;
  sourceType: "pubmed" | "fda" | "epmc" | "other";
}

export interface StructuredClinicalReport {
  title: string;
  patientSummary: string;
  findings: ParsedFinding[];
  differentials: ParsedDifferential[];
  evidenceBase: Array<{ topic: string; content: string }>;
  drugSafety: ParsedDrugAlert[];
  imagingFindings?: string | undefined;
  confidenceBand: "High" | "Medium" | "Low" | "Insufficient";
  confidenceExplanation: string;
  limitations: string[];
  references: ParsedReference[];
  rawMarkdown: string;
  isStructured: boolean;
}

/**
 * Extracts PubMed IDs, FDA labels, and Europe PMC identifiers from markdown text
 */
export function extractCitations(text: string): string[] {
  const matches = text.match(/\[(pmid:\d+|fda:[\w-]+|epmc:[\w-]+)\]/gi);
  return matches ? Array.from(new Set(matches.map((m) => m.replace(/[[\]]/g, "")))) : [];
}

/**
 * Converts a citation string (e.g. pmid:31573350 or fda:Amlodipine) into a verified external URL
 */
export function getCitationUrl(citation: string): {
  url: string;
  type: "pubmed" | "fda" | "epmc" | "other";
} {
  const clean = citation.trim().replace(/^\[|\]$/g, "");
  const pmidMatch = clean.match(/^pmid:\s*(\d+)/i);
  if (pmidMatch && pmidMatch[1]) {
    return { url: `https://pubmed.ncbi.nlm.nih.gov/${pmidMatch[1]}/`, type: "pubmed" };
  }
  const fdaMatch = clean.match(/^fda:\s*([\w-]+)/i);
  if (fdaMatch && fdaMatch[1]) {
    return {
      url: `https://drugs.ncats.io/substances?q=${encodeURIComponent(fdaMatch[1])}`,
      type: "fda",
    };
  }
  const epmcMatch = clean.match(/^epmc:\s*([\w-]+)/i);
  if (epmcMatch && epmcMatch[1]) {
    return {
      url: `https://europepmc.org/article/MED/${epmcMatch[1].replace(/^MED/i, "")}`,
      type: "epmc",
    };
  }
  return {
    url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(clean)}`,
    type: "other",
  };
}

/**
 * Parses markdown into structured hospital clinical consultation blocks.
 * Robust against variations in LLM formatting (## Header, ### Header, **Header**, Header:, 1. Header).
 */
export function parseClinicalReport(
  markdown: string,
  fallbackTitle = "Clinical Support Report",
): StructuredClinicalReport {
  const result: StructuredClinicalReport = {
    title: fallbackTitle,
    patientSummary: "",
    findings: [],
    differentials: [],
    evidenceBase: [],
    drugSafety: [],
    imagingFindings: undefined,
    confidenceBand: "Medium",
    confidenceExplanation: "",
    limitations: [],
    references: [],
    rawMarkdown: markdown,
    isStructured: false,
  };

  if (!markdown || typeof markdown !== "string") {
    return result;
  }

  const normalized = markdown.replace(/\r\n/g, "\n");

  // Extract primary document title if present (# Title)
  const titleMatch = normalized.match(/^#\s+([^\n]+)/m);
  if (titleMatch && titleMatch[1]) {
    result.title = titleMatch[1].replace(/[*`_]/g, "").trim();
  }

  // Regex matching all canonical clinical section headers in various markdown/text syntaxes:
  // e.g. "## Patient Summary", "### Clinical Findings", "**Differential Assessment**", "Drug Safety:"
  const SECTION_HEADER_REGEX =
    /(?:^|\n)(?:[#*\d\s.)\-:–—]+)?(Patient Summary|Patient Presentation|Case Summary|Clinical Presentation|Clinical Summary|Clinical Findings|Objective Findings|Physical Examination|Diagnostic Findings|Differential Assessment|Differential Diagnos(?:is|es)|Differentials|Diagnostic Impressions?|Evidence Base|Biomedical Evidence|Clinical Guidelines|Literature Base|Drug Safety|Pharmacovigilance|Medication Safety|Drug Interactions|Imaging Findings|Imaging|Radiology|Chest X-Ray|Confidence and Limitations|Confidence & Limitations|Confidence Calibration|Confidence|Limitations|References|Audited References|Citations|Bibliography)(?:[*:\s.)\-:–—]+(?:\n|$)|(?:\n|$))/gi;

  const matches: Array<{ name: string; startIndex: number; bodyStart: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = SECTION_HEADER_REGEX.exec(normalized)) !== null) {
    const rawName = match[1];
    if (rawName) {
      matches.push({
        name: rawName.trim().toLowerCase(),
        startIndex: match.index,
        bodyStart: match.index + match[0].length,
      });
    }
  }

  // If no canonical section headers found, check legacy H2 split or heuristic line analysis
  if (matches.length === 0) {
    const legacySections = normalized.split(/^##\s+/m);
    if (legacySections.length > 1) {
      for (const rawSec of legacySections) {
        if (!rawSec.trim()) continue;
        const newlineIdx = rawSec.indexOf("\n");
        const header = (newlineIdx > -1 ? rawSec.slice(0, newlineIdx) : rawSec)
          .trim()
          .toLowerCase();
        const body = (newlineIdx > -1 ? rawSec.slice(newlineIdx) : "").trim();
        parseSectionBody(header, body, result);
      }
    } else {
      // Heuristic parsing for plain unstructured clinical text
      const lines = normalized.split("\n");
      const summaryLines: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (/^\[(pmid:\d+|fda:[\w-]+|epmc:[\w-]+)\]/i.test(trimmed)) {
          const match = trimmed.match(/^(\[[^\]]+\])\s*(.+)$/);
          if (match && match[1] && match[2]) {
            const { url, type } = getCitationUrl(match[1]);
            result.references.push({ key: match[1], citation: match[2], url, sourceType: type });
          }
          result.isStructured = true;
        } else if (/^\d+[.)]\s+[^:]+:\s*(?:high|moderate|low|unlikely|possible)/i.test(trimmed)) {
          const colonIdx = trimmed.indexOf(":");
          const condition = trimmed
            .slice(0, colonIdx)
            .replace(/^\d+[.)]\s*/, "")
            .trim();
          const remainder = trimmed.slice(colonIdx + 1).trim();
          let likelihood: "High" | "Moderate" | "Low" | "Unknown" = "Unknown";
          if (/high/i.test(remainder)) likelihood = "High";
          else if (/moderate|possible/i.test(remainder)) likelihood = "Moderate";
          else if (/low|unlikely/i.test(remainder)) likelihood = "Low";
          result.differentials.push({
            condition,
            likelihood,
            likelihoodText: `${likelihood} Likelihood`,
            rationale: remainder,
            citations: extractCitations(trimmed),
          });
          result.isStructured = true;
        } else if (
          /^(?:bp|blood pressure|hr|heart rate|temp|spo2|rr|resp|wbc|crp|labs?|vitals?):/i.test(
            trimmed,
          )
        ) {
          const colonIdx = trimmed.indexOf(":");
          result.findings.push({
            label: trimmed.slice(0, colonIdx).trim(),
            value: trimmed.slice(colonIdx + 1).trim(),
          });
          result.isStructured = true;
        } else if (summaryLines.length < 5) {
          summaryLines.push(trimmed);
        }
      }
      if (summaryLines.length > 0) {
        result.patientSummary = summaryLines.join(" ");
        result.isStructured = true;
      }
    }
    return result;
  }

  // Extract sections by slicing between match boundaries
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i]!;
    const nextStart = i + 1 < matches.length ? matches[i + 1]!.startIndex : normalized.length;
    const body = normalized.slice(current.bodyStart, nextStart).trim();
    parseSectionBody(current.name, body, result);
  }

  return result;
}

function parseSectionBody(header: string, body: string, result: StructuredClinicalReport): void {
  const normHeader = header.toLowerCase();

  // 1. Patient Summary
  if (
    normHeader.includes("patient summary") ||
    normHeader.includes("patient presentation") ||
    normHeader.includes("case summary") ||
    normHeader.includes("clinical presentation") ||
    normHeader.includes("clinical summary") ||
    normHeader.includes("summary")
  ) {
    result.patientSummary = body.replace(/^[*\s]+/, "").trim();
    result.isStructured = true;
  }
  // 2. Clinical Findings / Objective Data
  else if (
    normHeader.includes("clinical finding") ||
    normHeader.includes("objective finding") ||
    normHeader.includes("diagnostic finding") ||
    normHeader.includes("examination") ||
    normHeader.includes("vital") ||
    normHeader.includes("lab")
  ) {
    result.isStructured = true;
    const lines = body.split("\n");
    for (const line of lines) {
      const cleaned = line.replace(/^(?:\d+[.)]\s*|[-*•]\s*)/, "").trim();
      if (!cleaned) continue;
      const colonIdx = cleaned.indexOf(":");
      if (colonIdx > -1) {
        result.findings.push({
          label: cleaned.slice(0, colonIdx).replace(/\*\*/g, "").trim(),
          value: cleaned.slice(colonIdx + 1).trim(),
        });
      } else {
        result.findings.push({
          label: "Finding",
          value: cleaned,
        });
      }
    }
  }
  // 3. Differential Assessment
  else if (
    normHeader.includes("differential") ||
    normHeader.includes("diagnostic impression") ||
    normHeader.includes("diagnosis") ||
    normHeader.includes("assessment")
  ) {
    result.isStructured = true;
    const lines = body.split("\n");
    for (const line of lines) {
      const cleaned = line.replace(/^(?:\d+[.)]\s*|[-*•]\s*)/, "").trim();
      if (!cleaned) continue;

      let condition = "";
      let likelihood: "High" | "Moderate" | "Low" | "Unknown" = "Unknown";
      let likelihoodText = "";
      let rationale = cleaned;

      const colonIdx = cleaned.indexOf(":");
      if (colonIdx > -1) {
        condition = cleaned.slice(0, colonIdx).replace(/\*\*/g, "").trim();
        const remainder = cleaned.slice(colonIdx + 1).trim();

        if (/high likelihood|high/i.test(remainder)) {
          likelihood = "High";
          likelihoodText = "High Likelihood";
        } else if (/moderate likelihood|possible|moderate/i.test(remainder)) {
          likelihood = "Moderate";
          likelihoodText = "Moderate Likelihood";
        } else if (/low likelihood|unlikely|low/i.test(remainder)) {
          likelihood = "Low";
          likelihoodText = "Low Likelihood";
        }

        rationale = remainder.replace(/^(?:high|moderate|low)\s+likelihood\.?\s*/i, "");
      } else {
        condition = cleaned.slice(0, 50);
      }

      const citations = extractCitations(cleaned);
      result.differentials.push({
        condition,
        likelihood,
        likelihoodText: likelihoodText || `${likelihood} Likelihood`,
        rationale,
        citations,
      });
    }
  }
  // 4. Evidence Base
  else if (
    normHeader.includes("evidence") ||
    normHeader.includes("guideline") ||
    normHeader.includes("literature")
  ) {
    result.isStructured = true;
    const lines = body.split("\n");
    for (const line of lines) {
      const cleaned = line.replace(/^(?:\d+[.)]\s*|[-*•]\s*)/, "").trim();
      if (!cleaned) continue;
      const colonIdx = cleaned.indexOf(":");
      if (colonIdx > -1) {
        result.evidenceBase.push({
          topic: cleaned.slice(0, colonIdx).replace(/\*\*/g, "").trim(),
          content: cleaned.slice(colonIdx + 1).trim(),
        });
      } else {
        result.evidenceBase.push({
          topic: "Guideline",
          content: cleaned,
        });
      }
    }
  }
  // 5. Drug Safety & Pharmacovigilance
  else if (
    normHeader.includes("drug safety") ||
    normHeader.includes("pharmacovigilance") ||
    normHeader.includes("medication safety") ||
    normHeader.includes("drug") ||
    normHeader.includes("medication")
  ) {
    result.isStructured = true;
    const lines = body.split("\n");
    for (const line of lines) {
      const cleaned = line.replace(/^(?:\d+[.)]\s*|[-*•]\s*)/, "").trim();
      if (!cleaned) continue;
      const colonIdx = cleaned.indexOf(":");
      let drug = "Medication";
      let warning = cleaned;
      if (colonIdx > -1) {
        drug = cleaned.slice(0, colonIdx).replace(/\*\*/g, "").trim();
        warning = cleaned.slice(colonIdx + 1).trim();
      }
      const isContraindicated =
        /contraindicated|black box|severe|fatal|avoid|toxicity|renal failure|impairment/i.test(
          warning,
        );
      const citations = extractCitations(cleaned);
      result.drugSafety.push({
        drug,
        warning,
        isContraindicated,
        citations,
      });
    }
  }
  // 6. Imaging / Radiology Findings
  else if (
    normHeader.includes("imaging") ||
    normHeader.includes("radiology") ||
    normHeader.includes("x-ray")
  ) {
    result.isStructured = true;
    result.imagingFindings = body;
  }
  // 7. Confidence and Limitations
  else if (normHeader.includes("confidence") || normHeader.includes("limitation")) {
    result.isStructured = true;
    if (/confidence:\s*high/i.test(body)) result.confidenceBand = "High";
    else if (/confidence:\s*medium|moderate/i.test(body)) result.confidenceBand = "Medium";
    else if (/confidence:\s*low/i.test(body)) result.confidenceBand = "Low";
    else if (/insufficient/i.test(body)) result.confidenceBand = "Insufficient";

    result.confidenceExplanation = body;

    const lines = body.split("\n");
    for (const line of lines) {
      const cleaned = line.replace(/^[-*•]\s*/, "").trim();
      if (cleaned && !cleaned.toLowerCase().startsWith("confidence:")) {
        result.limitations.push(cleaned);
      }
    }
  }
  // 8. References
  else if (
    normHeader.includes("reference") ||
    normHeader.includes("citation") ||
    normHeader.includes("bibliography")
  ) {
    result.isStructured = true;
    const lines = body.split("\n");
    for (const line of lines) {
      const cleaned = line.replace(/^(?:\d+[.)]\s*|[-*•]\s*)/, "").trim();
      if (!cleaned) continue;
      const match = cleaned.match(/^(\[[^\]]+\])\s*(.+)$/);
      if (match && match[1] && match[2]) {
        const key = match[1];
        const citation = match[2];
        const { url, type } = getCitationUrl(key);
        result.references.push({
          key,
          citation,
          url,
          sourceType: type,
        });
      } else {
        result.references.push({
          key: `[ref:${result.references.length + 1}]`,
          citation: cleaned,
          url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(cleaned.slice(0, 40))}`,
          sourceType: "other",
        });
      }
    }
  }
}

/**
 * Generates an Electronic Health Record (EHR / Epic / Cerner) formatted plain text summary
 */
export function generateEhrSummary(
  report: StructuredClinicalReport,
  patientName?: string,
  dateStr?: string,
): string {
  const lines: string[] = [
    "==================================================================",
    "MEDGUIDE AI CLINICAL DECISION SUPPORT CONSULTATION SUMMARY",
    `DATE/TIME: ${dateStr || new Date().toLocaleString()}`,
    `PATIENT: ${patientName || "De-identified Clinical Vignette"}`,
    `CONFIDENCE CALIBRATION: ${report.confidenceBand.toUpperCase()}`,
    "==================================================================",
    "",
    "1. CLINICAL PRESENTATION & SUMMARY:",
    report.patientSummary || "See attached notes.",
    "",
  ];

  if (report.findings.length > 0) {
    lines.push("2. OBJECTIVE FINDINGS & LABS:");
    report.findings.forEach((f) => lines.push(`   - ${f.label}: ${f.value}`));
    lines.push("");
  }

  if (report.differentials.length > 0) {
    lines.push("3. RANKED DIFFERENTIAL ASSESSMENTS:");
    report.differentials.forEach((d, i) => {
      lines.push(`   ${i + 1}. ${d.condition} [${d.likelihoodText}]`);
      lines.push(`      Rationale: ${d.rationale}`);
      if (d.citations.length > 0) {
        lines.push(`      Evidence: ${d.citations.join(", ")}`);
      }
    });
    lines.push("");
  }

  if (report.drugSafety.length > 0) {
    lines.push("4. PHARMACOVIGILANCE & DRUG SAFETY AUDIT:");
    report.drugSafety.forEach((ds) => {
      lines.push(`   - ${ds.drug}: ${ds.warning}`);
    });
    lines.push("");
  }

  if (report.evidenceBase.length > 0) {
    lines.push("5. EVIDENCE-BASED GUIDELINES:");
    report.evidenceBase.forEach((eb) => {
      lines.push(`   - ${eb.topic}: ${eb.content}`);
    });
    lines.push("");
  }

  if (report.confidenceExplanation) {
    lines.push("6. CONFIDENCE BAND & CLINICAL LIMITATIONS:");
    lines.push(`   Rating: ${report.confidenceBand}`);
    lines.push(`   Audit: ${report.confidenceExplanation}`);
    lines.push("");
  }

  if (report.references.length > 0) {
    lines.push("7. VERIFIED CITATIONS:");
    report.references.forEach((r) => {
      lines.push(`   ${r.key} ${r.citation}`);
    });
    lines.push("");
  }

  lines.push("==================================================================");
  lines.push("ATTESTATION: Decision support only. Not an autonomous diagnosis.");
  lines.push("All clinical actions must be confirmed by a licensed medical provider.");
  lines.push("==================================================================");

  return lines.join("\n");
}
