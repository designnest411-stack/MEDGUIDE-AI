import { describe, it, expect } from "vitest";
import { parseAllergies, checkAllergies } from "@/lib/medical/allergy";

describe("Allergy System", () => {
  describe("parseAllergies", () => {
    it("should return empty array for undefined or empty text", () => {
      expect(parseAllergies()).toEqual([]);
      expect(parseAllergies("")).toEqual([]);
      expect(parseAllergies("   ")).toEqual([]);
    });

    it("should filter out negative statements (NKDA, none known, nil)", () => {
      expect(parseAllergies("NKDA")).toEqual([]);
      expect(parseAllergies("No known drug allergies")).toEqual([]);
      expect(parseAllergies("none")).toEqual([]);
      expect(parseAllergies("NKA")).toEqual([]);
      expect(parseAllergies("denies allergies")).toEqual([]);
    });

    it("should parse multiple comma- or newline-separated allergens and clean markings", () => {
      const input = "• Penicillin (severe anaphylaxis)\n- Sulfa drugs\n* Aspirin";
      const parsed = parseAllergies(input);
      expect(parsed).toEqual(["Penicillin", "Sulfa drugs", "Aspirin"]);
    });

    it("should cap parsed allergens at 8 items", () => {
      const input = "Allergen 1, Allergen 2, Allergen 3, Allergen 4, Allergen 5, Allergen 6, Allergen 7, Allergen 8, Allergen 9, Allergen 10";
      const parsed = parseAllergies(input);
      expect(parsed.length).toBe(8);
    });
  });

  describe("checkAllergies", () => {
    it("should return empty findings when no allergies are present", () => {
      const findings = checkAllergies("NKDA", ["Amoxicillin", "Paracetamol"]);
      expect(findings).toEqual([]);
    });

    it("should detect direct and cross-class contraindications for penicillin", () => {
      const findings = checkAllergies("Penicillin", ["Amoxicillin", "Ceftriaxone"]);
      
      const blocked = findings.find((f) => f.severity === "critical");
      expect(blocked).toBeDefined();
      expect(blocked?.drugs).toContain("Penicillin");
      expect(blocked?.drugs).toContain("amoxicillin");
      expect(blocked?.detail).toContain("must not be given");

      const caution = findings.find((f) => f.kind === "warning");
      expect(caution).toBeDefined();
      expect(caution?.drugs).toContain("ceftriaxone");
      expect(caution?.detail).toContain("Partial cross-reactivity");
    });

    it("should detect NSAID allergy and block ibuprofen and aspirin", () => {
      const findings = checkAllergies("Ibuprofen", ["Aspirin", "Paracetamol"]);
      const blocked = findings.find((f) => f.severity === "critical");
      expect(blocked).toBeDefined();
      expect(blocked?.drugs).toContain("aspirin");
    });

    it("should flag unknown allergen with an informational safety review notice", () => {
      const findings = checkAllergies("Strawberries", ["Amoxicillin"]);
      expect(findings.length).toBe(1);
      expect(findings[0]?.severity).toBe("info");
      expect(findings[0]?.detail).toContain("Strawberries");
      expect(findings[0]?.detail).toContain("Confirm the agent");
    });
  });
});
