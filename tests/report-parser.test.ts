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

  it("parses raw text headings without hashes cleanly", () => {
    const rawMarkdown = `
Patient Summary
A 64-year-old male with hypertension and diabetes presents with acute fever and productive cough.

Clinical Findings
Respiratory: Tachypnea (22/min), SpO2 93%, right lower-zone crackles.
Systemic: Fever (38.2C), tachycardia (104 bpm).

Differential Assessment
1. Community-Acquired Pneumonia (CAP): High Likelihood. Supported by fever and focal auscultatory findings [pmid:31573350].
2. Pulmonary Embolism (PE): Moderate Likelihood. Must be considered [pmid:31573350].

Drug Safety
Amlodipine: Monitor for hypotension [fda:Amlodipine].
Metformin: Contraindicated in severe renal failure [fda:Metformin].

Confidence and Limitations
Confidence: Medium. Needs radiographic confirmation.

References
[pmid:31573350] Metlay JP, et al. Am J Respir Crit Care Med, 2019.
[fda:Amlodipine] OpenFDA drug label: Amlodipine Besylate.
`;
    const parsed = parseClinicalReport(rawMarkdown, "Raw Report");
    expect(parsed.isStructured).toBe(true);
    expect(parsed.patientSummary).toContain("64-year-old male");
    expect(parsed.findings.length).toBe(2);
    expect(parsed.findings[0]?.label).toBe("Respiratory");
    expect(parsed.differentials.length).toBe(2);
    expect(parsed.differentials[0]?.condition).toBe("Community-Acquired Pneumonia (CAP)");
    expect(parsed.differentials[0]?.likelihood).toBe("High");
    expect(parsed.drugSafety.length).toBe(2);
    expect(parsed.references.length).toBe(2);
  });

  it("parses the exact clinical consultation text from the user report image with full structure", async () => {
    const liveReportText = `Clinical Support Report

Patient Summary
A 64-year-old male with a history of hypertension, type 2 diabetes, and hyperlipidemia presents with acute onset of fever (38.2°C), productive cough, dyspnea, and tachycardia (104 bpm). Physical examination reveals right lower-zone crackles and mild hypoxemia (SpO₂ 93% on room air). Laboratory findings show leukocytosis (15,200/μL) and elevated CRP (126 mg/L), highly suggestive of Community-Acquired Pneumonia (CAP) in a patient with significant comorbidities [pmid:31573350].

Clinical Findings
Respiratory: Tachypnea (22/min), SpO₂ 93%, right lower-zone crackles.
Systemic: Fever (38.2°C), tachycardia (104 bpm).
Laboratory: Leukocytosis (15,200/μL), elevated CRP (126 mg/L), creatinine 1.3 mg/dL, glucose 186 mg/dL.

Differential Assessment
1. Community-Acquired Pneumonia (CAP): High Likelihood. Supported by fever, productive cough, focal auscultatory findings, and inflammatory markers [pmid:31573350, pmid:40679934].
2. Pulmonary Embolism (PE): Moderate Likelihood. Must be considered given the tachycardia, tachypnea, and hypoxia [pmid:31573350].
3. Heart Failure Exacerbation: Low Likelihood. While the patient has cardiovascular risk factors, the unilateral crackles make heart failure less consistent.

Evidence Base
Diagnosis: Diagnosis is confirmed via chest radiography demonstrating an infiltrate [pmid:31573350, pmid:40679934].
Severity Assessment: Severity should be stratified using the CURB-65 score [epmc:MED42109413, pmid:31573350].
Management: Initial management involves empiric antibiotic therapy tailored to local resistance patterns [pmid:31573350].

Drug Safety
Amlodipine: Monitor for hypotension and peripheral edema [fda:Amlodipine].
Metformin: Contraindicated in patients with severe renal impairment (eGFR <30 mL/min/1.73 m²). Given the patient's creatinine of 1.3 mg/dL, renal function should be monitored [fda:Metformin].
Atorvastatin: Contraindicated in patients with active liver disease [fda:Atorvastatin].

Confidence and Limitations
Confidence: Medium. The clinical presentation is classic for CAP, but the patient's comorbidities necessitate a cautious approach to rule out complications.

References
[pmid:31573350] Metlay JP, et al. Diagnosis and Treatment of Adults with Community-acquired Pneumonia. Am J Respir Crit Care Med, 2019.
[pmid:40679934] Diagnosis and Management of Community-acquired Pneumonia: An Official American Thoracic Society Clinical Practice Guideline.
[epmc:MED42109413] CURB-65 for community-acquired pneumonia severity index.
[fda:Amlodipine] OpenFDA drug label: Amlodipine Besylate.
[fda:Metformin] OpenFDA drug label: Sitagliptin and Metformin Hydrochloride.
[fda:Atorvastatin] OpenFDA drug label: Atorvastatin Calcium.
`;

    const parsed = parseClinicalReport(liveReportText, "Clinical Support Report");
    expect(parsed.isStructured).toBe(true);
    expect(parsed.patientSummary).toContain("64-year-old male");
    expect(parsed.findings.length).toBe(3);
    expect(parsed.differentials.length).toBe(3);
    expect(parsed.differentials[0]?.likelihood).toBe("High");
    expect(parsed.differentials[1]?.likelihood).toBe("Moderate");
    expect(parsed.differentials[2]?.likelihood).toBe("Low");
    expect(parsed.evidenceBase.length).toBe(3);
    expect(parsed.drugSafety.length).toBe(3);
    expect(parsed.drugSafety[1]?.isContraindicated).toBe(true);
    expect(parsed.confidenceBand).toBe("Medium");
    expect(parsed.references.length).toBe(6);

    const { generateClinicalReportPdf } = await import("../src/lib/reports/report-pdf-generator");
    const doc = (await generateClinicalReportPdf({
      title: "64-year-old male with fever and cough",
      patientName: "64 Male",
      markdown: liveReportText,
      createdAt: 1724323479000,
      reportId: "EQSytLmCxyDjll",
    })) as any;
    expect(doc.getNumberOfPages()).toBe(2);
  });

  it("sanitizes medical text to prevent jsPDF font corruption", async () => {
    const { sanitizeMedicalText } = await import("../src/lib/reports/report-pdf-generator");
    expect(sanitizeMedicalText("SpO₂: 93% on room air, leukocytosis 15,200/μL, fever 38.2°C")).toBe(
      "SpO2: 93% on room air, leukocytosis 15,200/mcL, fever 38.2 deg C",
    );
  });

  it("generates a clinical PDF document without throwing", async () => {
    const { generateClinicalReportPdf } = await import("../src/lib/reports/report-pdf-generator");
    await expect(
      generateClinicalReportPdf({
        title: "64yo Male with Fever and Dyspnea",
        patientName: "John Doe",
        markdown: sampleMarkdown,
        createdAt: Date.now(),
        reportId: "TEST-REP-12345",
      }),
    ).resolves.not.toThrow();
  });
});
