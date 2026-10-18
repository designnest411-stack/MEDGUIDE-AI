import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  scoreExplainabilityRubric,
  computeMeanAndSD,
  computePairedTTest,
  type BenchmarkVignette,
} from "../eval/evaluate_benchmark";

describe("Benchmark Evaluation & Explainability Rubric", () => {
  it("scores explainability rubric with all 5 criteria present (100%)", () => {
    const score = scoreExplainabilityRubric({
      hasAttributedCitations: true,
      isSourceConsistent: true,
      hasFactorBalance: true,
      hasContradictoryEvidenceVisibility: true,
      hasSafetyTraceability: true,
    });
    expect(score).toBe(100);
  });

  it("scores explainability rubric with partial criteria (40%)", () => {
    const score = scoreExplainabilityRubric({
      hasAttributedCitations: true,
      isSourceConsistent: true,
      hasFactorBalance: false,
      hasContradictoryEvidenceVisibility: false,
      hasSafetyTraceability: false,
    });
    expect(score).toBe(40);
  });

  it("computes accurate mean, standard deviation, and 95% confidence intervals", () => {
    const sample = [10, 20, 30, 40, 50];
    const stats = computeMeanAndSD(sample);
    expect(stats.mean).toBe(30);
    expect(stats.sd).toBeCloseTo(15.81, 1);
    expect(stats.ci95[0]).toBeLessThan(stats.mean);
    expect(stats.ci95[1]).toBeGreaterThan(stats.mean);
  });

  it("computes paired Student's t-test with statistically significant separation", () => {
    const baseline = [20, 22, 19, 21, 23, 20, 18, 24, 21, 22];
    const proposed = [90, 92, 89, 91, 93, 90, 88, 94, 91, 92];
    const result = computePairedTTest(proposed, baseline);
    expect(result.tStatistic).toBeGreaterThan(50);
    expect(result.degreesOfFreedom).toBe(9);
    expect(result.pValue).toBeLessThan(0.001);
  });

  it("validates integrity of all 50 clinical vignettes in the benchmark suite", () => {
    const datasetPath = path.resolve(__dirname, "../eval/benchmark_vignettes.json");
    expect(fs.existsSync(datasetPath)).toBe(true);

    const raw = fs.readFileSync(datasetPath, "utf-8");
    const vignettes = JSON.parse(raw) as BenchmarkVignette[];
    expect(vignettes.length).toBe(50);

    const validDomains = new Set([
      "Cardiology",
      "Pulmonology",
      "Neurology",
      "Nephrology / Endo",
      "Infectious / Pharm",
    ]);

    for (const v of vignettes) {
      expect(v.id).toBeTruthy();
      expect(validDomains.has(v.domain)).toBe(true);
      expect(v.title.length).toBeGreaterThan(5);
      expect(v.presentation.length).toBeGreaterThan(20);
      expect(v.referenceDifferentials.length).toBeGreaterThanOrEqual(1);
      expect(v.expectedCitations.length).toBeGreaterThanOrEqual(1);
    }
  });
});
