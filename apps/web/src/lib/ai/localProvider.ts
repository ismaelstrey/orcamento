import {
  quoteDraftOutputSchemaVersion,
  type AiQuoteDraftOutput,
  type AiQuoteDraftProvider,
  type AiQuoteDraftRequest
} from "./quoteDraft";

const numberWords = new Map<string, number>([
  ["um", 1],
  ["uma", 1],
  ["dois", 2],
  ["duas", 2],
  ["tres", 3],
  ["três", 3],
  ["quatro", 4],
  ["cinco", 5],
  ["seis", 6],
  ["sete", 7],
  ["oito", 8],
  ["nove", 9],
  ["dez", 10]
]);

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function inferQuantity(userText: string): number {
  const numericMatch = userText.match(/\b([1-9]\d{0,2})\b/);

  if (numericMatch?.[1]) {
    return Number(numericMatch[1]);
  }

  const normalizedText = normalizeText(userText);

  for (const [word, quantity] of numberWords) {
    if (normalizedText.includes(normalizeText(word))) {
      return quantity;
    }
  }

  return 1;
}

function selectCatalogHint(input: AiQuoteDraftRequest) {
  const normalizedBriefing = normalizeText(input.userText);

  return (
    input.catalogHints.find((hint) =>
      normalizeText(hint.name)
        .split(/\s+/)
        .some((token) => token.length > 3 && normalizedBriefing.includes(token))
    ) ?? input.catalogHints[0]
  );
}

function inferCategory(input: AiQuoteDraftRequest): string {
  const selectedHint = selectCatalogHint(input);

  if (selectedHint?.category) {
    return selectedHint.category;
  }

  if (normalizeText(input.userText).includes("notebook")) {
    return "notebooks";
  }

  return "geral";
}

function buildLocalDraft(input: AiQuoteDraftRequest): AiQuoteDraftOutput {
  const selectedHint = selectCatalogHint(input);
  const quantity = inferQuantity(input.userText);
  const category = inferCategory(input);
  const model = selectedHint?.name ?? "Item sugerido a partir do briefing";

  return {
    schemaVersion: quoteDraftOutputSchemaVersion,
    title: selectedHint
      ? `Orçamento assistido de ${selectedHint.name}`
      : "Orçamento assistido por briefing",
    category,
    currency: input.currency.toUpperCase(),
    ...(input.budgetMaxCents ? { budgetMaxCents: input.budgetMaxCents } : {}),
    usageContext: input.userText.slice(0, 500),
    publicNotes:
      "Draft preliminar gerado pelo provider local. Revise itens, preços e disponibilidade antes de enviar.",
    items: [
      {
        type: category,
        model,
        quantity,
        confidence: selectedHint ? 0.72 : 0.48,
        rationale: selectedHint
          ? "Item escolhido por proximidade textual com o catálogo enviado."
          : "Sem correspondência de catálogo suficiente; item genérico para revisão."
      }
    ],
    warnings: selectedHint
      ? ["Provider local é apenas um simulador determinístico para desenvolvimento."]
      : [
          "Nenhum item do catálogo foi associado com confiança.",
          "Provider local é apenas um simulador determinístico para desenvolvimento."
        ]
  };
}

export function createLocalQuoteDraftProvider(): AiQuoteDraftProvider {
  return {
    providerName: "local-deterministic",
    async generateQuoteDraft(input) {
      const startedAt = Date.now();
      const draft = buildLocalDraft(input);

      return {
        draft,
        metrics: {
          provider: "local",
          model: "local-deterministic-v1",
          promptTokens: Math.ceil(input.userText.length / 4),
          completionTokens: Math.ceil(JSON.stringify(draft).length / 4),
          totalTokens:
            Math.ceil(input.userText.length / 4) +
            Math.ceil(JSON.stringify(draft).length / 4),
          estimatedCostCents: 0,
          durationMs: Date.now() - startedAt
        }
      };
    }
  };
}
