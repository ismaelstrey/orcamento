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

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: {
    message?: string;
  };
}

function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-1.5-flash";
}

function getGeminiBaseUrl(): string {
  return (
    process.env.GEMINI_BASE_URL?.trim().replace(/\/$/, "") ||
    "https://generativelanguage.googleapis.com/v1beta"
  );
}

export function hasGeminiQuoteDraftConfiguration(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function createGeminiQuoteDraftProvider(): AiQuoteDraftProvider {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY nao configurada.");
  }

  return {
    providerName: "gemini",
    async generateQuoteDraft(input: AiQuoteDraftRequest) {
      const startedAt = Date.now();
      const prompt = buildExternalQuoteDraftPrompt(input);
      const model = getGeminiModel();
      const endpoint = `${getGeminiBaseUrl()}/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: prompt.system }]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: prompt.user }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1200,
            responseMimeType: "application/json"
          }
        })
      });

      const payload = (await response.json().catch(() => ({}))) as GeminiGenerateContentResponse;

      if (!response.ok) {
        throw new Error(
          payload.error?.message || `Gemini respondeu com HTTP ${response.status}.`
        );
      }

      const content = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter(Boolean)
        .join("\n");

      if (!content) {
        throw new Error("Gemini nao retornou conteudo para o draft.");
      }

      const promptTokens = payload.usageMetadata?.promptTokenCount;
      const completionTokens = payload.usageMetadata?.candidatesTokenCount;

      return {
        draft: validateAiQuoteDraftOutput(parseExternalJsonResponse(content)),
        metrics: {
          provider: "gemini",
          model,
          promptTokens,
          completionTokens,
          totalTokens: payload.usageMetadata?.totalTokenCount,
          estimatedCostCents: estimateCostCents({
            promptTokens,
            completionTokens,
            inputCostCentsPer1k: readOptionalNumberEnv(
              "GEMINI_INPUT_COST_CENTS_PER_1K"
            ),
            outputCostCentsPer1k: readOptionalNumberEnv(
              "GEMINI_OUTPUT_COST_CENTS_PER_1K"
            )
          }),
          durationMs: Date.now() - startedAt
        }
      };
    }
  };
}
