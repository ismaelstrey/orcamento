import { describe, expect, it } from "vitest";
import {
  buildQuoteDraftPrompt,
  mapAiQuoteDraftToImportPayload,
  quoteDraftOutputSchemaVersion,
  quoteDraftPromptVersion,
  validateAiQuoteDraftOutput
} from "./quoteDraft";

const validDraft = {
  schemaVersion: quoteDraftOutputSchemaVersion,
  title: "Notebooks para equipe comercial",
  category: "notebooks",
  currency: "BRL",
  budgetMaxCents: 1500000,
  usageContext: "Equipe comercial em campo",
  publicNotes: "Priorizar equipamentos leves com SSD.",
  items: [
    {
      type: "notebook",
      model: "Notebook corporativo i5 16GB SSD",
      quantity: 3,
      confidence: 0.86,
      rationale: "Configuracao equilibrada para uso comercial."
    }
  ],
  warnings: ["Validar disponibilidade no catalogo antes de enviar."]
};

describe("ai/quoteDraft", () => {
  it("constroi prompt versionado com guardrails e contexto de catalogo", () => {
    const prompt = buildQuoteDraftPrompt({
      customerId: "cus_1",
      userText: "Preciso de notebooks para equipe comercial com budget controlado.",
      currency: "brl",
      budgetMaxCents: 1500000,
      catalogHints: [
        {
          productId: "prd_1",
          name: "Notebook corporativo i5",
          category: "notebooks"
        }
      ]
    });

    expect(prompt.version).toBe(quoteDraftPromptVersion);
    expect(prompt.system).toContain("Nunca grave dados diretamente.");
    expect(prompt.system).toContain("ai.quote_draft.v1");
    expect(prompt.user).toContain("Moeda preferida: BRL");
    expect(prompt.user).toContain("Notebook corporativo i5 (prd_1) / notebooks");
  });

  it("valida uma saida estruturada de draft de orcamento", () => {
    const parsedDraft = validateAiQuoteDraftOutput(validDraft);

    expect(parsedDraft.items).toHaveLength(1);
    expect(parsedDraft.items[0]?.confidence).toBe(0.86);
  });

  it("rejeita draft sem itens para impedir gravacao direta de saida incompleta", () => {
    expect(() =>
      validateAiQuoteDraftOutput({
        ...validDraft,
        items: []
      })
    ).toThrow();
  });

  it("mapeia draft validado para payload reusavel pela importacao JSON", () => {
    const parsedDraft = validateAiQuoteDraftOutput(validDraft);

    expect(
      mapAiQuoteDraftToImportPayload({
        customerId: "cus_1",
        draft: parsedDraft
      })
    ).toEqual({
      customerId: "cus_1",
      schemaVersion: quoteDraftOutputSchemaVersion,
      currency: "BRL",
      category: "notebooks",
      budgetMaxCents: 1500000,
      usageContext: "Equipe comercial em campo",
      notes: "Priorizar equipamentos leves com SSD.",
      items: [
        {
          type: "notebook",
          model: "Notebook corporativo i5 16GB SSD",
          quantity: 3
        }
      ]
    });
  });
});
