import { describe, expect, it } from "vitest";
import { quoteDraftOutputSchemaVersion, type AiQuoteDraftOutput } from "./quoteDraft";
import { buildAiDraftReviewSummary } from "./reviewWorkbench";

const readyDraft: AiQuoteDraftOutput = {
  schemaVersion: quoteDraftOutputSchemaVersion,
  title: "Orcamento corporativo de notebooks",
  category: "Notebooks",
  currency: "BRL",
  budgetMaxCents: 1200000,
  usageContext: "Equipe comercial em visitas externas",
  publicNotes: "Itens sugeridos para uso corporativo.",
  warnings: [],
  items: [
    {
      type: "Notebook",
      model: "Notebook corporativo com SSD",
      quantity: 3,
      confidence: 0.94
    },
    {
      type: "Garantia",
      model: "Garantia comercial estendida",
      quantity: 3,
      confidence: 0.88
    }
  ]
};

describe("ai/reviewWorkbench", () => {
  it("aprova importacao quando o draft tem confianca, itens aceitos e revisao", () => {
    const summary = buildAiDraftReviewSummary({
      draft: readyDraft,
      acceptedItemIndexes: [0, 1],
      rejectedItemIndexes: [],
      reviewerNotes: "Validado com o cliente antes da proposta.",
      maxBudgetCents: 1500000
    });

    expect(summary).toMatchObject({
      tone: "success",
      canImport: true,
      acceptedItems: 2,
      rejectedItems: 0,
      averageConfidence: 0.91,
      warnings: []
    });
    expect(summary.score).toBeGreaterThanOrEqual(90);
    expect(summary.publicNoteSuggestion).toContain("notebooks");
  });

  it("bloqueia importacao quando faltam aceite, confianca e budget coerente", () => {
    const summary = buildAiDraftReviewSummary({
      draft: {
        ...readyDraft,
        budgetMaxCents: 2000000,
        warnings: ["Modelo exato depende de disponibilidade."],
        items: [
          {
            type: "Notebook",
            model: "Modelo generico",
            quantity: 2,
            confidence: 0.48
          }
        ]
      },
      acceptedItemIndexes: [],
      rejectedItemIndexes: [0],
      maxBudgetCents: 1000000
    });

    expect(summary.canImport).toBe(false);
    expect(summary.tone).toBe("danger");
    expect(summary.warnings).toEqual([
      "Modelo exato depende de disponibilidade.",
      "Confianca media baixa: revise item por item antes de importar.",
      "Nenhum item foi marcado como aceito para importacao.",
      "Ha itens rejeitados que precisam de ajuste ou exclusao.",
      "Budget sugerido pelo draft excede o limite comercial informado."
    ]);
    expect(summary.revisionNotes).toEqual([
      "Gerar nova revisao removendo ou substituindo os itens rejeitados.",
      "Adicionar mais contexto de uso, quantidade, restricoes e urgencia.",
      "Recalibrar o briefing para respeitar o teto de budget."
    ]);
  });

  it("mantem estado seguro quando ainda nao existe draft", () => {
    const summary = buildAiDraftReviewSummary({
      draft: null,
      acceptedItemIndexes: [],
      rejectedItemIndexes: []
    });

    expect(summary).toMatchObject({
      score: 0,
      tone: "danger",
      canImport: false,
      acceptedItems: 0
    });
  });
});
