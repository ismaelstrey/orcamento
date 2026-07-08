import { z } from "zod";
import type { ImportQuoteJsonRequest } from "@/lib/quotes/schemas";

export const quoteDraftPromptVersion = "quote-draft-v1";
export const quoteDraftOutputSchemaVersion = "ai.quote_draft.v1";
export const quoteDraftSupportedCurrencies = ["BRL"] as const;
export const quoteDraftMaxCatalogHints = 50;
export const quoteDraftMaxGeneratedItems = 3;

const aiQuoteDraftCurrencySchema = z
  .string()
  .length(3)
  .transform((currency) => currency.toUpperCase())
  .refine(
    (currency): currency is (typeof quoteDraftSupportedCurrencies)[number] =>
      quoteDraftSupportedCurrencies.includes(
        currency as (typeof quoteDraftSupportedCurrencies)[number]
      ),
    "Moeda nao suportada pelo assistente de IA."
  );

export const aiQuoteDraftRequestSchema = z.object({
  customerId: z.string().min(1),
  userText: z.string().min(10).max(8000),
  currency: aiQuoteDraftCurrencySchema.default("BRL"),
  budgetMaxCents: z.number().int().positive().optional(),
  catalogHints: z
    .array(
      z.object({
        productId: z.string().min(1),
        name: z.string().min(1),
        category: z.string().min(1).optional()
      })
    )
    .max(quoteDraftMaxCatalogHints)
    .default([])
});

export const aiQuoteDraftItemSchema = z.object({
  type: z.string().min(1).max(80),
  model: z.string().min(1).max(180),
  quantity: z.number().int().positive(),
  confidence: z.number().min(0).max(1),
  rationale: z.string().max(500).optional()
});

export const aiQuoteDraftOutputSchema = z.object({
  schemaVersion: z.literal(quoteDraftOutputSchemaVersion),
  title: z.string().min(2).max(180),
  category: z.string().min(1).max(120),
  currency: z.string().length(3),
  budgetMaxCents: z.number().int().positive().optional(),
  usageContext: z.string().max(500).optional(),
  publicNotes: z.string().max(4000).optional(),
  items: z.array(aiQuoteDraftItemSchema).min(1).max(quoteDraftMaxGeneratedItems),
  warnings: z.array(z.string().max(500)).default([])
});

export const aiUsageMetricsSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  promptTokens: z.number().int().nonnegative().optional(),
  completionTokens: z.number().int().nonnegative().optional(),
  totalTokens: z.number().int().nonnegative().optional(),
  estimatedCostCents: z.number().int().nonnegative().optional(),
  durationMs: z.number().int().nonnegative().optional()
});

export type AiQuoteDraftRequest = z.infer<typeof aiQuoteDraftRequestSchema>;
export type AiQuoteDraftOutput = z.infer<typeof aiQuoteDraftOutputSchema>;
export type AiUsageMetrics = z.infer<typeof aiUsageMetricsSchema>;

export interface AiQuoteDraftProviderResult {
  draft: AiQuoteDraftOutput;
  metrics: AiUsageMetrics;
}

export interface AiQuoteDraftProvider {
  readonly providerName: string;
  generateQuoteDraft(
    input: AiQuoteDraftRequest
  ): Promise<AiQuoteDraftProviderResult>;
}

export interface QuoteDraftPrompt {
  version: typeof quoteDraftPromptVersion;
  system: string;
  user: string;
}

export function buildQuoteDraftPrompt(input: AiQuoteDraftRequest): QuoteDraftPrompt {
  const catalogContext = input.catalogHints.length
    ? input.catalogHints
        .map((hint) => `- ${hint.name} (${hint.productId})${hint.category ? ` / ${hint.category}` : ""}`)
        .join("\n")
    : "- Sem catalogo enviado. Use descricoes genericas e validaveis.";

  return {
    version: quoteDraftPromptVersion,
    system: [
      "Voce transforma pedidos comerciais em um draft JSON estruturado.",
      "Nunca calcule valores finais oficiais.",
      "Nunca grave dados diretamente.",
      "Responda apenas com JSON compativel com o schema ai.quote_draft.v1.",
      "Se houver incerteza, preencha warnings e use confidence menor."
    ].join("\n"),
    user: [
      `Moeda preferida: ${input.currency.toUpperCase()}`,
      input.budgetMaxCents
        ? `Budget maximo em centavos: ${input.budgetMaxCents}`
        : "Budget maximo nao informado.",
      "Catalogo disponivel:",
      catalogContext,
      "Pedido do usuario:",
      input.userText
    ].join("\n\n")
  };
}

export function validateAiQuoteDraftOutput(input: unknown): AiQuoteDraftOutput {
  return aiQuoteDraftOutputSchema.parse(input);
}

export function mapAiQuoteDraftToImportPayload(input: {
  customerId: string;
  draft: AiQuoteDraftOutput;
}): ImportQuoteJsonRequest {
  return {
    customerId: input.customerId,
    schemaVersion: input.draft.schemaVersion,
    currency: input.draft.currency.toUpperCase(),
    category: input.draft.category,
    ...(input.draft.budgetMaxCents
      ? { budgetMaxCents: input.draft.budgetMaxCents }
      : {}),
    ...(input.draft.usageContext
      ? { usageContext: input.draft.usageContext }
      : {}),
    ...(input.draft.publicNotes ? { notes: input.draft.publicNotes } : {}),
    items: input.draft.items.map((item) => ({
      type: item.type,
      model: item.model,
      quantity: item.quantity
    }))
  };
}
