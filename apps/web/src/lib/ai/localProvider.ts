import {
  quoteDraftMaxGeneratedItems,
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

function scoreCatalogHints(input: AiQuoteDraftRequest) {
  const normalizedBriefing = normalizeText(input.userText);

  return input.catalogHints
    .map((hint) => {
      const nameScore = normalizeText(hint.name)
        .split(/\s+/)
        .filter((token) => token.length > 3 && normalizedBriefing.includes(token))
        .length;
      const categoryScore = hint.category
        ? normalizeText(hint.category)
            .split(/\s+/)
            .filter(
              (token) => token.length > 3 && normalizedBriefing.includes(token)
            ).length
        : 0;

      return {
        hint,
        score: nameScore + categoryScore * 2
      };
    })
    .sort((leftHint, rightHint) => rightHint.score - leftHint.score);
}

function selectCatalogHints(input: AiQuoteDraftRequest) {
  const matchedHints = scoreCatalogHints(input)
    .filter((scoredHint) => scoredHint.score > 0)
    .slice(0, quoteDraftMaxGeneratedItems)
    .map((scoredHint) => scoredHint.hint);

  if (matchedHints.length) {
    return matchedHints;
  }

  return input.catalogHints[0] ? [input.catalogHints[0]] : [];
}

function selectCatalogHint(input: AiQuoteDraftRequest) {
  const scoredHints = scoreCatalogHints(input);
  return scoredHints[0]?.score ? scoredHints[0].hint : input.catalogHints[0];
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
  const selectedHints = selectCatalogHints(input);
  const selectedHint = selectedHints[0];
  const quantity = inferQuantity(input.userText);
  const category = inferCategory(input);
  const model = selectedHint?.name ?? "Item sugerido a partir do briefing";
  const warnings = selectedHint
    ? ["Provider local e apenas um simulador deterministico para desenvolvimento."]
    : [
        "Nenhum item do catalogo foi associado com confianca.",
        "Provider local e apenas um simulador deterministico para desenvolvimento."
      ];

  if (selectedHints.length > 1) {
    warnings.push(
      "Mais de um item foi sugerido pelo provider local; revise quantidades e compatibilidade."
    );
  }

  return {
    schemaVersion: quoteDraftOutputSchemaVersion,
    title: selectedHint
      ? `Orcamento assistido de ${selectedHint.name}`
      : "Orcamento assistido por briefing",
    category,
    currency: input.currency.toUpperCase(),
    ...(input.budgetMaxCents ? { budgetMaxCents: input.budgetMaxCents } : {}),
    usageContext: input.userText.slice(0, 500),
    publicNotes:
      "Draft preliminar gerado pelo provider local. Revise itens, precos e disponibilidade antes de enviar.",
    items: selectedHints.length
      ? selectedHints.map((hint) => ({
          type: hint.category ?? category,
          model: hint.name,
          quantity,
          confidence: 0.72,
          rationale: "Item escolhido por proximidade textual com o catalogo enviado."
        }))
      : [
          {
            type: category,
            model,
            quantity,
            confidence: 0.48,
            rationale:
              "Sem correspondencia de catalogo suficiente; item generico para revisao."
          }
        ],
    warnings
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
