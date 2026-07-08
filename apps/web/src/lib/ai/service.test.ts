import { describe, expect, it, vi } from "vitest";
import {
  quoteDraftOutputSchemaVersion,
  quoteDraftPromptVersion,
  type AiQuoteDraftProvider
} from "./quoteDraft";
import {
  AiDraftGenerationError,
  generateQuoteDraftReview
} from "./service";

function createProviderMock(
  result: Awaited<ReturnType<AiQuoteDraftProvider["generateQuoteDraft"]>>
): AiQuoteDraftProvider {
  return {
    providerName: "fake-provider",
    generateQuoteDraft: vi.fn().mockResolvedValue(result)
  };
}

const request = {
  customerId: "cus_1",
  userText: "Preciso de tres notebooks corporativos para equipe comercial.",
  currency: "BRL",
  budgetMaxCents: 1200000,
  catalogHints: [
    {
      productId: "prd_1",
      name: "Notebook corporativo i5",
      category: "notebooks"
    }
  ]
};

describe("ai/service", () => {
  it("gera revisao validada com payload de importacao e metricas do provider", async () => {
    const provider = createProviderMock({
      draft: {
        schemaVersion: quoteDraftOutputSchemaVersion,
        title: "Notebooks comerciais",
        category: "notebooks",
        currency: "BRL",
        budgetMaxCents: 1200000,
        usageContext: "Equipe comercial",
        publicNotes: "Proposta montada a partir de briefing comercial.",
        items: [
          {
            type: "notebook",
            model: "Notebook corporativo i5",
            quantity: 2,
            confidence: 0.9
          },
          {
            type: "notebook",
            model: "Notebook corporativo i7",
            quantity: 1,
            confidence: 0.7
          }
        ],
        warnings: ["Validar estoque antes de enviar."]
      },
      metrics: {
        provider: "fake",
        model: "fake-model",
        promptTokens: 100,
        completionTokens: 60,
        totalTokens: 160,
        estimatedCostCents: 4,
        durationMs: 250
      }
    });

    const review = await generateQuoteDraftReview({
      provider,
      request
    });

    expect(provider.generateQuoteDraft).toHaveBeenCalledWith(request);
    expect(review).toEqual({
      promptVersion: quoteDraftPromptVersion,
      provider: "fake-provider",
      title: "Notebooks comerciais",
      warnings: ["Validar estoque antes de enviar."],
      confidenceSummary: {
        min: 0.7,
        average: 0.8
      },
      importPayload: {
        customerId: "cus_1",
        schemaVersion: quoteDraftOutputSchemaVersion,
        currency: "BRL",
        category: "notebooks",
        budgetMaxCents: 1200000,
        usageContext: "Equipe comercial",
        notes: "Proposta montada a partir de briefing comercial.",
        items: [
          {
            type: "notebook",
            model: "Notebook corporativo i5",
            quantity: 2
          },
          {
            type: "notebook",
            model: "Notebook corporativo i7",
            quantity: 1
          }
        ]
      },
      metrics: {
        provider: "fake",
        model: "fake-model",
        promptTokens: 100,
        completionTokens: 60,
        totalTokens: 160,
        estimatedCostCents: 4,
        durationMs: 250
      }
    });
  });

  it("normaliza falha do provider sem expor detalhes estruturais", async () => {
    const provider: AiQuoteDraftProvider = {
      providerName: "fake-provider",
      generateQuoteDraft: vi.fn().mockRejectedValue(new Error("timeout externo"))
    };

    await expect(
      generateQuoteDraftReview({
        provider,
        request
      })
    ).rejects.toMatchObject({
      name: "AiDraftGenerationError",
      code: "provider_error",
      message: "timeout externo"
    });
  });

  it("rejeita saida invalida do provider antes de virar payload importavel", async () => {
    const provider = createProviderMock({
      draft: {
        schemaVersion: quoteDraftOutputSchemaVersion,
        title: "Draft sem itens",
        category: "notebooks",
        currency: "BRL",
        items: [],
        warnings: []
      },
      metrics: {
        provider: "fake",
        model: "fake-model"
      }
    } as Awaited<ReturnType<AiQuoteDraftProvider["generateQuoteDraft"]>>);

    await expect(
      generateQuoteDraftReview({
        provider,
        request
      })
    ).rejects.toBeInstanceOf(AiDraftGenerationError);
    await expect(
      generateQuoteDraftReview({
        provider,
        request
      })
    ).rejects.toMatchObject({
      code: "invalid_provider_output"
    });
  });
});
