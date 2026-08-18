import type { DrugFinding } from "@/lib/agents/types";

/**
 * Allergy cross-reactivity checking.
 *
 * Each entry maps an allergen keyword to the drug classes and named agents that
 * are either the same class or carry documented cross-reactivity risk.
 * This is a deterministic safety net — it runs before any model output is shown,
 * so an unsafe suggestion is caught even if the model misses it.
 */
interface AllergyClass {
  /** Words in the recorded allergy that trigger this class. */
  match: string[];
  label: string;
  /** Agents that must not be given. */
  avoid: string[];
  /** Agents with partial cross-reactivity — use with caution. */
  caution?: string[];
  note: string;
}

export const ALLERGY_CLASSES: AllergyClass[] = [
  {
    match: [
      "penicillin",
      "amoxicillin",
      "co-amoxiclav",
      "ampicillin",
      "flucloxacillin",
      "benzylpenicillin",
    ],
    label: "Penicillin / beta-lactam",
    avoid: [
      "penicillin",
      "amoxicillin",
      "co-amoxiclav",
      "amoxicillin-clavulanate",
      "ampicillin",
      "flucloxacillin",
      "piperacillin",
      "tazocin",
      "benzylpenicillin",
    ],
    caution: [
      "cefalexin",
      "cefuroxime",
      "ceftriaxone",
      "cefotaxime",
      "ceftazidime",
      "meropenem",
      "ertapenem",
      "imipenem",
    ],
    note: "Cephalosporins and carbapenems carry low but real cross-reactivity (roughly 1-2% for later-generation cephalosporins). Avoid entirely in documented IgE-mediated anaphylaxis; a non-severe rash history does not preclude a structurally dissimilar cephalosporin.",
  },
  {
    match: [
      "sulfa",
      "sulphonamide",
      "sulfonamide",
      "co-trimoxazole",
      "trimethoprim-sulfamethoxazole",
      "septrin",
    ],
    label: "Sulfonamide",
    avoid: ["co-trimoxazole", "sulfamethoxazole", "sulfasalazine", "sulfadiazine"],
    caution: ["furosemide", "hydrochlorothiazide", "acetazolamide", "celecoxib"],
    note: "Non-antibiotic sulfonamides rarely cross-react, but review is warranted where the reaction was severe.",
  },
  {
    match: ["macrolide", "erythromycin", "clarithromycin", "azithromycin"],
    label: "Macrolide",
    avoid: ["erythromycin", "clarithromycin", "azithromycin"],
    note: "Choose a structurally unrelated class such as a tetracycline or respiratory fluoroquinolone.",
  },
  {
    match: ["nsaid", "ibuprofen", "aspirin", "naproxen", "diclofenac"],
    label: "NSAID / salicylate",
    avoid: ["ibuprofen", "naproxen", "diclofenac", "aspirin", "indometacin", "ketorolac"],
    caution: ["celecoxib", "etoricoxib"],
    note: "In aspirin-exacerbated respiratory disease, all COX-1 inhibitors must be avoided; a selective COX-2 inhibitor may be tolerated under supervision.",
  },
  {
    match: ["quinolone", "ciprofloxacin", "levofloxacin", "moxifloxacin"],
    label: "Fluoroquinolone",
    avoid: ["ciprofloxacin", "levofloxacin", "moxifloxacin", "ofloxacin"],
    note: "Class avoidance is advised; fluoroquinolone cross-reactivity within the class is high.",
  },
  {
    match: ["tetracycline", "doxycycline", "minocycline"],
    label: "Tetracycline",
    avoid: ["doxycycline", "tetracycline", "minocycline", "lymecycline"],
    note: "Avoid the whole class; consider a macrolide alternative where the indication allows.",
  },
  {
    match: ["ace inhibitor", "ramipril", "lisinopril", "enalapril", "perindopril"],
    label: "ACE inhibitor",
    avoid: ["ramipril", "lisinopril", "enalapril", "perindopril", "captopril"],
    caution: ["losartan", "candesartan", "valsartan", "irbesartan"],
    note: "After ACE-inhibitor angioedema, an ARB may still be used with caution and counselling; after cough alone an ARB is a standard substitution.",
  },
  {
    match: ["contrast", "iodinated contrast", "iodine"],
    label: "Iodinated contrast",
    avoid: ["iodinated contrast"],
    note: "Discuss premedication and alternative imaging with radiology before contrast-enhanced studies.",
  },
];

/** Entries that record the ABSENCE of an allergy — never treat these as allergens. */
const NEGATIONS =
  /^(nkda|nka|none(\s+known)?|nil|no\b|not\b|denies\b|negative\b|unknown\b|n\/a)|no\s+(known|other|reported|documented)\b/i;

export function parseAllergies(text?: string): string[] {
  if (!text) return [];
  return text
    .split(/[,;\n]+/)
    .map((s) =>
      s
        .replace(/\(.*?\)/g, "")
        // strip bullet glyphs / list markers pasted from notes
        .replace(/^[\s•·*\-–—>\u2022]+/, "")
        .replace(/^\d+[.)]\s*/, "")
        .trim(),
    )
    .filter((s) => s.length > 2 && !NEGATIONS.test(s))
    .slice(0, 8);
}

/**
 * Cross-check recorded allergies against the drugs that are candidate
 * treatments for the matched conditions.
 */
export function checkAllergies(
  allergyText: string | undefined,
  candidateDrugs: string[],
): DrugFinding[] {
  const allergies = parseAllergies(allergyText);
  if (!allergies.length) return [];

  const findings: DrugFinding[] = [];
  const candidates = candidateDrugs.map((d) => d.toLowerCase());

  for (const allergy of allergies) {
    const lower = allergy.toLowerCase();
    const cls = ALLERGY_CLASSES.find((c) => c.match.some((m) => lower.includes(m)));

    if (!cls) {
      findings.push({
        kind: "contraindication",
        severity: "info",
        drugs: [allergy],
        detail: `Recorded allergy "${allergy}" is not in the cross-reactivity library. Confirm the agent, the reaction type and its severity before prescribing.`,
        source: "Allergy cross-check",
      });
      continue;
    }

    const blocked = cls.avoid.filter((d) => candidates.some((c) => c.includes(d) || d.includes(c)));
    const cautioned = (cls.caution ?? []).filter((d) =>
      candidates.some((c) => c.includes(d) || d.includes(c)),
    );

    findings.push({
      kind: "contraindication",
      severity: blocked.length ? "critical" : "major",
      drugs: [allergy, ...blocked],
      detail: blocked.length
        ? `${cls.label} allergy recorded. Candidate treatment(s) ${blocked.join(", ")} are in the same class and must not be given. ${cls.note}`
        : `${cls.label} allergy recorded. Avoid: ${cls.avoid.slice(0, 5).join(", ")}. ${cls.note}`,
      source: "Allergy cross-check",
    });

    if (cautioned.length) {
      findings.push({
        kind: "warning",
        severity: "major",
        drugs: [allergy, ...cautioned],
        detail: `Partial cross-reactivity: ${cautioned.join(", ")} may be considered only after the reaction severity is confirmed. ${cls.note}`,
        source: "Allergy cross-check",
      });
    }
  }

  return findings;
}
