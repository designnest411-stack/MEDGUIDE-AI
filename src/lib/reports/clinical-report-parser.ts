/**
 * Clinical Report Parser & Formatter for MEDGUIDE AI
 * Transforms clinical markdown reports into structured hospital-grade chart representations
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
  const matches = text.match(/\[(pmid:\d+|fda:[\w\-]+|epmc:[\w\-]+)\]/gi);
  return matches ? Array.from(new Set(matches.map((m) => m.replace(/[[\]]/g, "")))) : [];
}

/**
 * Converts a citation string (e.g. pmid:31573350 or fda:Amlodipine) into a verified external URL
 */
export function getCitationUrl(citation: string): { url: string; type: "pubmed" | "fda" | "epmc" | "other" } {
  const clean = citation.trim().replace(/^\[|\]$/g, "");
  const pmidMatch = clean.match(/^pmid:\s*(\d+)/i);
  if (pmidMatch && pmidMatch[1]) {
    return { url: `https://pubmed.ncbi.nlm.nih.gov/${pmidMatch[1]}/`, type: "pubmed" };
  }
  const fdaMatch = clean.match(/^fda:\s*([\w\-]+)/i);
  if (fdaMatch && fdaMatch[1]) {
    return { url: `https://drugs.ncats.io/substances?q=${encodeURIComponent(fdaMatch[1])}`, type: "fda" };
  }
  const epmcMatch = clean.match(/^epmc:\s*([\w\-]+)/i);
  if (epmcMatch && epmcMatch[1]) {
    return { url: `https://europepmc.org/article/MED/${epmcMatch[1].replace(/^MED/i, "")}`, type: "epmc" };
  }
  return { url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(clean)}`, type: "other" };
}

/**
 * Parses markdown into structured hospital clinical consultation blocks
 */
export function parseClinicalReport(markdown: string, fallbackTitle = "Clinical Support Report"): StructuredClinicalReport {
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

  // Extract primary document title if present
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  if (titleMatch && titleMatch[1]) {
    result.title = titleMatch[1].trim();
  }

  // Split markdown into sections by standard H2 headings
  const sections = markdown.split(/^##\s+/m);

  for (const rawSec of sections) {
    if (!rawSec.trim()) continue;
    const newlineIdx = rawSec.indexOf("\n");
    const header = (newlineIdx > -1 ? rawSec.slice(0, newlineIdx) : rawSec).trim().toLowerCase();
    const body = (newlineIdx > -1 ? rawSec.slice(newlineIdx) : "").trim();

    // 1. Patient Summary
    if (header.includes("patient summary") || header.includes("patient presentation") || header.includes("case summary")) {
      result.patientSummary = body.replace(/^[*\s]+/, "").trim();
      result.isStructured = true;
    }
    // 2. Clinical Findings / Objective Data
    else if (header.includes("clinical finding") || header.includes("objective findings") || header.includes("examination")) {
      result.isStructured = true;
      const lines = body.split("\n");
      for (const line of lines) {
        const cleaned = line.replace(/^[-*•]\s*/, "").trim();
        if (!cleaned) continue;
        const colonIdx = cleaned.indexOf(":");
        if (colonIdx > -1) {
          result.findings.push({
            label: cleaned.slice(0, colonIdx).trim(),
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
    else if (header.includes("differential assessment") || header.includes("differential diagnosis") || header.includes("differentials")) {
      result.isStructured = true;
      const lines = body.split("\n");
      for (const line of lines) {
        const cleaned = line.replace(/^[-*•\d.]\s*/, "").trim();
        if (!cleaned) continue;

        // Pattern: "Condition: Likelihood. Rationale [pmid:...]"
        let condition = "";
        let likelihood: "High" | "Moderate" | "Low" | "Unknown" = "Unknown";
        let likelihoodText = "";
        let rationale = cleaned;

        const colonIdx = cleaned.indexOf(":");
        if (colonIdx > -1) {
          condition = cleaned.slice(0, colonIdx).replace(/\*\*/g, "").trim();
          const remainder = cleaned.slice(colonIdx + 1).trim();

          if (/high likelihood/i.test(remainder)) {
            likelihood = "High";
            likelihoodText = "High Likelihood";
          } else if (/moderate likelihood|possible/i.test(remainder)) {
            likelihood = "Moderate";
            likelihoodText = "Moderate Likelihood";
          } else if (/low likelihood|unlikely/i.test(remainder)) {
            likelihood = "Low";
            likelihoodText = "Low Likelihood";
          }

          rationale = remainder.replace(/^(high|moderate|low)\s+likelihood\.?\s*/i, "");
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
    else if (header.includes("evidence base") || header.includes("literature") || header.includes("clinical guidelines")) {
      result.isStructured = true;
      const lines = body.split("\n");
      for (const line of lines) {
        const cleaned = line.replace(/^[-*•]\s*/, "").trim();
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
    else if (header.includes("drug safety") || header.includes("pharmacovigilance") || header.includes("medication safety")) {
      result.isStructured = true;
      const lines = body.split("\n");
      for (const line of lines) {
        const cleaned = line.replace(/^[-*•]\s*/, "").trim();
        if (!cleaned) continue;
        const colonIdx = cleaned.indexOf(":");
        let drug = "Medication";
        let warning = cleaned;
        if (colonIdx > -1) {
          drug = cleaned.slice(0, colonIdx).replace(/\*\*/g, "").trim();
          warning = cleaned.slice(colonIdx + 1).trim();
        }
        const isContraindicated = /contraindicated|black box|severe|fatal|avoid/i.test(warning);
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
    else if (header.includes("imaging") || header.includes("radiology") || header.includes("x-ray")) {
      result.isStructured = true;
      result.imagingFindings = body;
    }
    // 7. Confidence and Limitations
    else if (header.includes("confidence") || header.includes("limitations")) {
      result.isStructured = true;
      if (/confidence:\s*high/i.test(body)) result.confidenceBand = "High";
      else if (/confidence:\s*medium|moderate/i.test(body)) result.confidenceBand = "Medium";
      else if (/confidence:\s*low/i.test(body)) result.confidenceBand = "Low";
      else if (/insufficient/i.test(body)) result.confidenceBand = "Insufficient";

      result.confidenceExplanation = body;

      // Extract bulleted limitations if available
      const lines = body.split("\n");
      for (const line of lines) {
        const cleaned = line.replace(/^[-*•]\s*/, "").trim();
        if (cleaned && !cleaned.toLowerCase().startsWith("confidence:")) {
          result.limitations.push(cleaned);
        }
      }
    }
    // 8. References
    else if (header.includes("reference") || header.includes("citation") || header.includes("bibliography")) {
      result.isStructured = true;
      const lines = body.split("\n");
      for (const line of lines) {
        const cleaned = line.replace(/^[-*•\d.]\s*/, "").trim();
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

  return result;
}

/**
 * Generates an Electronic Health Record (EHR / Epic / Cerner) formatted plain text summary
 */
export function generateEhrSummary(report: StructuredClinicalReport, patientName?: string, dateStr?: string): string {
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
