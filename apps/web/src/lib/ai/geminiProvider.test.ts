import { afterEach, describe, expect, it, vi } from "vitest";
import { quoteDraftOutputSchemaVersion, type AiQuoteDraftRequest } from "./quoteDraft";
import {
  createGeminiQuoteDraftProvider,
  hasGeminiQuoteDraftConfiguration
} from "./geminiProvider";

const draft = {
  schemaVersion: quoteDraftOutputSchemaVersion,
  title: "Notebooks comerciais",
  category: "notebooks",
  currency: "BRL",
  items: [
    {
      type: "notebook",
      model: "Notebook corporativo i5",
      quantity: 3,
      confidence: 0.88
    }
  ],
  warnings: []
};

const request: AiQuoteDraftRequest = {
  customerId: "cus_1",
  userText: "Preciso de tres notebooks corporativos para equipe comercial.",
  currency: "BRL",
  catalogHints: [
    {
      productId: "prd_1",
      name: "Notebook corporativo i5",
      category: "notebooks"
    }
  ]
};

describe("ai/geminiProvider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("identifica configuracao somente quando ha chave", () => {
    vi.stubEnv("GEMINI_API_KEY", "");

    expect(hasGeminiQuoteDraftConfiguration()).toBe(false);

    vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");

    expect(hasGeminiQuoteDraftConfiguration()).toBe(true);
  });

  it("gera draft validado via Generate Content e preserva metricas", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");
    vi.stubEnv("GEMINI_MODEL", "test-gemini-model");
    vi.stubEnv("GEMINI_INPUT_COST_CENTS_PER_1K", "1");
    vi.stubEnv("GEMINI_OUTPUT_COST_CENTS_PER_1K", "2");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(draft) }]
            }
          }
        ],
        usageMetadata: {
          promptTokenCount: 100,
          candidatesTokenCount: 50,
          totalTokenCount: 150
        }
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createGeminiQuoteDraftProvider().generateQuoteDraft(request);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/test-gemini-model:generateContent?key=test-gemini-key",
      expect.objectContaining({
        method: "POST"
      })
    );
    expect(result.draft).toEqual(draft);
    expect(result.metrics).toMatchObject({
      provider: "gemini",
      model: "test-gemini-model",
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      estimatedCostCents: 1
    });
  });
});
