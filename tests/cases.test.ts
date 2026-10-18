import { describe, it, expect } from "vitest";
import { CASE_LIBRARY, rankCases } from "@/lib/medical/cases";

describe("Case Similarity Agent & Case Library", () => {
  it("should have at least 24 comprehensive peer-reviewed cases in CASE_LIBRARY", () => {
    expect(CASE_LIBRARY.length).toBeGreaterThanOrEqual(24);
  });

  it("every case should contain all mandatory clinical metadata", () => {
    for (const c of CASE_LIBRARY) {
      expect(c.id).toBeDefined();
      expect(typeof c.id).toBe("string");
      expect(c.title).toBeTruthy();
      expect(c.age).toBeGreaterThan(0);
      expect(["M", "F"]).toContain(c.sex);
      expect(c.presentation).toBeTruthy();
      expect(c.diagnosis).toBeTruthy();
      expect(c.treatment).toBeTruthy();
      expect(c.outcome).toBeTruthy();
      expect(Array.isArray(c.tags)).toBe(true);
      expect(c.tags.length).toBeGreaterThanOrEqual(3);
    }
  });

  describe("rankCases", () => {
    it("should return cases with 0 score for empty query", () => {
      const results = rankCases("");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.score).toBe(0);
    });

    it("should rank STEMI / ACS case at top for acute crushing chest pain presentation", () => {
      const query = "acute crushing chest pain radiating to jaw diaphoresis stemi";
      const results = rankCases(query, 3);
      expect(results.length).toBe(3);
      expect(results[0]?.diagnosis.toLowerCase()).toContain("stemi");
      expect((results[0]?.score ?? 0)).toBeGreaterThan(0.5);
    });

    it("should rank PE case top for sudden pleuritic chest pain post-flight", () => {
      const query = "sudden pleuritic chest pain dyspnoea travel flight apixaban";
      const results = rankCases(query, 3);
      expect(results[0]?.tags).toContain("pulmonary embolism");
      expect((results[0]?.score ?? 0)).toBeGreaterThan(0.4);
    });

    it("should damp confidence for single-word queries to avoid misleading 100% scores", () => {
      const oneWord = rankCases("dyspnoea", 1);
      const multiWord = rankCases("sudden severe dyspnoea orthopnoea", 1);
      
      expect(oneWord[0]?.score).toBeLessThanOrEqual(0.3);
      expect((multiWord[0]?.score ?? 0)).toBeGreaterThan(oneWord[0]?.score ?? 0);
    });

    it("should respect the limit parameter", () => {
      const results = rankCases("fever cough pneumonia", 5);
      expect(results.length).toBe(5);
    });
  });
});
