import { describe, expect, it } from "vitest";
import {
  parseClinicalReport,
  extractCitations,
  getCitationUrl,
  generateEhrSummary,
} from "../src/lib/reports/clinical-report-parser";

describe("Clinical Report Parser", () => {
  const sampleMarkdown = `# Clinical Support Report
## Patient Summary
A 64-year-old male with hypertension and diabetes presents with fever and cough [pmid:31573350].

## Clinical Findings
- Respiratory: Tachypnea, SpO2 93%
- Systemic: Fever 38.2C
- Laboratory: Leukocytosis 15,200

## Differential Assessment
- Community-Acquired Pneumonia (CAP): High Likelihood. Supported by fever and focal crackles [pmid:31573350, pmid:40679934].
- Pulmonary Embolism (PE): Moderate Likelihood. Must be considered [pmid:31573350].
- Heart Failure: Low Likelihood. Less consistent with unilateral fever.

## Drug Safety
- Amlodipine: Monitor for hypotension [fda:Amlodipine].
- Metformin: Contraindicated in severe renal failure [fda:Metformin].

## Confidence and Limitations
Confidence: Medium. Needs chest radiography confirmation.

## References
[pmid:31573350] Metlay JP, et al. Am J Respir Crit Care Med, 2019.
[fda:Amlodipine] OpenFDA drug label: Amlodipine Besylate.
`;

  it("extracts citations properly from text", () => {
    const citations = extractCitations("Evaluated per [pmid:31573350] and [fda:Metformin].");
    expect(citations).toEqual(["pmid:31573350", "fda:Metformin"]);
  });

  it("converts PMIDs and FDA labels into verified URLs", () => {
    expect(getCitationUrl("pmid:31573350").url).toBe("https://pubmed.ncbi.nlm.nih.gov/31573350/");
    expect(getCitationUrl("pmid:31573350").type).toBe("pubmed");
    expect(getCitationUrl("fda:Amlodipine").url).toContain("Amlodipine");
    expect(getCitationUrl("fda:Amlodipine").type).toBe("fda");
  });

  it("parses structured sections accurately", () => {
    const result = parseClinicalReport(sampleMarkdown, "Test Report");
    expect(result.isStructured).toBe(true);
    expect(result.patientSummary).toContain("64-year-old male");

    // Findings
    expect(result.findings.length).toBe(3);
    expect(result.findings[0]?.label).toBe("Respiratory");
    expect(result.findings[0]?.value).toContain("Tachypnea");

    // Differentials
    expect(result.differentials.length).toBe(3);
    expect(result.differentials[0]?.condition).toBe("Community-Acquired Pneumonia (CAP)");
    expect(result.differentials[0]?.likelihood).toBe("High");
    expect(result.differentials[1]?.likelihood).toBe("Moderate");
    expect(result.differentials[2]?.likelihood).toBe("Low");

    // Drug safety
    expect(result.drugSafety.length).toBe(2);
    expect(result.drugSafety[1]?.isContraindicated).toBe(true);

    // Confidence
    expect(result.confidenceBand).toBe("Medium");

    // References
    expect(result.references.length).toBe(2);
    expect(result.references[0]?.key).toBe("[pmid:31573350]");
  });

  it("generates an EHR formatted plain text summary", () => {
    const parsed = parseClinicalReport(sampleMarkdown, "Test Report");
    const ehr = generateEhrSummary(parsed, "64yo Male", "2026-10-18");
    expect(ehr).toContain("MEDGUIDE AI CLINICAL DECISION SUPPORT CONSULTATION SUMMARY");
    expect(ehr).toContain("64yo Male");
    expect(ehr).toContain("Community-Acquired Pneumonia (CAP) [High Likelihood]");
    expect(ehr).toContain("ATTESTATION: Decision support only");
  });
});
