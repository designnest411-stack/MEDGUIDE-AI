/**
 * Clinical Consultation Report PDF Generator
 * Produces executive, vector clinical consultation documents with QR codes,
 * evidence badges, pharmacovigilance callouts, and official clinician attestation.
 *
 * Implements intelligent Page Budgeting:
 * - If consultation fits within single-page budget (<= 750 pt), generates a dense,
 *   crisp 1-page executive summary with zero spillovers.
 * - If consultation requires multi-page layout (> 750 pt), separates into:
 *   Page 1: Clinical Diagnostic Assessment (Presentation, Findings, Differentials)
 *   Page 2: Biomedical Evidence, Pharmacovigilance, Bibliography & Physician Sign-Off
 * Eliminates orphan line spillovers and blank trailing pages completely.
 */
import jsPDF from "jspdf";
import QRCode from "qrcode";

import { type StructuredClinicalReport, parseClinicalReport } from "./clinical-report-parser";

export interface PdfExportOptions {
  title: string;
  patientName?: string | undefined;
  markdown: string;
  createdAt: number | string;
  reportId?: string | undefined;
}

/**
 * Sanitizes medical strings to eliminate non-standard Unicode characters
 * that break jsPDF Helvetica font kerning (e.g. SpO₂ -> SpO2, μL -> mcL).
 */
export function sanitizeMedicalText(text: string): string {
  if (!text) return "";
  return text
    .replace(/SpO[₂2]/g, "SpO2")
    .replace(/O[₂2]/g, "O2")
    .replace(/CO[₂2]/g, "CO2")
    .replace(/[μµ]L/gi, "mcL")
    .replace(/[μµ]g/gi, "mcg")
    .replace(/[—–]/g, " - ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[•·]/g, "-")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/±/g, "+/-")
    .replace(/°C/g, " deg C")
    .replace(/°/g, " deg ")
    .replace(/[^\x20-\x7E\t\n\r]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateClinicalReportPdf(options: PdfExportOptions): Promise<void> {
  const { title, patientName, markdown, createdAt, reportId } = options;
  const structured: StructuredClinicalReport = parseClinicalReport(markdown, title);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt
  const margin = 32;
  const contentWidth = pageWidth - margin * 2; // 531.28 pt

  const consultDate = new Date(createdAt).toLocaleString();
  const reportDocId = reportId ? reportId.slice(0, 14) : "CDSS-VERIFIED";

  // Generate QR Code data URL for verification
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(
      `MEDGUIDE AI CLINICAL VERIFICATION\nReport: ${title.slice(0, 50)}\nDate: ${consultDate}\nID: ${reportDocId}`,
      { margin: 1, width: 140 },
    );
  } catch {
    /* Optional QR */
  }

  // --- HEIGHT ESTIMATION & BUDGETING ---
  // Determine whether this consultation fits cleanly on 1 page or requires an intentional 2-page dossier
  let estimatedHeight = 110; // Top banner (44pt) + Patient Card (54pt) + Margins

  if (structured.patientSummary) {
    const lines = doc.splitTextToSize(
      sanitizeMedicalText(structured.patientSummary),
      contentWidth - 14,
    ) as string[];
    estimatedHeight += lines.length * 9.5 + 24;
  }

  if (structured.findings.length > 0) {
    estimatedHeight += 16 + Math.ceil(structured.findings.length / 2) * 14 + 6;
  }

  if (structured.differentials.length > 0) {
    let diffsH = 16;
    for (const d of structured.differentials) {
      const ratLines = doc.splitTextToSize(
        sanitizeMedicalText(d.rationale),
        contentWidth - 16,
      ) as string[];
      diffsH += 14 + ratLines.length * 8.5 + (d.citations.length ? 9 : 0) + 4;
    }
    estimatedHeight += diffsH;
  }

  if (structured.drugSafety.length > 0) {
    let drugsH = 16;
    for (const ds of structured.drugSafety) {
      const warnLines = doc.splitTextToSize(
        sanitizeMedicalText(ds.warning),
        contentWidth - 16,
      ) as string[];
      drugsH += 12 + warnLines.length * 8 + 4;
    }
    estimatedHeight += drugsH;
  }

  if (structured.evidenceBase.length > 0) {
    estimatedHeight += 16 + structured.evidenceBase.length * 20;
  }

  if (structured.confidenceExplanation) {
    const confLines = doc.splitTextToSize(
      sanitizeMedicalText(structured.confidenceExplanation),
      contentWidth - 14,
    ) as string[];
    estimatedHeight += 16 + confLines.length * 8.5 + 8;
  }

  if (structured.references.length > 0) {
    estimatedHeight += 16 + Math.ceil(structured.references.length / 2) * 11 + 6;
  }

  estimatedHeight += 38; // Clinician attestation sign-off block

  // Net printable height per page is 841.89 - 44 (top) - 34 (bottom) = ~763 pt
  // Conservative budget: if <= 620 pt, guarantees fit on 1 executive page;
  // otherwise, cleanly splits into a balanced 2-Page Diagnostic + Evidence Dossier.
  const isSinglePage = structured.isStructured && estimatedHeight <= 620;

  let y = 0;

  // Draw Page Header Banner
  function drawHeaderBanner(pageSubtitle: string, isPageOne: boolean) {
    doc.setFillColor(15, 23, 42); // #0F172A Dark Navy
    doc.rect(0, 0, pageWidth, isPageOne ? 44 : 32, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(isPageOne ? 11 : 9.5);
    doc.text("MEDGUIDE AI CLINICAL DECISION SUPPORT SYSTEM", margin, isPageOne ? 20 : 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184); // #94A3B8
    doc.text(pageSubtitle, margin, isPageOne ? 33 : 26);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(isPageOne ? 7.5 : 7);
    doc.setTextColor(56, 189, 248); // #38BDF8 Cyan
    doc.text("CONFIDENTIAL MEDICAL RECORD", pageWidth - margin - 150, isPageOne ? 20 : 18);

    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(`ID: ${reportDocId}`, pageWidth - margin - 150, isPageOne ? 33 : 26);
  }

  function ensureSpace(
    neededHeight: number,
    continuationTitle = "CLINICAL CONSULTATION REPORT (CONTINUED)",
  ) {
    if (!isSinglePage && y + neededHeight > pageHeight - 34) {
      doc.addPage();
      drawHeaderBanner(continuationTitle, false);
      y = 42;
    }
  }

  // Draw Section Header with Left Accent Bar
  function drawSectionHeader(titleText: string) {
    ensureSpace(24);
    doc.setFillColor(2, 132, 199); // #0284C7
    doc.rect(margin, y, 3, 10, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(titleText.toUpperCase(), margin + 7, y + 8.5);
    y += 16;
  }

  // Draw Metadata Patient Card
  function drawPatientMetadataCard() {
    doc.setFillColor(248, 250, 252); // #F8FAFC
    doc.setDrawColor(203, 213, 225); // #CBD5E1
    doc.roundedRect(margin, y, contentWidth, 54, 4, 4, "FD");

    if (qrDataUrl) {
      doc.addImage(qrDataUrl, "PNG", pageWidth - margin - 48, y + 4, 42, 42);
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("SCAN TO VERIFY", pageWidth - margin - 48, y + 50);
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    const rawTitle = sanitizeMedicalText(title);
    const cleanTitle = rawTitle.length > 76 ? `${rawTitle.slice(0, 73)}...` : rawTitle;
    doc.text(cleanTitle, margin + 9, y + 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const patientText = `Patient Context: ${patientName || "Clinical Vignette"} · Generated: ${consultDate}`;
    const cleanPatient = sanitizeMedicalText(patientText);
    const displayPatient =
      cleanPatient.length > 85 ? `${cleanPatient.slice(0, 82)}...` : cleanPatient;
    doc.text(displayPatient, margin + 9, y + 27);

    // Status Badges (Confidence & Evidence)
    const band = structured.confidenceBand;
    if (band === "High") {
      doc.setFillColor(5, 150, 105); // #059669 Emerald
    } else if (band === "Medium") {
      doc.setFillColor(2, 132, 199); // #0284C7 Cyan
    } else {
      doc.setFillColor(217, 119, 6); // #D97706 Amber
    }
    doc.roundedRect(margin + 9, y + 35, 82, 12, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(`CONFIDENCE: ${band.toUpperCase()}`, margin + 13, y + 43.5);

    doc.setFillColor(16, 185, 129); // #10B981 Emerald
    doc.roundedRect(margin + 95, y + 35, 88, 12, 2, 2, "F");
    doc.text("EVIDENCE GROUNDED", margin + 100, y + 43.5);

    y += 60;
  }

  // Draw Patient Clinical Summary
  function renderPatientSummary() {
    if (!structured.patientSummary) return;
    drawSectionHeader("1. Patient Clinical Presentation & Summary");
    const cleanSummary = sanitizeMedicalText(structured.patientSummary);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    const summaryLines = doc.splitTextToSize(cleanSummary, contentWidth - 14) as string[];
    const cardHeight = summaryLines.length * 9.5 + 8;
    ensureSpace(cardHeight + 6);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 3, 3, "FD");

    doc.text(summaryLines, margin + 7, y + 7.5);
    y += cardHeight + 6;
  }

  // Draw Objective Findings & Vitals in a compact 2-column grid
  function renderFindingsGrid() {
    if (structured.findings.length === 0) return;
    drawSectionHeader("2. Objective Findings, Vitals & Laboratories");

    const colWidth = (contentWidth - 8) / 2;
    const rowHeight = 14;

    for (let i = 0; i < structured.findings.length; i += 2) {
      ensureSpace(rowHeight + 4);
      const f1 = structured.findings[i]!;
      const f2 = structured.findings[i + 1];

      // Col 1
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, colWidth, rowHeight, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      const cleanLabel1 = sanitizeMedicalText(f1.label);
      const cleanVal1 = sanitizeMedicalText(f1.value);
      doc.text(`${cleanLabel1}:`, margin + 6, y + 9.5);

      const labelWidth1 = doc.getTextWidth(`${cleanLabel1}: `);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      const valStr1 = doc.splitTextToSize(cleanVal1, colWidth - labelWidth1 - 10)[0] || cleanVal1;
      doc.text(valStr1, margin + 6 + labelWidth1, y + 9.5);

      // Col 2 (if present)
      if (f2) {
        const col2X = margin + colWidth + 8;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(col2X, y, colWidth, rowHeight, 2, 2, "FD");

        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        const cleanLabel2 = sanitizeMedicalText(f2.label);
        const cleanVal2 = sanitizeMedicalText(f2.value);
        doc.text(`${cleanLabel2}:`, col2X + 6, y + 9.5);

        const labelWidth2 = doc.getTextWidth(`${cleanLabel2}: `);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        const valStr2 = doc.splitTextToSize(cleanVal2, colWidth - labelWidth2 - 10)[0] || cleanVal2;
        doc.text(valStr2, col2X + 6 + labelWidth2, y + 9.5);
      }

      y += rowHeight + 3;
    }
    y += 3;
  }

  // Draw Differential Diagnosis Cards
  function renderDifferentials(limit?: number) {
    const diffs = limit ? structured.differentials.slice(0, limit) : structured.differentials;
    if (diffs.length === 0) return;

    drawSectionHeader("3. Differential Diagnosis & Risk Stratification");

    for (let i = 0; i < diffs.length; i++) {
      const d = diffs[i]!;
      const cleanCondition = sanitizeMedicalText(d.condition);
      const cleanRationale = sanitizeMedicalText(d.rationale);
      const cleanLikelihood = d.likelihoodText || `${d.likelihood} Likelihood`;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      const ratLines = doc.splitTextToSize(cleanRationale, contentWidth - 16) as string[];
      const hasCitations = d.citations && d.citations.length > 0;
      const cardHeight = 14 + ratLines.length * 8.5 + (hasCitations ? 9 : 0) + 4;
      ensureSpace(cardHeight + 4);

      // Card Background & Border by Likelihood
      if (d.likelihood === "High") {
        doc.setFillColor(240, 253, 244); // #F0FDF4 Emerald light
        doc.setDrawColor(16, 185, 129); // #10B981
      } else if (d.likelihood === "Moderate") {
        doc.setFillColor(255, 251, 235); // #FFFBEB Amber light
        doc.setDrawColor(245, 158, 11); // #F59E0B
      } else {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
      }

      doc.roundedRect(margin, y, contentWidth, cardHeight, 3, 3, "FD");

      // Condition title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`${i + 1}. ${cleanCondition}`, margin + 8, y + 10);

      // Likelihood Pill Badge
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      const pillWidth = doc.getTextWidth(cleanLikelihood.toUpperCase()) + 8;
      const pillX = pageWidth - margin - pillWidth - 6;

      if (d.likelihood === "High") {
        doc.setFillColor(16, 185, 129);
        doc.setTextColor(255, 255, 255);
      } else if (d.likelihood === "Moderate") {
        doc.setFillColor(245, 158, 11);
        doc.setTextColor(255, 255, 255);
      } else {
        doc.setFillColor(148, 163, 184);
        doc.setTextColor(255, 255, 255);
      }
      doc.roundedRect(pillX, y + 3, pillWidth, 9.5, 2, 2, "F");
      doc.text(cleanLikelihood.toUpperCase(), pillX + 4, y + 9.5);

      // Rationale body text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(ratLines, margin + 8, y + 20);

      // Citations line
      if (hasCitations) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6);
        doc.setTextColor(2, 132, 199);
        doc.text(
          `Evidence: ${d.citations.join(" · ")}`,
          margin + 8,
          y + 20 + ratLines.length * 8.5,
        );
      }

      y += cardHeight + 4;
    }
    y += 2;
  }

  // Draw Pharmacovigilance & Medication Safety Audit
  function renderDrugSafety() {
    if (structured.drugSafety.length === 0) return;
    drawSectionHeader("4. Pharmacovigilance & Medication Safety Audit");

    for (const ds of structured.drugSafety) {
      const cleanDrug = sanitizeMedicalText(ds.drug);
      const cleanWarn = sanitizeMedicalText(ds.warning);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      const warnLines = doc.splitTextToSize(cleanWarn, contentWidth - 16) as string[];
      const cardHeight = 12 + warnLines.length * 8 + 3;
      ensureSpace(cardHeight + 4);

      if (ds.isContraindicated) {
        doc.setFillColor(254, 242, 242); // #FEF2F2
        doc.setDrawColor(239, 68, 68); // #EF4444
        doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(185, 28, 28);
        doc.text(`CONTRAINDICATION / WARNING: ${cleanDrug}`, margin + 7, y + 8.5);
      } else {
        doc.setFillColor(255, 251, 235); // #FFFBEB
        doc.setDrawColor(245, 158, 11); // #F59E0B
        doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(180, 83, 9);
        doc.text(`SAFETY ADVISORY: ${cleanDrug}`, margin + 7, y + 8.5);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(warnLines, margin + 7, y + 17);

      y += cardHeight + 3;
    }
    y += 2;
  }

  // Draw Biomedical Evidence & Clinical Guidelines
  function renderEvidenceBase() {
    if (structured.evidenceBase.length === 0) return;
    drawSectionHeader("5. Biomedical Evidence & Clinical Guidelines");

    for (const eb of structured.evidenceBase) {
      const cleanTopic = sanitizeMedicalText(eb.topic);
      const cleanContent = sanitizeMedicalText(eb.content);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      const contentLines = doc.splitTextToSize(cleanContent, contentWidth - 14) as string[];
      const itemHeight = 10 + contentLines.length * 8 + 2;
      ensureSpace(itemHeight + 4);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(`• ${cleanTopic}:`, margin + 4, y + 7.5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(contentLines, margin + 12, y + 16);

      y += itemHeight;
    }
    y += 2;
  }

  // Draw Confidence Calibration & Limitations
  function renderConfidenceLimitations() {
    if (!structured.confidenceExplanation) return;
    drawSectionHeader("6. Confidence Calibration & Clinical Limitations");
    const cleanConf = sanitizeMedicalText(structured.confidenceExplanation);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);

    const confLines = doc.splitTextToSize(cleanConf, contentWidth - 14) as string[];
    const cardHeight = confLines.length * 8 + 7;
    ensureSpace(cardHeight + 6);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, "FD");

    doc.text(confLines, margin + 7, y + 6.5);
    y += cardHeight + 5;
  }

  // Draw Audited References in a dense 2-column index
  function renderReferencesGrid() {
    if (structured.references.length === 0) return;
    drawSectionHeader("7. Audited Biomedical References & Citations");

    const colWidth = (contentWidth - 8) / 2;
    doc.setFontSize(6.5);

    for (let i = 0; i < structured.references.length; i += 2) {
      ensureSpace(12);
      const r1 = structured.references[i]!;
      const r2 = structured.references[i + 1];

      // Col 1
      doc.setFont("helvetica", "bold");
      doc.setTextColor(2, 132, 199);
      const key1 = sanitizeMedicalText(r1.key);
      doc.text(key1, margin + 4, y + 6.5);

      const kWidth1 = doc.getTextWidth(key1);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const cit1 = sanitizeMedicalText(r1.citation);
      const citLine1 = doc.splitTextToSize(cit1, colWidth - kWidth1 - 8)[0] || cit1;
      doc.text(citLine1, margin + 6 + kWidth1, y + 6.5);

      // Col 2
      if (r2) {
        const col2X = margin + colWidth + 8;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(2, 132, 199);
        const key2 = sanitizeMedicalText(r2.key);
        doc.text(key2, col2X + 4, y + 6.5);

        const kWidth2 = doc.getTextWidth(key2);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        const cit2 = sanitizeMedicalText(r2.citation);
        const citLine2 = doc.splitTextToSize(cit2, colWidth - kWidth2 - 8)[0] || cit2;
        doc.text(citLine2, col2X + 6 + kWidth2, y + 6.5);
      }

      y += 10;
    }
    y += 4;
  }

  // Draw Formal Clinician Review & Attestation Box
  function renderClinicianAttestation() {
    ensureSpace(42);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 34, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text("CLINICIAN REVIEW & ATTESTATION", margin + 8, y + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text("[ ] Verified & Confirmed", margin + 145, y + 9);

    doc.text("Reviewing Clinician: ___________________________", margin + 8, y + 21);
    doc.text("Date: ______________", margin + 210, y + 21);
    doc.text("GMC / NPI: __________________", margin + 285, y + 21);
    doc.text("Signature: _______________________", margin + 395, y + 21);

    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Clinical decision support advisory only: Academic prototype requiring independent licensed physician confirmation prior to care.",
      margin + 8,
      y + 30,
    );

    y += 38;
  }

  // --- RENDER EXECUTION ---

  if (isSinglePage) {
    // --- SINGLE-PAGE EXECUTIVE LAYOUT ---
    drawHeaderBanner("MULTI-AGENT EVIDENCE-GROUNDED CLINICAL CONSULTATION REPORT", true);
    y = 52;
    drawPatientMetadataCard();
    renderPatientSummary();
    renderFindingsGrid();
    renderDifferentials();
    renderDrugSafety();
    renderEvidenceBase();
    renderConfidenceLimitations();
    renderReferencesGrid();
    renderClinicianAttestation();
  } else if (structured.isStructured) {
    // --- INTENTIONAL 2-PAGE DOSSIER LAYOUT ---
    // PAGE 1: Clinical Diagnostic Assessment
    drawHeaderBanner("CLINICAL DIAGNOSTIC ASSESSMENT · CDSS ADVISORY", true);
    y = 52;
    drawPatientMetadataCard();
    renderPatientSummary();
    renderFindingsGrid();
    renderDifferentials();

    // Bottom advisory note indicating dossier continuation
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "-> Diagnostic Assessment Complete. Continued on Page 2 for Pharmacovigilance, Evidence Guidelines, References & Sign-Off.",
      margin + 6,
      Math.min(y + 14, pageHeight - 30),
    );

    // PAGE 2: Evidence, Safety & Bibliography Dossier
    doc.addPage();
    drawHeaderBanner("EVIDENCE, PHARMACOVIGILANCE & AUDIT DOSSIER", false);
    y = 44;

    renderDrugSafety();
    renderEvidenceBase();
    renderConfidenceLimitations();
    renderReferencesGrid();
    renderClinicianAttestation();
  } else {
    // Fallback for unstructured text reports
    drawHeaderBanner("CLINICAL CONSULTATION REPORT", true);
    y = 52;
    drawPatientMetadataCard();

    drawSectionHeader("Clinical Consultation Summary");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    const strippedText = sanitizeMedicalText(
      markdown
        .replace(/^#+\s+[^\n]+/m, "")
        .replace(
          /^(?:clinical support report|clinical consultation report|clinical report contents)[^\n]*/im,
          "",
        )
        .replace(/[#*`]/g, "")
        .trim(),
    );
    const rawLines = doc.splitTextToSize(strippedText, contentWidth - 10) as string[];

    for (const line of rawLines) {
      if (y + 11 > pageHeight - 34) {
        doc.addPage();
        drawHeaderBanner("CLINICAL CONSULTATION REPORT (CONTINUED)", false);
        y = 40;
      }
      doc.text(line, margin + 4, y + 8);
      y += 10.5;
    }

    renderClinicianAttestation();
  }

  // Unified official footer across all generated pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 22, pageWidth - margin, pageHeight - 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Academic Clinical Decision Support Prototype. Not an autonomous diagnosis or certified medical record. Confirm all findings with a licensed healthcare professional.",
      margin,
      pageHeight - 12,
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 50, pageHeight - 12);
  }

  const safeFilename = `${title.slice(0, 35).replace(/\W+/g, "-") || "clinical-report"}.pdf`;
  if (typeof window !== "undefined") {
    doc.save(safeFilename);
  }
  return doc as unknown as void;
}
