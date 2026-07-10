import {
  validateAiQuoteDraftOutput,
  type AiQuoteDraftProvider,
  type AiQuoteDraftRequest
} from "./quoteDraft";
import {
  buildExternalQuoteDraftPrompt,
  estimateCostCents,
  parseExternalJsonResponse,
  readOptionalNumberEnv
} from "./externalProviderUtils";

interface OpenAiChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
  };
}

function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

function getOpenAiBaseUrl(): string {
  return (
    process.env.OPENAI_BASE_URL?.trim().replace(/\/$/, "") ||
    "https://api.openai.com/v1"
  );
}

export function hasOpenAiQuoteDraftConfiguration(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function createOpenAiQuoteDraftProvider(): AiQuoteDraftProvider {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY nao configurada.");
  }

  return {
    providerName: "openai",
    async generateQuoteDraft(input: AiQuoteDraftRequest) {
      const startedAt = Date.now();
      const prompt = buildExternalQuoteDraftPrompt(input);
      const model = getOpenAiModel();
      const response = await fetch(`${getOpenAiBaseUrl()}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: prompt.system },
            { role: "user", content: prompt.user }
          ],
          max_tokens: 1200
        })
      });

      const payload = (await response.json().catch(() => ({}))) as OpenAiChatCompletionResponse;

      if (!response.ok) {
        throw new Error(
          payload.error?.message || `OpenAI respondeu com HTTP ${response.status}.`
        );
      }

      const content = payload.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("OpenAI nao retornou conteudo para o draft.");
      }

      const promptTokens = payload.usage?.prompt_tokens;
      const completionTokens = payload.usage?.completion_tokens;

      return {
        draft: validateAiQuoteDraftOutput(parseExternalJsonResponse(content)),
        metrics: {
          provider: "openai",
          model,
          promptTokens,
          completionTokens,
          totalTokens: payload.usage?.total_tokens,
          estimatedCostCents: estimateCostCents({
            promptTokens,
            completionTokens,
            inputCostCentsPer1k: readOptionalNumberEnv(
              "OPENAI_INPUT_COST_CENTS_PER_1K"
            ),
            outputCostCentsPer1k: readOptionalNumberEnv(
              "OPENAI_OUTPUT_COST_CENTS_PER_1K"
            )
          }),
          durationMs: Date.now() - startedAt
        }
      };
    }
  };
}
