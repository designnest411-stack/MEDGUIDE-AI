import { describe, expect, it } from "vitest";
import { INDIAN_CLINICAL_COHORT } from "../src/lib/clinical-seed-data";

describe("Indian Clinical Patient Cohort", () => {
  it("contains exactly 6 comprehensive clinical cases", () => {
    expect(INDIAN_CLINICAL_COHORT.length).toBe(6);
  });

  it("includes authentic Indian names and demographic diversity", () => {
    const names = INDIAN_CLINICAL_COHORT.map((c) => c.patient.name);
    expect(names).toContain("Rajesh Kumar Sharma");
    expect(names).toContain("Priya Sundaram Patel");
    expect(names).toContain("Sunita Ramesh Verma");
    expect(names).toContain("Amitabh Debroy Mukherjee");
    expect(names).toContain("Mohammed Tariq Farooq");
    expect(names).toContain("Dr. Lakshmi Anand Iyer");
  });

  it("populates mandatory clinical fields for every patient", () => {
    for (const item of INDIAN_CLINICAL_COHORT) {
      const p = item.patient;
      expect(p.name).toBeTruthy();
      expect(p.age).toBeTruthy();
      expect(p.sex).toBeTruthy();
      expect(p.question).toBeTruthy();
      expect(p.history).toBeTruthy();
      expect(p.medications).toBeTruthy();
      expect(p.allergies).toBeTruthy();
      expect(p.vitals).toBeTruthy();
      expect(p.labs).toBeTruthy();
    }
  });

  it("contains structured chronological timeline events for each patient", () => {
    for (const item of INDIAN_CLINICAL_COHORT) {
      expect(item.timeline.length).toBeGreaterThanOrEqual(3);
      for (const evt of item.timeline) {
        expect(evt.date).toBeTruthy();
        expect(evt.title).toBeTruthy();
        expect(evt.detail).toBeTruthy();
        expect(["symptom", "test", "medication", "imaging", "outcome", "note"]).toContain(evt.kind);
      }
    }
  });

  it("covers critical CDSS drug allergy and safety interceptor cases", () => {
    const allergies = INDIAN_CLINICAL_COHORT.map((c) => c.patient.allergies).join(" ");
    expect(allergies.toLowerCase()).toContain("aspirin");
    expect(allergies.toLowerCase()).toContain("penicillin");
    expect(allergies.toLowerCase()).toContain("sulfa");

    const meds = INDIAN_CLINICAL_COHORT.map((c) => c.patient.medications).join(" ");
    expect(meds.toLowerCase()).toContain("metformin");
    expect(meds.toLowerCase()).toContain("ibuprofen");
  });
});

