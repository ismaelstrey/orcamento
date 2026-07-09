export type AiDraftReadinessTone = "success" | "warning" | "danger" | "muted";
export type AiDraftBudgetState = "missing" | "invalid" | "low" | "medium" | "high";
export type AiDraftChecklistStatus = "done" | "warning" | "blocked";
export type AiDraftSuggestionPriority = "high" | "medium" | "low";

export interface AiDraftWorkbenchInput {
  customerId: string;
  userText: string;
  budgetMaxCents: string;
  hasProvider: boolean;
  isLoadingCapabilities: boolean;
  capabilitiesError: string | null;
  customerCount: number;
  productCount: number;
}

export interface AiDraftPromptMetrics {
  characters: number;
  words: number;
  sentenceCount: number;
  hasQuantitySignal: boolean;
  hasUseCaseSignal: boolean;
  hasConstraintSignal: boolean;
  hasUrgencySignal: boolean;
  densityLabel: string;
}

export interface AiDraftBudgetInsight {
  state: AiDraftBudgetState;
  valueInCents: number | null;
  label: string;
  helper: string;
}

export interface AiDraftReadiness {
  score: number;
  tone: AiDraftReadinessTone;
  label: string;
  description: string;
  blockers: string[];
}

export interface AiDraftChecklistItem {
  id: string;
  label: string;
  description: string;
  status: AiDraftChecklistStatus;
}

export interface AiDraftSuggestion {
  id: string;
  title: string;
  description: string;
  priority: AiDraftSuggestionPriority;
  snippet: string;
}

export interface AiDraftWorkbench {
  metrics: AiDraftPromptMetrics;
  budget: AiDraftBudgetInsight;
  readiness: AiDraftReadiness;
  checklist: AiDraftChecklistItem[];
  suggestions: AiDraftSuggestion[];
  preview: {
    customerSelected: boolean;
    normalizedBudgetCents: number | null;
    promptExcerpt: string;
    catalogHintsLabel: string;
  };
}

const quantityPattern =
  /\b(\d+|dois|duas|tres|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez)\b/i;
const useCasePattern =
  /\b(uso|equipe|setor|comercial|administrativo|financeiro|viagem|atendimento|operacao|opera[cç][aã]o|vendas|cliente)\b/i;
const constraintPattern =
  /\b(ssd|garantia|bateria|memoria|mem[oó]ria|prazo|marca|modelo|limite|budget|orcamento|or[cç]amento|pre[cç]o|entrega|compatibilidade)\b/i;
const urgencyPattern =
  /\b(urgente|rapido|r[aá]pido|hoje|amanha|amanh[aã]|semana|prazo|imediato)\b/i;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function countWords(value: string): number {
  const normalizedValue = normalizeWhitespace(value);

  if (!normalizedValue) {
    return 0;
  }

  return normalizedValue.split(" ").filter(Boolean).length;
}

function countSentences(value: string): number {
  const normalizedValue = normalizeWhitespace(value);

  if (!normalizedValue) {
    return 0;
  }

  const sentenceMatches = normalizedValue.match(/[.!?]+/g);

  if (!sentenceMatches) {
    return 1;
  }

  return Math.max(1, sentenceMatches.length);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatCurrency(valueInCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(valueInCents / 100);
}

function normalizeBudgetDigits(value: string): string {
  return value.replace(/[^\d,.-]/g, "").trim();
}

export function parseAiDraftBudgetInput(value: string): number | null {
  const normalizedValue = normalizeBudgetDigits(value);

  if (!normalizedValue) {
    return value.trim() ? Number.NaN : null;
  }

  const hasComma = normalizedValue.includes(",");
  const hasDot = normalizedValue.includes(".");

  let decimalValue = normalizedValue;

  if (hasComma && hasDot) {
    const lastCommaIndex = normalizedValue.lastIndexOf(",");
    const lastDotIndex = normalizedValue.lastIndexOf(".");

    if (lastCommaIndex > lastDotIndex) {
      decimalValue = normalizedValue.replace(/\./g, "").replace(",", ".");
    } else {
      decimalValue = normalizedValue.replace(/,/g, "");
    }
  } else if (hasComma) {
    decimalValue = normalizedValue.replace(/\./g, "").replace(",", ".");
  } else if (hasDot) {
    const pieces = normalizedValue.split(".");
    const lastPiece = pieces.at(-1) ?? "";

    decimalValue =
      pieces.length > 2 && lastPiece.length === 3
        ? normalizedValue.replace(/\./g, "")
        : normalizedValue;
  }

  if (!/^-?\d+(\.\d+)?$/.test(decimalValue)) {
    return Number.NaN;
  }

  const numericValue = Number(decimalValue);

  if (!Number.isFinite(numericValue)) {
    return Number.NaN;
  }

  const cents = Math.round(numericValue * 100);

  return cents > 0 ? cents : Number.NaN;
}

export function buildAiDraftPromptMetrics(userText: string): AiDraftPromptMetrics {
  const normalizedText = normalizeWhitespace(userText);
  const words = countWords(normalizedText);
  const characters = normalizedText.length;

  let densityLabel = "Briefing vazio";

  if (words >= 45) {
    densityLabel = "Briefing completo";
  } else if (words >= 22) {
    densityLabel = "Briefing bom";
  } else if (words >= 10) {
    densityLabel = "Briefing curto";
  } else if (words > 0) {
    densityLabel = "Briefing insuficiente";
  }

  return {
    characters,
    words,
    sentenceCount: countSentences(normalizedText),
    hasQuantitySignal: quantityPattern.test(normalizedText),
    hasUseCaseSignal: useCasePattern.test(normalizedText),
    hasConstraintSignal: constraintPattern.test(normalizedText),
    hasUrgencySignal: urgencyPattern.test(normalizedText),
    densityLabel
  };
}

export function buildAiDraftBudgetInsight(value: string): AiDraftBudgetInsight {
  const parsedBudget = parseAiDraftBudgetInput(value);

  if (parsedBudget === null) {
    return {
      state: "missing",
      valueInCents: null,
      label: "Sem budget",
      helper: "Opcional, mas ajuda a IA a evitar sugestoes fora da faixa comercial."
    };
  }

  if (!Number.isInteger(parsedBudget) || parsedBudget <= 0) {
    return {
      state: "invalid",
      valueInCents: null,
      label: "Budget invalido",
      helper: "Use um valor positivo, por exemplo 12000,00."
    };
  }

  if (parsedBudget < 100000) {
    return {
      state: "low",
      valueInCents: parsedBudget,
      label: `${formatCurrency(parsedBudget)} informado`,
      helper: "Faixa baixa: revise se o briefing espera varios itens ou equipamentos premium."
    };
  }

  if (parsedBudget <= 2000000) {
    return {
      state: "medium",
      valueInCents: parsedBudget,
      label: `${formatCurrency(parsedBudget)} informado`,
      helper: "Faixa adequada para drafts com controle de escopo e quantidade."
    };
  }

  return {
    state: "high",
    valueInCents: parsedBudget,
    label: `${formatCurrency(parsedBudget)} informado`,
    helper: "Faixa alta: use o briefing para reforcar prioridade, marcas ou limites."
  };
}

function buildReadinessBlockers(input: {
  source: AiDraftWorkbenchInput;
  metrics: AiDraftPromptMetrics;
  budget: AiDraftBudgetInsight;
}): string[] {
  const blockers: string[] = [];

  if (input.source.capabilitiesError) {
    blockers.push("Nao foi possivel verificar o provider de IA.");
  }

  if (!input.source.isLoadingCapabilities && !input.source.hasProvider) {
    blockers.push("Nenhum provider de IA ativo para gerar o draft.");
  }

  if (input.source.customerCount === 0) {
    blockers.push("Cadastre ou carregue clientes antes de gerar um draft.");
  } else if (!input.source.customerId) {
    blockers.push("Selecione o cliente que recebera o orcamento.");
  }

  if (input.metrics.words < 10) {
    blockers.push("Descreva o briefing com pelo menos 10 palavras.");
  }

  if (input.budget.state === "invalid") {
    blockers.push("Corrija o budget maximo ou deixe o campo vazio.");
  }

  return blockers;
}

function calculateReadinessScore(input: {
  source: AiDraftWorkbenchInput;
  metrics: AiDraftPromptMetrics;
  budget: AiDraftBudgetInsight;
  blockers: string[];
}): number {
  if (input.source.isLoadingCapabilities) {
    return 15;
  }

  let score = 0;

  if (input.source.hasProvider) {
    score += 20;
  }

  if (input.source.customerId) {
    score += 15;
  }

  if (input.source.productCount > 0) {
    score += 10;
  }

  if (input.metrics.words >= 10) {
    score += 15;
  }

  if (input.metrics.words >= 22) {
    score += 10;
  }

  if (input.metrics.hasQuantitySignal) {
    score += 10;
  }

  if (input.metrics.hasUseCaseSignal) {
    score += 10;
  }

  if (input.metrics.hasConstraintSignal) {
    score += 5;
  }

  if (input.budget.state !== "invalid") {
    score += 5;
  }

  score -= input.blockers.length * 18;

  return clampScore(score);
}

export function buildAiDraftReadiness(input: {
  source: AiDraftWorkbenchInput;
  metrics: AiDraftPromptMetrics;
  budget: AiDraftBudgetInsight;
}): AiDraftReadiness {
  const blockers = buildReadinessBlockers(input);
  const score = calculateReadinessScore({ ...input, blockers });

  if (input.source.isLoadingCapabilities) {
    return {
      score,
      tone: "muted",
      label: "Verificando provider",
      description: "Aguarde a checagem de disponibilidade antes de gerar o JSON.",
      blockers
    };
  }

  if (blockers.length > 0) {
    return {
      score,
      tone: "danger",
      label: "Ainda nao pronto",
      description: "Resolva os bloqueios principais para evitar falhas na geracao.",
      blockers
    };
  }

  if (score >= 82) {
    return {
      score,
      tone: "success",
      label: "Pronto para gerar",
      description: "O briefing tem contexto suficiente para gerar um JSON revisavel.",
      blockers
    };
  }

  return {
    score,
    tone: "warning",
    label: "Pode melhorar",
    description:
      "O draft pode ser gerado, mas mais contexto aumenta a aderencia ao catalogo.",
    blockers
  };
}

export function buildAiDraftChecklist(input: {
  source: AiDraftWorkbenchInput;
  metrics: AiDraftPromptMetrics;
  budget: AiDraftBudgetInsight;
}): AiDraftChecklistItem[] {
  return [
    {
      id: "provider",
      label: "Provider",
      description: input.source.isLoadingCapabilities
        ? "Verificacao em andamento."
        : input.source.hasProvider
          ? "Provider ativo e pronto para retornar JSON revisavel."
          : "Configure um provider antes de usar a automacao.",
      status: input.source.hasProvider
        ? "done"
        : input.source.isLoadingCapabilities
          ? "warning"
          : "blocked"
    },
    {
      id: "customer",
      label: "Cliente",
      description: input.source.customerId
        ? "Cliente selecionado para vincular o payload importavel."
        : "Escolha o cliente que recebera o orcamento.",
      status: input.source.customerId ? "done" : "blocked"
    },
    {
      id: "briefing",
      label: "Briefing",
      description:
        input.metrics.words >= 22
          ? `${input.metrics.words} palavras com bom nivel de contexto.`
          : `${input.metrics.words} palavras; detalhe necessidade, quantidade e uso.`,
      status:
        input.metrics.words >= 22
          ? "done"
          : input.metrics.words >= 10
            ? "warning"
            : "blocked"
    },
    {
      id: "signals",
      label: "Sinais comerciais",
      description:
        input.metrics.hasQuantitySignal &&
        input.metrics.hasUseCaseSignal &&
        input.metrics.hasConstraintSignal
          ? "Quantidade, uso e restricoes aparecem no briefing."
          : "Inclua quantidade, contexto de uso e restricoes para reduzir ambiguidade.",
      status:
        input.metrics.hasQuantitySignal && input.metrics.hasUseCaseSignal
          ? input.metrics.hasConstraintSignal
            ? "done"
            : "warning"
          : "blocked"
    },
    {
      id: "budget",
      label: "Budget",
      description: input.budget.helper,
      status:
        input.budget.state === "invalid"
          ? "blocked"
          : input.budget.state === "missing"
            ? "warning"
            : "done"
    },
    {
      id: "catalog",
      label: "Catalogo",
      description:
        input.source.productCount > 0
          ? `${input.source.productCount} produto(s) disponiveis para pistas.`
          : "Carregue produtos para melhorar aderencia do modelo.",
      status: input.source.productCount > 0 ? "done" : "warning"
    }
  ];
}

export function buildAiDraftSuggestions(input: {
  metrics: AiDraftPromptMetrics;
  budget: AiDraftBudgetInsight;
}): AiDraftSuggestion[] {
  const suggestions: AiDraftSuggestion[] = [];

  if (input.metrics.words < 22) {
    suggestions.push({
      id: "add-context",
      title: "Detalhar contexto",
      description: "Explique quem vai usar, onde sera usado e qual resultado espera.",
      priority: "high",
      snippet:
        "Contexto: equipe comercial em visitas externas, precisa de mobilidade e autonomia de bateria."
    });
  }

  if (!input.metrics.hasQuantitySignal) {
    suggestions.push({
      id: "add-quantity",
      title: "Informar quantidade",
      description: "A quantidade reduz a chance de o draft gerar itens incompatíveis.",
      priority: "high",
      snippet: "Quantidade esperada: 3 unidades para iniciar a operacao."
    });
  }

  if (!input.metrics.hasConstraintSignal) {
    suggestions.push({
      id: "add-constraints",
      title: "Adicionar restricoes",
      description: "Inclua atributos tecnicos, garantia, prazo ou marcas preferidas.",
      priority: "medium",
      snippet: "Restricoes: SSD, 16GB de memoria, garantia comercial e entrega em ate 10 dias."
    });
  }

  if (input.budget.state === "missing") {
    suggestions.push({
      id: "add-budget",
      title: "Sugerir budget",
      description: "Mesmo opcional, o budget evita propostas acima do limite esperado.",
      priority: "low",
      snippet: "Budget maximo: R$ 12.000,00 para a primeira versao."
    });
  }

  if (!input.metrics.hasUseCaseSignal) {
    suggestions.push({
      id: "add-use-case",
      title: "Indicar uso",
      description: "O caso de uso ajuda a IA a escolher categoria e justificativa.",
      priority: "medium",
      snippet: "Uso principal: atendimento ao cliente, propostas e videoconferencias."
    });
  }

  if (input.metrics.hasUrgencySignal) {
    suggestions.push({
      id: "confirm-urgency",
      title: "Confirmar prazo",
      description: "Como ha urgencia no briefing, registre prazo e flexibilidade.",
      priority: "medium",
      snippet: "Prazo: precisa estar aprovado nesta semana; entrega pode ser parcial."
    });
  }

  return suggestions.slice(0, 4);
}

export function buildAiDraftPromptExcerpt(userText: string): string {
  const normalizedText = normalizeWhitespace(userText);

  if (!normalizedText) {
    return "Sem briefing informado.";
  }

  if (normalizedText.length <= 160) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, 157).trim()}...`;
}

export function buildAiDraftWorkbench(
  input: AiDraftWorkbenchInput
): AiDraftWorkbench {
  const metrics = buildAiDraftPromptMetrics(input.userText);
  const budget = buildAiDraftBudgetInsight(input.budgetMaxCents);
  const readiness = buildAiDraftReadiness({
    source: input,
    metrics,
    budget
  });

  return {
    metrics,
    budget,
    readiness,
    checklist: buildAiDraftChecklist({
      source: input,
      metrics,
      budget
    }),
    suggestions: buildAiDraftSuggestions({
      metrics,
      budget
    }),
    preview: {
      customerSelected: Boolean(input.customerId),
      normalizedBudgetCents: budget.valueInCents,
      promptExcerpt: buildAiDraftPromptExcerpt(input.userText),
      catalogHintsLabel:
        input.productCount > 0
          ? `${Math.min(input.productCount, 20)} pista(s) enviadas de ${input.productCount} produto(s)`
          : "Sem pistas de catalogo"
    }
  };
}
