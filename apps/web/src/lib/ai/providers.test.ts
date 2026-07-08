import { afterEach, describe, expect, it, vi } from "vitest";
import { generateQuoteDraftReviewWithFallback } from "./service";
import { getConfiguredQuoteDraftProviders } from "./providers";

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

  it("mantem lista vazia quando provider local nao esta habilitado", () => {
    vi.stubEnv("AI_QUOTE_DRAFT_PROVIDER", "");

    expect(getConfiguredQuoteDraftProviders()).toEqual([]);
  });

  it("habilita provider local deterministico por variavel de ambiente", async () => {
    vi.stubEnv("AI_QUOTE_DRAFT_PROVIDER", "local");

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
});
