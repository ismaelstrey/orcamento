import type { AiQuoteDraftOutput } from "./quoteDraft";

export type AiDraftReviewTone = "success" | "warning" | "danger";

export interface AiDraftReviewInput {
  draft: AiQuoteDraftOutput | null;
  acceptedItemIndexes: number[];
  rejectedItemIndexes: number[];
  reviewerNotes?: string;
  maxBudgetCents?: number;
}

export interface AiDraftReviewSummary {
  score: number;
  tone: AiDraftReviewTone;
  label: string;
  canImport: boolean;
  acceptedItems: number;
  rejectedItems: number;
  averageConfidence: number;
  warnings: string[];
  revisionNotes: string[];
  publicNoteSuggestion: string;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function uniqueIndexes(indexes: number[], maxExclusive: number): number[] {
  return Array.from(
    new Set(indexes.filter((index) => index >= 0 && index < maxExclusive))
  );
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getTone(score: number): AiDraftReviewTone {
  if (score >= 85) {
    return "success";
  }

  if (score >= 60) {
    return "warning";
  }

  return "danger";
}

function buildPublicNoteSuggestion(draft: AiQuoteDraftOutput | null): string {
  if (!draft) {
    return "Revise o briefing de IA antes de compartilhar uma proposta com o cliente.";
  }

  const usage = draft.usageContext
    ? ` Contexto considerado: ${draft.usageContext}`
    : "";

  return [
    `Proposta sugerida para ${draft.category.toLowerCase()}: ${draft.title}.`,
    `${draft.items.length} item(ns) foram estruturados para revisao comercial.${usage}`
  ].join(" ");
}

export function buildAiDraftReviewSummary(
  input: AiDraftReviewInput
): AiDraftReviewSummary {
  if (!input.draft) {
    return {
      score: 0,
      tone: "danger",
      label: "Nenhum draft para revisar",
      canImport: false,
      acceptedItems: 0,
      rejectedItems: 0,
      averageConfidence: 0,
      warnings: ["Gere um draft antes de iniciar a revisao."],
      revisionNotes: ["Abra a aba Assistente IA e gere um JSON estruturado."],
      publicNoteSuggestion: buildPublicNoteSuggestion(null)
    };
  }

  const itemCount = input.draft.items.length;
  const acceptedIndexes = uniqueIndexes(input.acceptedItemIndexes, itemCount);
  const rejectedIndexes = uniqueIndexes(input.rejectedItemIndexes, itemCount);
  const averageConfidence = average(
    input.draft.items.map((item) => item.confidence)
  );
  const hasBudgetConflict =
    Boolean(input.maxBudgetCents && input.draft.budgetMaxCents) &&
    Number(input.draft.budgetMaxCents) > Number(input.maxBudgetCents);
  const warnings = [
    ...input.draft.warnings,
    averageConfidence < 0.72
      ? "Confianca media baixa: revise item por item antes de importar."
      : null,
    acceptedIndexes.length === 0
      ? "Nenhum item foi marcado como aceito para importacao."
      : null,
    rejectedIndexes.length > 0
      ? "Ha itens rejeitados que precisam de ajuste ou exclusao."
      : null,
    hasBudgetConflict
      ? "Budget sugerido pelo draft excede o limite comercial informado."
      : null
  ].filter(Boolean) as string[];
  const revisionNotes = [
    input.reviewerNotes?.trim() ? input.reviewerNotes.trim() : null,
    rejectedIndexes.length > 0
      ? "Gerar nova revisao removendo ou substituindo os itens rejeitados."
      : null,
    averageConfidence < 0.72
      ? "Adicionar mais contexto de uso, quantidade, restricoes e urgencia."
      : null,
    hasBudgetConflict
      ? "Recalibrar o briefing para respeitar o teto de budget."
      : null
  ].filter(Boolean) as string[];
  let score = 40;

  if (itemCount > 0) {
    score += 15;
  }

  score += averageConfidence * 25;
  score += Math.min(acceptedIndexes.length, itemCount) * 8;

  if (input.draft.publicNotes?.trim()) {
    score += 5;
  }

  if (input.reviewerNotes?.trim()) {
    score += 5;
  }

  score -= rejectedIndexes.length * 12;
  score -= input.draft.warnings.length * 5;

  if (hasBudgetConflict) {
    score -= 15;
  }

  const finalScore = clampScore(score);
  const tone = getTone(finalScore);

  return {
    score: finalScore,
    tone,
    label:
      tone === "success"
        ? "Draft pronto para importar"
        : "Draft precisa de revisao antes da importacao",
    canImport:
      tone === "success" &&
      acceptedIndexes.length > 0 &&
      rejectedIndexes.length === 0 &&
      !hasBudgetConflict,
    acceptedItems: acceptedIndexes.length,
    rejectedItems: rejectedIndexes.length,
    averageConfidence: Number(averageConfidence.toFixed(2)),
    warnings,
    revisionNotes,
    publicNoteSuggestion: buildPublicNoteSuggestion(input.draft)
  };
}
