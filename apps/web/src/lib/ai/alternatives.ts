export type AiAlternativeTone = "success" | "warning" | "danger";

export interface AiQuoteAlternative {
  id: string;
  label: string;
  totalCents: number;
  currency: string;
  confidence: number;
  items: number;
  pros: string[];
  cons: string[];
}

export interface AiAlternativeComparison {
  tone: AiAlternativeTone;
  recommendedAlternative: AiQuoteAlternative | null;
  alternatives: AiQuoteAlternative[];
  savingsVsHighestCents: number;
  confidenceLabel: string;
  customerSummary: string;
  decisionChecklist: string[];
  warnings: string[];
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function scoreAlternative(alternative: AiQuoteAlternative, lowestTotal: number): number {
  const relativePriceScore =
    alternative.totalCents > 0 ? lowestTotal / alternative.totalCents : 0;

  return (
    clampConfidence(alternative.confidence) * 55 +
    relativePriceScore * 25 +
    Math.min(alternative.pros.length, 3) * 5 -
    Math.min(alternative.cons.length, 3) * 4
  );
}

function getTone(alternatives: AiQuoteAlternative[]): AiAlternativeTone {
  if (alternatives.length === 0) {
    return "danger";
  }

  if (alternatives.length >= 2) {
    return "success";
  }

  return "warning";
}

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency
  }).format(cents / 100);
}

export function buildAiAlternativeComparison(
  alternatives: AiQuoteAlternative[]
): AiAlternativeComparison {
  const normalizedAlternatives = alternatives
    .filter((alternative) => alternative.id.trim() && alternative.totalCents > 0)
    .map((alternative) => ({
      ...alternative,
      currency: alternative.currency.toUpperCase(),
      confidence: clampConfidence(alternative.confidence)
    }));
  const lowestTotal = Math.min(
    ...normalizedAlternatives.map((alternative) => alternative.totalCents)
  );
  const highestTotal = Math.max(
    ...normalizedAlternatives.map((alternative) => alternative.totalCents)
  );
  const recommendedAlternative =
    normalizedAlternatives.length > 0
      ? [...normalizedAlternatives].sort(
          (left, right) =>
            scoreAlternative(right, lowestTotal) -
            scoreAlternative(left, lowestTotal)
        )[0] ?? null
      : null;
  const averageConfidence =
    normalizedAlternatives.length > 0
      ? normalizedAlternatives.reduce(
          (sum, alternative) => sum + alternative.confidence,
          0
        ) / normalizedAlternatives.length
      : 0;
  const warnings = [
    normalizedAlternatives.length === 0
      ? "Gere ao menos uma alternativa antes de comparar."
      : null,
    normalizedAlternatives.length === 1
      ? "A comparacao fica mais forte com pelo menos duas alternativas."
      : null,
    averageConfidence < 0.7
      ? "A confianca media das alternativas ainda esta baixa."
      : null
  ].filter(Boolean) as string[];
  const currency = recommendedAlternative?.currency ?? "BRL";
  const savingsVsHighestCents = recommendedAlternative
    ? Math.max(0, highestTotal - recommendedAlternative.totalCents)
    : 0;

  return {
    tone: getTone(normalizedAlternatives),
    recommendedAlternative,
    alternatives: normalizedAlternatives,
    savingsVsHighestCents,
    confidenceLabel:
      averageConfidence >= 0.85
        ? "Alta confianca"
        : averageConfidence >= 0.7
          ? "Confianca moderada"
          : "Confianca baixa",
    customerSummary: recommendedAlternative
      ? [
          `Opcao recomendada: ${recommendedAlternative.label}.`,
          `Total estimado ${formatMoney(recommendedAlternative.totalCents, currency)}.`,
          savingsVsHighestCents > 0
            ? `Economia potencial de ${formatMoney(savingsVsHighestCents, currency)} frente a opcao mais alta.`
            : "Use esta opcao como base para validar disponibilidade e preco final."
        ].join(" ")
      : "Gere alternativas para montar um resumo comercial para o cliente.",
    decisionChecklist: [
      "Validar disponibilidade dos itens antes de enviar a proposta.",
      "Confirmar se o cliente prioriza menor preco, prazo ou padrao tecnico.",
      "Registrar a alternativa recomendada como nota publica ou revisao interna."
    ],
    warnings
  };
}
