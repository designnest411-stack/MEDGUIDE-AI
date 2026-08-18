import { createServerFn } from "@tanstack/react-start";
import type { DrugFinding, EvidenceSource } from "@/lib/agents/types";

export const searchLiterature = createServerFn({ method: "POST" })
  .inputValidator((input: { query: string }) => input)
  .handler(async ({ data }): Promise<{ pubmed: EvidenceSource[]; who: EvidenceSource[] }> => {
    const {
      searchPubMed,
      searchEuropePmc,
      searchTrials,
      whoGuidelines,
      gradeEvidence,
      detectSpecialty,
      specialtyGuidelines,
    } = await import("@/lib/medical/apis.server");
    const [pubmed, epmc, trials, who] = await Promise.all([
      searchPubMed(data.query, 10).catch(() => [] as EvidenceSource[]),
      searchEuropePmc(data.query, 8).catch(() => [] as EvidenceSource[]),
      searchTrials(data.query, 3).catch(() => [] as EvidenceSource[]),
      whoGuidelines(data.query).catch(() => [] as EvidenceSource[]),
    ]);
    const seen = new Set<string>();
    const merged = [...pubmed, ...epmc, ...trials]
      .filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)))
      .map(gradeEvidence)
      .sort((a, b) => (a.level?.rank ?? 9) - (b.level?.rank ?? 9) || (b.year ?? 0) - (a.year ?? 0));
    const guidelines = [
      ...specialtyGuidelines(detectSpecialty(data.query), data.query),
      ...who,
    ].map(gradeEvidence);
    return { pubmed: merged, who: guidelines };
  });

export const checkDrugs = createServerFn({ method: "POST" })
  .inputValidator((input: { drugs: string[] }) => input)
  .handler(
    async ({
      data,
    }): Promise<{
      findings: DrugFinding[];
      evidence: EvidenceSource[];
    }> => {
      const { rxNormInteractions, searchFdaLabel } = await import("@/lib/medical/apis.server");
      const drugs = data.drugs
        .map((d) => d.trim())
        .filter(Boolean)
        .slice(0, 6);
      if (drugs.length === 0) return { findings: [], evidence: [] };

      const [interactions, labels] = await Promise.all([
        rxNormInteractions(drugs).catch(() => [] as DrugFinding[]),
        Promise.all(
          drugs.map((drug) =>
            searchFdaLabel(drug).catch(() => ({
              evidence: [] as EvidenceSource[],
              findings: [] as DrugFinding[],
            })),
          ),
        ),
      ]);

      return {
        findings: [...interactions, ...labels.flatMap((l) => l.findings)],
        evidence: labels.flatMap((l) => l.evidence),
      };
    },
  );
