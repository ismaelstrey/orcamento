import { ZodError } from "zod";
import {
  aiQuoteDraftRequestSchema,
  buildQuoteDraftPrompt,
  mapAiQuoteDraftToImportPayload,
  quoteDraftPromptVersion,
  validateAiQuoteDraftOutput,
  type AiQuoteDraftRequest,
  type AiQuoteDraftProvider,
  type AiUsageMetrics
} from "./quoteDraft";
import type { ImportQuoteJsonRequest } from "@/lib/quotes/schemas";

export class AiDraftGenerationError extends Error {
  public readonly code: "provider_error" | "invalid_provider_output";
  public readonly providerName: string | undefined;

  constructor(
    code: "provider_error" | "invalid_provider_output",
    message: string,
    providerName?: string
  ) {
    super(message);
    this.name = "AiDraftGenerationError";
    this.code = code;
    this.providerName = providerName;
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

export interface QuoteDraftFallbackAttempt {
  provider: string;
  code: AiDraftGenerationError["code"];
  message: string;
}

export interface QuoteDraftFallbackReview extends QuoteDraftReview {
  fallbackAttempts: QuoteDraftFallbackAttempt[];
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

async function generateQuoteDraftReviewOnce(input: {
  provider: AiQuoteDraftProvider;
  request: AiQuoteDraftRequest;
}): Promise<QuoteDraftReview> {
  const prompt = buildQuoteDraftPrompt(input.request);

  let providerResult: Awaited<
    ReturnType<AiQuoteDraftProvider["generateQuoteDraft"]>
  >;

  try {
    providerResult = await input.provider.generateQuoteDraft(input.request);
  } catch (error: unknown) {
    throw new AiDraftGenerationError(
      "provider_error",
      error instanceof Error
        ? error.message
        : "Falha ao gerar draft por provider de IA.",
      input.provider.providerName
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
        customerId: input.request.customerId,
        draft
      }),
      metrics: providerResult.metrics
    };
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      throw new AiDraftGenerationError(
        "invalid_provider_output",
        "Provider retornou um draft incompatível com o schema versionado.",
        input.provider.providerName
      );
    }

    throw error;
  }
}

export async function generateQuoteDraftReview(input: {
  provider: AiQuoteDraftProvider;
  request: unknown;
}): Promise<QuoteDraftReview> {
  const request = aiQuoteDraftRequestSchema.parse(input.request);

  return generateQuoteDraftReviewOnce({
    provider: input.provider,
    request
  });
}

export async function generateQuoteDraftReviewWithFallback(input: {
  providers: AiQuoteDraftProvider[];
  request: unknown;
}): Promise<QuoteDraftFallbackReview> {
  const request = aiQuoteDraftRequestSchema.parse(input.request);
  const fallbackAttempts: QuoteDraftFallbackAttempt[] = [];

  if (!input.providers.length) {
    throw new AiDraftGenerationError(
      "provider_error",
      "Nenhum provider de IA configurado para gerar draft."
    );
  }

  for (const provider of input.providers) {
    try {
      const review = await generateQuoteDraftReviewOnce({
        provider,
        request
      });

      return {
        ...review,
        fallbackAttempts
      };
    } catch (error: unknown) {
      if (error instanceof AiDraftGenerationError) {
        fallbackAttempts.push({
          provider: provider.providerName,
          code: error.code,
          message: error.message
        });
        continue;
      }

      throw error;
    }
  }

  throw new AiDraftGenerationError(
    "provider_error",
    `Todos os providers de IA falharam (${fallbackAttempts.length} tentativa(s)).`
  );
}
