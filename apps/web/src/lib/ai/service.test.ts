import { describe, expect, it, vi } from "vitest";
import {
  quoteDraftOutputSchemaVersion,
  quoteDraftPromptVersion,
  type AiQuoteDraftProvider
} from "./quoteDraft";
import {
  AiDraftGenerationError,
  generateQuoteDraftReview,
  generateQuoteDraftReviewWithFallback
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

    const promise = generateQuoteDraftReview({
      provider,
      request
    });

    await expect(promise).rejects.toBeInstanceOf(AiDraftGenerationError);
    await expect(promise).rejects.toMatchObject({
      code: "invalid_provider_output"
    });
  });

  it("usa provider seguinte quando o primeiro falha", async () => {
    const failingProvider: AiQuoteDraftProvider = {
      providerName: "primary-provider",
      generateQuoteDraft: vi.fn().mockRejectedValue(new Error("rate limit"))
    };
    const fallbackProvider = createProviderMock({
      draft: {
        schemaVersion: quoteDraftOutputSchemaVersion,
        title: "Draft por fallback",
        category: "notebooks",
        currency: "BRL",
        items: [
          {
            type: "notebook",
            model: "Notebook corporativo",
            quantity: 3,
            confidence: 0.82
          }
        ],
        warnings: []
      },
      metrics: {
        provider: "fallback",
        model: "fallback-model"
      }
    });

    const review = await generateQuoteDraftReviewWithFallback({
      providers: [failingProvider, fallbackProvider],
      request
    });

    expect(failingProvider.generateQuoteDraft).toHaveBeenCalledWith(request);
    expect(fallbackProvider.generateQuoteDraft).toHaveBeenCalledWith(request);
    expect(review.provider).toBe("fake-provider");
    expect(review.fallbackAttempts).toEqual([
      {
        provider: "primary-provider",
        code: "provider_error",
        message: "rate limit"
      }
    ]);
  });

  it("usa fallback quando provider retorna saida fora do schema", async () => {
    const invalidProvider = createProviderMock({
      draft: {
        schemaVersion: quoteDraftOutputSchemaVersion,
        title: "Draft sem itens",
        category: "notebooks",
        currency: "BRL",
        items: [],
        warnings: []
      },
      metrics: {
        provider: "invalid",
        model: "invalid-model"
      }
    } as Awaited<ReturnType<AiQuoteDraftProvider["generateQuoteDraft"]>>);
    const validProvider = createProviderMock({
      draft: {
        schemaVersion: quoteDraftOutputSchemaVersion,
        title: "Draft valido",
        category: "notebooks",
        currency: "BRL",
        items: [
          {
            type: "notebook",
            model: "Notebook corporativo",
            quantity: 1,
            confidence: 0.91
          }
        ],
        warnings: []
      },
      metrics: {
        provider: "valid",
        model: "valid-model"
      }
    });

    const review = await generateQuoteDraftReviewWithFallback({
      providers: [invalidProvider, validProvider],
      request
    });

    expect(review.title).toBe("Draft valido");
    expect(review.fallbackAttempts).toEqual([
      {
        provider: "fake-provider",
        code: "invalid_provider_output",
        message: "Provider retornou um draft incompatível com o schema versionado."
      }
    ]);
  });

  it("falha cedo quando nenhum provider esta configurado", async () => {
    await expect(
      generateQuoteDraftReviewWithFallback({
        providers: [],
        request
      })
    ).rejects.toMatchObject({
      code: "provider_error",
      message: "Nenhum provider de IA configurado para gerar draft."
    });
  });

  it("falha com resumo quando todos os providers configurados falham", async () => {
    const firstProvider: AiQuoteDraftProvider = {
      providerName: "first",
      generateQuoteDraft: vi.fn().mockRejectedValue(new Error("indisponivel"))
    };
    const secondProvider: AiQuoteDraftProvider = {
      providerName: "second",
      generateQuoteDraft: vi.fn().mockRejectedValue(new Error("timeout"))
    };

    await expect(
      generateQuoteDraftReviewWithFallback({
        providers: [firstProvider, secondProvider],
        request
      })
    ).rejects.toMatchObject({
      code: "provider_error",
      message: "Todos os providers de IA falharam (2 tentativa(s))."
    });
  });
});
