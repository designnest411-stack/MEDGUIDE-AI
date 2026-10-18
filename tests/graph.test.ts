import { describe, it, expect } from "vitest";
import { DISEASES, buildGraph, matchDiseases, NODE_COLORS } from "@/lib/medical/graph";

describe("Medical Knowledge Graph", () => {
  it("should contain at least 24 comprehensive disease models", () => {
    expect(DISEASES.length).toBeGreaterThanOrEqual(24);
  });

  it("every disease specification should have non-empty relational arrays", () => {
    for (const d of DISEASES) {
      expect(d.id).toBeTruthy();
      expect(d.label).toBeTruthy();
      expect(d.symptoms.length).toBeGreaterThan(0);
      expect(d.risks.length).toBeGreaterThan(0);
      expect(d.labs.length).toBeGreaterThan(0);
      expect(d.drugs.length).toBeGreaterThan(0);
      expect(d.contraindications.length).toBeGreaterThan(0);
      expect(d.treatments.length).toBeGreaterThan(0);
      expect(d.complications.length).toBeGreaterThan(0);
    }
  });

  describe("buildGraph", () => {
    it("should build a graph containing disease nodes and relational child nodes", () => {
      const { nodes, edges } = buildGraph(["acute-coronary-syndrome"], 3);
      expect(nodes.length).toBeGreaterThan(5);
      expect(edges.length).toBeGreaterThan(5);

      const root = nodes.find((n) => n.id === "acute-coronary-syndrome");
      expect(root).toBeDefined();
      expect(root?.type).toBe("disease");

      const edge = edges.find((e) => e.source === "acute-coronary-syndrome");
      expect(edge).toBeDefined();
    });

    it("should cap relations per category according to maxPerRelation", () => {
      const { edges } = buildGraph(["acute-coronary-syndrome"], 2);
      const symptomEdges = edges.filter((e) => e.label === "symptoms");
      expect(symptomEdges.length).toBeLessThanOrEqual(2);
    });
  });

  describe("matchDiseases", () => {
    it("should match pneumonia presentation from symptom query", () => {
      const matches = matchDiseases("elderly patient with productive cough and fever", 2);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]?.id).toBe("community-acquired-pneumonia");
    });

    it("should match acute coronary syndrome from chest pain and troponin query", () => {
      const matches = matchDiseases("crushing chest pain diaphoresis troponin", 2);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]?.id).toBe("acute-coronary-syndrome");
    });
  });

  describe("NODE_COLORS", () => {
    it("should define semantic CSS theme variables for all node types", () => {
      expect(NODE_COLORS.disease).toContain("var(--color-primary)");
      expect(NODE_COLORS.contraindication).toContain("var(--color-destructive)");
      expect(NODE_COLORS.treatment).toContain("var(--color-success)");
      expect(NODE_COLORS.drug).toContain("var(--color-agent)");
    });
  });
});
