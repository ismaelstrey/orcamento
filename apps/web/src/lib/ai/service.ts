import { ZodError } from "zod";
import {
  aiQuoteDraftRequestSchema,
  buildQuoteDraftPrompt,
  mapAiQuoteDraftToImportPayload,
  quoteDraftPromptVersion,
  validateAiQuoteDraftOutput,
  type AiQuoteDraftProvider,
  type AiUsageMetrics
} from "./quoteDraft";
import type { ImportQuoteJsonRequest } from "@/lib/quotes/schemas";

export class AiDraftGenerationError extends Error {
  public readonly code: "provider_error" | "invalid_provider_output";

  constructor(
    code: "provider_error" | "invalid_provider_output",
    message: string
  ) {
    super(message);
    this.name = "AiDraftGenerationError";
    this.code = code;
  }
}

export interface QuoteDraftReview {
  promptVersion: typeof quoteDraftPromptVersion;
  provider: string;
  title: string;
  warnings: string[];
  confidenceSummary: {
    min: number;
    average: number;
  };
  importPayload: ImportQuoteJsonRequest;
  metrics: AiUsageMetrics;
}

function buildConfidenceSummary(items: Array<{ confidence: number }>) {
  const confidences = items.map((item) => item.confidence);
  const totalConfidence = confidences.reduce(
    (total, confidence) => total + confidence,
    0
  );

  return {
    min: Math.min(...confidences),
    average: Number((totalConfidence / confidences.length).toFixed(4))
  };
}

export async function generateQuoteDraftReview(input: {
  provider: AiQuoteDraftProvider;
  request: unknown;
}): Promise<QuoteDraftReview> {
  const request = aiQuoteDraftRequestSchema.parse(input.request);
  const prompt = buildQuoteDraftPrompt(request);

  let providerResult: Awaited<
    ReturnType<AiQuoteDraftProvider["generateQuoteDraft"]>
  >;

  try {
    providerResult = await input.provider.generateQuoteDraft(request);
  } catch (error: unknown) {
    throw new AiDraftGenerationError(
      "provider_error",
      error instanceof Error
        ? error.message
        : "Falha ao gerar draft por provider de IA."
    );
  }

  try {
    const draft = validateAiQuoteDraftOutput(providerResult.draft);

    return {
      promptVersion: prompt.version,
      provider: input.provider.providerName,
      title: draft.title,
      warnings: draft.warnings,
      confidenceSummary: buildConfidenceSummary(draft.items),
      importPayload: mapAiQuoteDraftToImportPayload({
        customerId: request.customerId,
        draft
      }),
      metrics: providerResult.metrics
    };
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      throw new AiDraftGenerationError(
        "invalid_provider_output",
        "Provider retornou um draft incompatível com o schema versionado."
      );
    }

    throw error;
  }
}
