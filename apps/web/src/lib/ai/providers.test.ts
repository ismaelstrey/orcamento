import { afterEach, describe, expect, it, vi } from "vitest";
import { generateQuoteDraftReviewWithFallback } from "./service";
import {
  getConfiguredQuoteDraftProviders,
  getQuoteDraftProviderCapabilities
} from "./providers";

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

describe("ai/providers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("mantem lista vazia quando provider nao esta habilitado", () => {
    vi.stubEnv("AI_QUOTE_DRAFT_PROVIDER", "");

    expect(getConfiguredQuoteDraftProviders()).toEqual([]);
    expect(getQuoteDraftProviderCapabilities()).toEqual({
      isEnabled: false,
      promptVersion: "quote-draft-v1",
      outputSchemaVersion: "ai.quote_draft.v1",
      supportedCurrencies: ["BRL"],
      providers: []
    });
  });

  it("habilita provider local deterministico por variavel de ambiente", async () => {
    vi.stubEnv("AI_QUOTE_DRAFT_PROVIDER", "local");

    expect(getQuoteDraftProviderCapabilities()).toEqual({
      isEnabled: true,
      promptVersion: "quote-draft-v1",
      outputSchemaVersion: "ai.quote_draft.v1",
      supportedCurrencies: ["BRL"],
      providers: [
        {
          providerName: "local-deterministic",
          mode: "local",
          description: "Provider deterministico para desenvolvimento e demos.",
          maxCatalogHints: 50,
          maxGeneratedItems: 3
        }
      ]
    });

    const review = await generateQuoteDraftReviewWithFallback({
      providers: getConfiguredQuoteDraftProviders(),
      request
    });

    expect(review.provider).toBe("local-deterministic");
    expect(review.importPayload).toMatchObject({
      customerId: "cus_1",
      currency: "BRL",
      category: "notebooks",
      budgetMaxCents: 1200000,
      items: [
        {
          type: "notebooks",
          model: "Notebook corporativo i5",
          quantity: 3
        }
      ]
    });
    expect(review.metrics).toMatchObject({
      provider: "local",
      model: "local-deterministic-v1",
      estimatedCostCents: 0
    });
  });

  it("habilita providers externos configurados e preserva fallback local", () => {
    vi.stubEnv("AI_QUOTE_DRAFT_PROVIDER", "openai,gemini,local");
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");

    expect(getConfiguredQuoteDraftProviders().map((provider) => provider.providerName)).toEqual([
      "openai",
      "gemini",
      "local-deterministic"
    ]);
    expect(getQuoteDraftProviderCapabilities().providers).toEqual([
      {
        providerName: "openai",
        mode: "external",
        description: "Provider externo OpenAI para drafts estruturados.",
        maxCatalogHints: 50,
        maxGeneratedItems: 3
      },
      {
        providerName: "gemini",
        mode: "external",
        description: "Provider externo Gemini para drafts estruturados.",
        maxCatalogHints: 50,
        maxGeneratedItems: 3
      },
      {
        providerName: "local-deterministic",
        mode: "local",
        description: "Provider deterministico para desenvolvimento e demos.",
        maxCatalogHints: 50,
        maxGeneratedItems: 3
      }
    ]);
  });

  it("ignora provider externo sem chave e mantem fallback configurado", () => {
    vi.stubEnv("AI_QUOTE_DRAFT_PROVIDER", "openai local");
    vi.stubEnv("OPENAI_API_KEY", "");

    expect(getConfiguredQuoteDraftProviders().map((provider) => provider.providerName)).toEqual([
      "local-deterministic"
    ]);
  });
});
