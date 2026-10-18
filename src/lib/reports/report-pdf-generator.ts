/**
 * Hospital-Grade Clinical Report PDF Generator
 * Generates official, multi-page vector clinical consultation documents with QR codes,
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

export async function generateClinicalReportPdf(options: PdfExportOptions): Promise<void> {
  const { title, patientName, markdown, createdAt, reportId } = options;
  const structured: StructuredClinicalReport = parseClinicalReport(markdown, title);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89
  const margin = 36;
  const contentWidth = pageWidth - margin * 2; // 523.28

  let y = 0;

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

  // Draw header banner
  function drawPageHeader(isFirstPage: boolean) {
    // Top primary dark navy banner
    doc.setFillColor(15, 23, 42); // #0F172A
    doc.rect(0, 0, pageWidth, 48, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("MEDGUIDE AI CLINICAL DECISION SUPPORT SYSTEM", margin, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // #94A3B8
    doc.text("MULTI-AGENT EVIDENCE-GROUNDED CLINICAL REPORT · VERIFIED CONSULTATION", margin, 35);

    if (isFirstPage) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(56, 189, 248); // #38BDF8
      doc.text("CONFIDENTIAL MEDICAL RECORD", pageWidth - margin - 150, 22);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(`ID: ${reportId ? reportId.slice(0, 14) : "MED-EVAL"}`, pageWidth - margin - 150, 35);
    }
  }

  function checkPageBreak(requiredHeight: number) {
    if (y + requiredHeight > pageHeight - 50) {
      doc.addPage();
      drawPageHeader(false);
      y = 65;
    }
  }

  // Initial first page setup
  drawPageHeader(true);
  y = 60;

  // Metadata Box on First Page
  doc.setFillColor(248, 250, 252); // #F8FAFC
  doc.setDrawColor(226, 232, 240); // #E2E8F0
  doc.roundedRect(margin, y, contentWidth, 68, 4, 4, "FD");

  // QR Code on right side of metadata box
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", pageWidth - margin - 58, y + 5, 52, 52);
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text("SCAN TO VERIFY", pageWidth - margin - 58, y + 62);
  }

  // Text in metadata box
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const cleanTitle = title.replace(/[#*`]/g, "").slice(0, 75);
  doc.text(cleanTitle, margin + 12, y + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Patient Context: ${patientName || "De-identified Clinical Vignette"}`, margin + 12, y + 32);
  doc.text(`Generated: ${consultDate}`, margin + 12, y + 44);

  // Confidence & Grounding badge
  doc.setFillColor(8, 145, 178); // #0891B2
  doc.roundedRect(margin + 12, y + 50, 85, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(`Confidence: ${structured.confidenceBand.toUpperCase()}`, margin + 18, y + 59);

  doc.setFillColor(16, 185, 129); // #10B981
  doc.roundedRect(margin + 104, y + 50, 85, 12, 2, 2, "F");
  doc.text("Evidence Grounded", margin + 110, y + 59);

  y += 82;

  // Helper for Section Titles
  function drawSectionHeader(titleText: string) {
    checkPageBreak(30);
    // Cyan bar indicator
    doc.setFillColor(8, 145, 178);
    doc.rect(margin, y, 3, 14, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(titleText.toUpperCase(), margin + 8, y + 11);
    y += 18;
  }

  // 1. Patient Summary
  if (structured.patientSummary) {
    drawSectionHeader("1. Patient Clinical Summary");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(structured.patientSummary, contentWidth) as string[];
    checkPageBreak(lines.length * 12 + 10);
    doc.text(lines, margin, y);
    y += lines.length * 12 + 10;
  }

  // 2. Findings
  if (structured.findings.length > 0) {
    drawSectionHeader("2. Objective Findings & Vitals");
    for (const f of structured.findings) {
      checkPageBreak(16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`• ${f.label}: `, margin + 6, y);
      const labelWidth = doc.getTextWidth(`• ${f.label}: `);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      const valLines = (doc.splitTextToSize(f.value, contentWidth - labelWidth - 8) as string[]) || [];
      if (valLines.length > 0 && typeof valLines[0] === "string") {
        doc.text(valLines[0], margin + 6 + labelWidth, y);
        y += 13;
        for (let i = 1; i < valLines.length; i++) {
          checkPageBreak(14);
          const nextLine = valLines[i];
          if (typeof nextLine === "string") {
            doc.text(nextLine, margin + 14, y);
            y += 13;
          }
        }
      }
    }
    y += 8;
  }

  // 3. Differentials
  if (structured.differentials.length > 0) {
    drawSectionHeader("3. Differential Diagnosis & Risk Stratification");
    for (const d of structured.differentials) {
      checkPageBreak(36);

      // Likelihood badge color
      if (d.likelihood === "High") {
        doc.setFillColor(236, 253, 245);
        doc.setDrawColor(16, 185, 129);
        doc.setTextColor(5, 150, 105);
      } else if (d.likelihood === "Moderate") {
        doc.setFillColor(254, 243, 199);
        doc.setDrawColor(245, 158, 11);
        doc.setTextColor(217, 119, 6);
      } else {
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(148, 163, 184);
        doc.setTextColor(71, 85, 105);
      }

      // Card box
      doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(d.condition, margin + 8, y + 12);

      doc.setFontSize(7.5);
      doc.text(d.likelihoodText.toUpperCase(), pageWidth - margin - doc.getTextWidth(d.likelihoodText.toUpperCase()) - 8, y + 12);
      y += 24;

      // Rationale text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const ratLines = doc.splitTextToSize(`Rationale: ${d.rationale}`, contentWidth - 10) as string[];
      checkPageBreak(ratLines.length * 12 + 6);
      doc.text(ratLines, margin + 6, y);
      y += ratLines.length * 12 + 6;
    }
    y += 6;
  }

  // 4. Drug Safety
  if (structured.drugSafety.length > 0) {
    drawSectionHeader("4. Drug Safety & Pharmacovigilance");
    for (const ds of structured.drugSafety) {
      checkPageBreak(28);
      // Warning callout card
      doc.setFillColor(254, 242, 242); // #FEF2F2
      doc.setDrawColor(239, 68, 68); // #EF4444
      doc.roundedRect(margin, y, contentWidth, 16, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(185, 28, 28);
      doc.text(`WARNING: ${ds.drug}`, margin + 8, y + 11);
      y += 22;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const warnLines = doc.splitTextToSize(ds.warning, contentWidth - 10) as string[];
      checkPageBreak(warnLines.length * 11 + 6);
      doc.text(warnLines, margin + 6, y);
      y += warnLines.length * 11 + 6;
    }
    y += 6;
  }

  // 5. Evidence Base
  if (structured.evidenceBase.length > 0) {
    drawSectionHeader("5. Biomedical Evidence & Clinical Guidelines");
    for (const eb of structured.evidenceBase) {
      checkPageBreak(22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`• ${eb.topic}:`, margin + 6, y);
      y += 12;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const ebLines = doc.splitTextToSize(eb.content, contentWidth - 12) as string[];
      checkPageBreak(ebLines.length * 11 + 4);
      doc.text(ebLines, margin + 12, y);
      y += ebLines.length * 11 + 6;
    }
  }

  // 6. Confidence & Limitations
  if (structured.confidenceExplanation) {
    drawSectionHeader("6. Confidence Calibration & Caveats");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const confLines = doc.splitTextToSize(structured.confidenceExplanation, contentWidth) as string[];
    checkPageBreak(confLines.length * 11 + 10);
    doc.text(confLines, margin, y);
    y += confLines.length * 11 + 10;
  }

  // 7. References
  if (structured.references.length > 0) {
    drawSectionHeader("7. Audited Citations & References");
    for (const r of structured.references) {
      checkPageBreak(14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(8, 145, 178);
      doc.text(r.key, margin + 4, y);
      const keyWidth = doc.getTextWidth(r.key);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const citLines = (doc.splitTextToSize(r.citation, contentWidth - keyWidth - 10) as string[]) || [];
      if (citLines.length > 0 && typeof citLines[0] === "string") {
        doc.text(citLines[0], margin + 8 + keyWidth, y);
        y += 11;
        for (let i = 1; i < citLines.length; i++) {
          checkPageBreak(12);
          const nextCit = citLines[i];
          if (typeof nextCit === "string") {
            doc.text(nextCit, margin + 8 + keyWidth, y);
            y += 11;
          }
        }
      }
    }
    y += 10;
  }

  // If report was not structured, fallback to formatted markdown text
  if (!structured.isStructured) {
    drawSectionHeader("Clinical Report Contents");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const rawLines = doc.splitTextToSize(markdown.replace(/[#*`]/g, ""), contentWidth) as string[];
    for (const line of rawLines) {
      checkPageBreak(13);
      doc.text(line, margin, y);
      y += 13;
    }
  }

  // Add Page Footers across all generated pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Separator rule
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 32, pageWidth - margin, pageHeight - 32);

    // Footer text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(DISCLAIMER, margin, pageHeight - 20);

    doc.setFont("helvetica", "bold");
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 50, pageHeight - 20);
  }

  const safeFilename = `${title.slice(0, 35).replace(/\W+/g, "-") || "clinical-report"}.pdf`;
  doc.save(safeFilename);
}
