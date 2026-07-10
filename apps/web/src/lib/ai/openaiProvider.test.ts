import { afterEach, describe, expect, it, vi } from "vitest";
import { quoteDraftOutputSchemaVersion, type AiQuoteDraftRequest } from "./quoteDraft";
import {
  createOpenAiQuoteDraftProvider,
  hasOpenAiQuoteDraftConfiguration
} from "./openaiProvider";

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

describe("ai/openaiProvider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("identifica configuracao somente quando ha chave", () => {
    vi.stubEnv("OPENAI_API_KEY", "");

    expect(hasOpenAiQuoteDraftConfiguration()).toBe(false);

    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");

    expect(hasOpenAiQuoteDraftConfiguration()).toBe(true);
  });

  it("gera draft validado via Chat Completions e preserva metricas", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubEnv("OPENAI_MODEL", "test-openai-model");
    vi.stubEnv("OPENAI_INPUT_COST_CENTS_PER_1K", "1");
    vi.stubEnv("OPENAI_OUTPUT_COST_CENTS_PER_1K", "2");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(draft) } }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        }
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createOpenAiQuoteDraftProvider().generateQuoteDraft(request);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-openai-key"
        })
      })
    );
    expect(result.draft).toEqual(draft);
    expect(result.metrics).toMatchObject({
      provider: "openai",
      model: "test-openai-model",
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      estimatedCostCents: 1
    });
  });
});
