/**
 * Hospital-Grade Clinical Report PDF Generator
 * Generates official, vector clinical consultation documents with QR codes,
 * evidence badges, drug safety callouts, and medical legal attestation.
 */
import jsPDF from "jspdf";
import QRCode from "qrcode";

import {
  type StructuredClinicalReport,
  parseClinicalReport,
} from "./clinical-report-parser";
import { DISCLAIMER } from "@/lib/agents/types";

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
function sanitizeMedicalText(text: string): string {
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
    .replace(/[^\x00-\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateClinicalReportPdf(options: PdfExportOptions): Promise<void> {
  const { title, patientName, markdown, createdAt, reportId } = options;
  const structured: StructuredClinicalReport = parseClinicalReport(markdown, title);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89
  const margin = 36;
  const contentWidth = pageWidth - margin * 2; // 523.28

  let y = 0;
  let pageCount = 1;

  // Generate QR Code data URL for verification
  const consultDate = new Date(createdAt).toLocaleString();
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(
      `MEDGUIDE AI VERIFICATION\nReport: ${title.slice(0, 50)}\nDate: ${consultDate}\nVerification ID: ${reportId || "CDSS-VERIFIED"}`,
      { margin: 1, width: 140 },
    );
  } catch {
    /* Optional QR */
  }

  // Draw Header Banner
  function drawPageHeader(isFirstPage: boolean) {
    if (isFirstPage) {
      doc.setFillColor(15, 23, 42); // #0F172A Dark Navy
      doc.rect(0, 0, pageWidth, 44, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("MEDGUIDE AI CLINICAL DECISION SUPPORT SYSTEM", margin, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184); // #94A3B8
      doc.text("MULTI-AGENT EVIDENCE-GROUNDED CLINICAL CONSULTATION REPORT", margin, 33);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(56, 189, 248); // #38BDF8
      doc.text("CONFIDENTIAL MEDICAL RECORD", pageWidth - margin - 150, 20);

      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text(`ID: ${reportId ? reportId.slice(0, 14) : "CDSS-VERIFIED"}`, pageWidth - margin - 150, 33);
    } else {
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 30, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("MEDGUIDE AI CLINICAL DECISION SUPPORT SYSTEM", margin, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("CONSULTATION REPORT (CONTINUED)", pageWidth - margin - 150, 18);
    }
  }

  function checkPageBreak(requiredHeight: number) {
    if (y + requiredHeight > pageHeight - 38) {
      doc.addPage();
      pageCount++;
      drawPageHeader(false);
      y = 44;
    }
  }

  // Setup first page
  drawPageHeader(true);
  y = 52;

  // 1. Metadata Patient Card
  doc.setFillColor(248, 250, 252); // #F8FAFC
  doc.setDrawColor(203, 213, 225); // #CBD5E1
  doc.roundedRect(margin, y, contentWidth, 58, 4, 4, "FD");

  // QR Code on right
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", pageWidth - margin - 50, y + 5, 42, 42);
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("SCAN TO VERIFY", pageWidth - margin - 50, y + 52);
  }

  // Title & Metadata text
  const maxTitleWidth = contentWidth - 65;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  const cleanTitle = sanitizeMedicalText(title).slice(0, 78);
  doc.text(cleanTitle, margin + 10, y + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const patientText = `Patient: ${patientName || "Clinical Vignette"} · Generated: ${consultDate}`;
  doc.text(sanitizeMedicalText(patientText), margin + 10, y + 29);

  // Status Badges (Confidence & Evidence)
  const band = structured.confidenceBand;
  if (band === "High") {
    doc.setFillColor(5, 150, 105); // #059669 Emerald
  } else if (band === "Medium") {
    doc.setFillColor(2, 132, 199); // #0284C7 Cyan
  } else {
    doc.setFillColor(217, 119, 6); // #D97706 Amber
  }
  doc.roundedRect(margin + 10, y + 37, 86, 13, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text(`CONFIDENCE: ${band.toUpperCase()}`, margin + 14, y + 46);

  doc.setFillColor(16, 185, 129); // #10B981 Emerald
  doc.roundedRect(margin + 102, y + 37, 88, 13, 2, 2, "F");
  doc.text("EVIDENCE GROUNDED", margin + 107, y + 46);

  y += 66;

  // Helper for Section Titles with Left Accent Bar
  function drawSectionHeader(titleText: string) {
    checkPageBreak(24);
    // Left Cyan Accent
    doc.setFillColor(2, 132, 199); // #0284C7
    doc.rect(margin, y, 3, 11, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(titleText.toUpperCase(), margin + 8, y + 9);
    y += 15;
  }

  // 1. Patient Clinical Summary
  if (structured.patientSummary) {
    drawSectionHeader("1. Patient Clinical Presentation & Summary");
    const cleanSummary = sanitizeMedicalText(structured.patientSummary);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    const summaryLines = doc.splitTextToSize(cleanSummary, contentWidth - 14) as string[];
    const cardHeight = summaryLines.length * 10.5 + 10;
    checkPageBreak(cardHeight);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 3, 3, "FD");

    doc.text(summaryLines, margin + 7, y + 8);
    y += cardHeight + 8;
  }

  // 2. Objective Findings & Vitals
  if (structured.findings.length > 0) {
    drawSectionHeader("2. Objective Findings, Vitals & Laboratories");
    for (const f of structured.findings) {
      const cleanLabel = sanitizeMedicalText(f.label);
      const cleanVal = sanitizeMedicalText(f.value);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const labelText = `• ${cleanLabel}: `;
      const labelWidth = doc.getTextWidth(labelText);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);

      const valLines = (doc.splitTextToSize(cleanVal, contentWidth - labelWidth - 10) as string[]) || [];
      const itemHeight = Math.max(12, valLines.length * 9.5 + 3);
      checkPageBreak(itemHeight);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text(labelText, margin + 4, y + 8);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      if (valLines.length > 0 && typeof valLines[0] === "string") {
        doc.text(valLines[0], margin + 4 + labelWidth, y + 8);
        for (let i = 1; i < valLines.length; i++) {
          const nextLine = valLines[i];
          if (typeof nextLine === "string") {
            doc.text(nextLine, margin + 8 + labelWidth, y + 8 + i * 9.5);
          }
        }
      }
      y += itemHeight;
    }
    y += 6;
  }

  // 3. Differential Diagnosis & Risk Stratification
  if (structured.differentials.length > 0) {
    drawSectionHeader("3. Differential Diagnosis & Risk Stratification");
    for (let i = 0; i < structured.differentials.length; i++) {
      const d = structured.differentials[i]!;
      const cleanCondition = sanitizeMedicalText(d.condition);
      const cleanRationale = sanitizeMedicalText(d.rationale);
      const cleanLikelihood = d.likelihoodText || `${d.likelihood} Likelihood`;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      const ratLines = doc.splitTextToSize(cleanRationale, contentWidth - 16) as string[];
      const hasCitations = d.citations && d.citations.length > 0;
      const cardHeight = 16 + ratLines.length * 10 + (hasCitations ? 11 : 0) + 6;

      checkPageBreak(cardHeight + 4);

      // Card Background & Border by Likelihood
      if (d.likelihood === "High") {
        doc.setFillColor(240, 253, 244); // #F0FDF4 Emerald light
        doc.setDrawColor(16, 185, 129); // #10B981
        doc.setTextColor(5, 150, 105);
      } else if (d.likelihood === "Moderate") {
        doc.setFillColor(255, 251, 235); // #FFFBEB Amber light
        doc.setDrawColor(245, 158, 11); // #F59E0B
        doc.setTextColor(217, 119, 6);
      } else {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.setTextColor(71, 85, 105);
      }

      // Draw Complete Enclosing Card
      doc.roundedRect(margin, y, contentWidth, cardHeight, 3, 3, "FD");

      // Condition title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${i + 1}. ${cleanCondition}`, margin + 8, y + 11);

      // Likelihood Pill Badge
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      const pillWidth = doc.getTextWidth(cleanLikelihood.toUpperCase()) + 10;
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
      doc.roundedRect(pillX, y + 3, pillWidth, 11, 2, 2, "F");
      doc.text(cleanLikelihood.toUpperCase(), pillX + 5, y + 11);

      // Rationale body text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(ratLines, margin + 8, y + 23);

      // Citations line
      if (hasCitations) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(2, 132, 199);
        doc.text(`Evidence: ${d.citations.join(" · ")}`, margin + 8, y + 23 + ratLines.length * 10);
      }

      y += cardHeight + 5;
    }
    y += 4;
  }

  // 4. Drug Safety & Pharmacovigilance
  if (structured.drugSafety.length > 0) {
    drawSectionHeader("4. Pharmacovigilance & Medication Safety Audit");
    for (const ds of structured.drugSafety) {
      const cleanDrug = sanitizeMedicalText(ds.drug);
      const cleanWarn = sanitizeMedicalText(ds.warning);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      const warnLines = doc.splitTextToSize(cleanWarn, contentWidth - 18) as string[];
      const cardHeight = 14 + warnLines.length * 9.5 + 4;

      checkPageBreak(cardHeight + 4);

      if (ds.isContraindicated) {
        doc.setFillColor(254, 242, 242); // #FEF2F2
        doc.setDrawColor(239, 68, 68); // #EF4444
        doc.roundedRect(margin, y, contentWidth, cardHeight, 3, 3, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(185, 28, 28);
        doc.text(`CONTRAINDICATION / WARNING: ${cleanDrug}`, margin + 8, y + 10);
      } else {
        doc.setFillColor(255, 251, 235); // #FFFBEB
        doc.setDrawColor(245, 158, 11); // #F59E0B
        doc.roundedRect(margin, y, contentWidth, cardHeight, 3, 3, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(180, 83, 9);
        doc.text(`SAFETY ADVISORY: ${cleanDrug}`, margin + 8, y + 10);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(warnLines, margin + 8, y + 21);

      y += cardHeight + 4;
    }
    y += 4;
  }

  // 5. Evidence Base & Clinical Guidelines
  if (structured.evidenceBase.length > 0) {
    drawSectionHeader("5. Biomedical Evidence & Clinical Guidelines");
    for (const eb of structured.evidenceBase) {
      const cleanTopic = sanitizeMedicalText(eb.topic);
      const cleanContent = sanitizeMedicalText(eb.content);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      const contentLines = doc.splitTextToSize(cleanContent, contentWidth - 14) as string[];
      const itemHeight = 11 + contentLines.length * 9.5 + 3;

      checkPageBreak(itemHeight);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`• ${cleanTopic}:`, margin + 4, y + 8);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(contentLines, margin + 12, y + 18);

      y += itemHeight;
    }
    y += 4;
  }

  // 6. Confidence Calibration & Caveats
  if (structured.confidenceExplanation) {
    drawSectionHeader("6. Confidence Calibration & Clinical Limitations");
    const cleanConf = sanitizeMedicalText(structured.confidenceExplanation);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);

    const confLines = doc.splitTextToSize(cleanConf, contentWidth - 14) as string[];
    const cardHeight = confLines.length * 9.5 + 8;

    checkPageBreak(cardHeight);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 3, 3, "FD");

    doc.text(confLines, margin + 7, y + 7);
    y += cardHeight + 6;
  }

  // 7. References & Citation Provenance
  if (structured.references.length > 0) {
    drawSectionHeader("7. Audited Biomedical References & Citations");

    // Compact reference printing
    for (const r of structured.references) {
      const cleanKey = sanitizeMedicalText(r.key);
      const cleanCit = sanitizeMedicalText(r.citation);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      const keyWidth = doc.getTextWidth(cleanKey);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      const citLines = (doc.splitTextToSize(cleanCit, contentWidth - keyWidth - 12) as string[]) || [];
      const itemHeight = Math.max(10, citLines.length * 8.5 + 2);

      checkPageBreak(itemHeight);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(2, 132, 199);
      doc.text(cleanKey, margin + 4, y + 7);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      if (citLines.length > 0 && typeof citLines[0] === "string") {
        doc.text(citLines[0], margin + 8 + keyWidth, y + 7);
        for (let k = 1; k < citLines.length; k++) {
          const nextLine = citLines[k];
          if (typeof nextLine === "string") {
            doc.text(nextLine, margin + 8 + keyWidth, y + 7 + k * 8.5);
          }
        }
      }
      y += itemHeight;
    }
    y += 6;
  }

  // Fallback for unstructured text (formatted cleanly without overlapping)
  if (!structured.isStructured) {
    drawSectionHeader("Clinical Consultation Summary");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    const strippedText = sanitizeMedicalText(markdown.replace(/^#\s+[^\n]+/m, "").replace(/[#*`]/g, ""));
    const rawLines = doc.splitTextToSize(strippedText, contentWidth - 10) as string[];

    for (const line of rawLines) {
      checkPageBreak(11);
      doc.text(line, margin + 4, y + 8);
      y += 11;
    }
  }

  // Page Footers across all generated pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Separator line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 24, pageWidth - margin, pageHeight - 24);

    // Disclaimer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Decision support only: not an autonomous diagnosis. Confirm all clinical decisions with a licensed medical provider.",
      margin,
      pageHeight - 14,
    );

    // Page number
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 46, pageHeight - 14);
  }

  const safeFilename = `${title.slice(0, 35).replace(/\W+/g, "-") || "clinical-report"}.pdf`;
  doc.save(safeFilename);
}
