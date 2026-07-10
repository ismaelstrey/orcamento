import { describe, expect, it } from "vitest";
import { buildAiAlternativeComparison } from "./alternatives";

describe("ai/alternatives", () => {
  it("recomenda a alternativa com melhor combinacao de confianca e preco", () => {
    const comparison = buildAiAlternativeComparison([
      {
        id: "economy",
        label: "Economica",
        totalCents: 520000,
        currency: "brl",
        confidence: 0.82,
        items: 2,
        pros: ["Menor investimento"],
        cons: ["Garantia menor"]
      },
      {
        id: "balanced",
        label: "Balanceada",
        totalCents: 580000,
        currency: "BRL",
        confidence: 0.94,
        items: 3,
        pros: ["Boa garantia", "Entrega rapida", "Padrao corporativo"],
        cons: []
      },
      {
        id: "premium",
        label: "Premium",
        totalCents: 760000,
        currency: "BRL",
        confidence: 0.88,
        items: 3,
        pros: ["Maior performance"],
        cons: ["Maior custo"]
      }
    ]);

    expect(comparison.tone).toBe("success");
    expect(comparison.recommendedAlternative?.id).toBe("balanced");
    expect(comparison.savingsVsHighestCents).toBe(180000);
    expect(comparison.confidenceLabel).toBe("Alta confianca");
    expect(comparison.customerSummary).toContain("Opcao recomendada: Balanceada");
    expect(comparison.warnings).toEqual([]);
  });

  it("alerta quando ha apenas uma alternativa ou confianca baixa", () => {
    const comparison = buildAiAlternativeComparison([
      {
        id: "single",
        label: "Unica opcao",
        totalCents: 300000,
        currency: "BRL",
        confidence: 0.45,
        items: 1,
        pros: [],
        cons: ["Pouco contexto"]
      }
    ]);

    expect(comparison.tone).toBe("warning");
    expect(comparison.confidenceLabel).toBe("Confianca baixa");
    expect(comparison.warnings).toEqual([
      "A comparacao fica mais forte com pelo menos duas alternativas.",
      "A confianca media das alternativas ainda esta baixa."
    ]);
  });

  it("mantem retorno seguro sem alternativas validas", () => {
    const comparison = buildAiAlternativeComparison([]);

    expect(comparison.tone).toBe("danger");
    expect(comparison.recommendedAlternative).toBeNull();
    expect(comparison.customerSummary).toBe(
      "Gere alternativas para montar um resumo comercial para o cliente."
    );
    expect(comparison.warnings).toEqual([
      "Gere ao menos uma alternativa antes de comparar.",
      "A confianca media das alternativas ainda esta baixa."
    ]);
  });
});
