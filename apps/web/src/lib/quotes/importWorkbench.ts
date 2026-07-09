import { importQuoteJsonRequestSchema } from "./schemas";

export type QuoteImportJsonStatus = "empty" | "invalid_json" | "invalid_schema" | "ready";
export type QuoteImportJsonTone = "muted" | "danger" | "warning" | "success";

export interface QuoteImportJsonWorkbenchInput {
  jsonText: string;
  isFromAi: boolean;
  customerCount: number;
}

export interface QuoteImportJsonIssue {
  path: string;
  message: string;
}

export interface QuoteImportJsonMetric {
  label: string;
  value: string;
  helper: string;
}

export interface QuoteImportJsonWorkbench {
  status: QuoteImportJsonStatus;
  tone: QuoteImportJsonTone;
  title: string;
  description: string;
  canSubmit: boolean;
  issues: QuoteImportJsonIssue[];
  metrics: QuoteImportJsonMetric[];
  preview: {
    customerId: string | null;
    category: string | null;
    currency: string | null;
    budgetLabel: string;
    itemCount: number;
    itemSummary: string;
    sourceLabel: string;
  };
}

function formatCurrency(valueInCents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency
    })
      .format(valueInCents / 100)
      .replace(/\u00a0/g, " ");
  } catch {
    return `${valueInCents} centavos`;
  }
}

function formatBytes(characters: number): string {
  if (characters < 1024) {
    return `${characters} B`;
  }

  return `${(characters / 1024).toFixed(1)} KB`;
}

function getPathLabel(path: PropertyKey[]): string {
  if (!path.length) {
    return "payload";
  }

  return path
    .map((part) => {
      if (typeof part === "number") {
        return `[${part}]`;
      }

      if (typeof part === "symbol") {
        return part.description ?? "symbol";
      }

      return part;
    })
    .join(".");
}

function summarizeItems(items: unknown): string {
  if (!Array.isArray(items) || items.length === 0) {
    return "Nenhum item detectado.";
  }

  return items
    .slice(0, 3)
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return `Item ${index + 1}`;
      }

      const record = item as Record<string, unknown>;
      const model =
        typeof record.model === "string" && record.model.trim()
          ? record.model.trim()
          : `Item ${index + 1}`;
      const quantity =
        typeof record.quantity === "number" && Number.isFinite(record.quantity)
          ? `${record.quantity}x`
          : "qtd. indefinida";

      return `${quantity} ${model}`;
    })
    .join(" | ");
}

function buildBaseMetrics(input: {
  jsonText: string;
  itemCount: number;
  issueCount: number;
  customerCount: number;
}): QuoteImportJsonMetric[] {
  return [
    {
      label: "Tamanho",
      value: formatBytes(input.jsonText.trim().length),
      helper: "Volume do payload colado na aba."
    },
    {
      label: "Itens",
      value: String(input.itemCount),
      helper: "Quantidade de linhas que o backend tentara normalizar."
    },
    {
      label: "Avisos",
      value: String(input.issueCount),
      helper: "Pendencias locais antes da importacao."
    },
    {
      label: "Clientes",
      value: String(input.customerCount),
      helper: "Base carregada para vinculo do draft."
    }
  ];
}

export function buildQuoteImportJsonWorkbench(
  input: QuoteImportJsonWorkbenchInput
): QuoteImportJsonWorkbench {
  const trimmedJson = input.jsonText.trim();

  if (!trimmedJson) {
    return {
      status: "empty",
      tone: "muted",
      title: "Aguardando payload",
      description: "Cole um JSON ou use o exemplo para visualizar a importacao.",
      canSubmit: false,
      issues: [],
      metrics: buildBaseMetrics({
        jsonText: input.jsonText,
        itemCount: 0,
        issueCount: 0,
        customerCount: input.customerCount
      }),
      preview: {
        customerId: null,
        category: null,
        currency: null,
        budgetLabel: "Nao informado",
        itemCount: 0,
        itemSummary: "Nenhum item detectado.",
        sourceLabel: input.isFromAi ? "Assistente IA" : "Manual"
      }
    };
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(trimmedJson) as unknown;
  } catch (error: unknown) {
    return {
      status: "invalid_json",
      tone: "danger",
      title: "JSON invalido",
      description:
        error instanceof Error
          ? error.message
          : "Nao foi possivel interpretar o texto como JSON.",
      canSubmit: false,
      issues: [
        {
          path: "payload",
          message: "Corrija a sintaxe do JSON antes de importar."
        }
      ],
      metrics: buildBaseMetrics({
        jsonText: input.jsonText,
        itemCount: 0,
        issueCount: 1,
        customerCount: input.customerCount
      }),
      preview: {
        customerId: null,
        category: null,
        currency: null,
        budgetLabel: "Nao informado",
        itemCount: 0,
        itemSummary: "Nenhum item detectado.",
        sourceLabel: input.isFromAi ? "Assistente IA" : "Manual"
      }
    };
  }

  const schemaResult = importQuoteJsonRequestSchema.safeParse(parsedJson);
  const record =
    parsedJson && typeof parsedJson === "object"
      ? (parsedJson as Record<string, unknown>)
      : {};
  const rawItems = record.items;
  const itemCount = Array.isArray(rawItems) ? rawItems.length : 0;
  const currency = typeof record.currency === "string" ? record.currency : "BRL";
  const budget =
    typeof record.budgetMaxCents === "number" && record.budgetMaxCents > 0
      ? formatCurrency(record.budgetMaxCents, currency)
      : "Nao informado";
  const preview = {
    customerId: typeof record.customerId === "string" ? record.customerId : null,
    category: typeof record.category === "string" ? record.category : null,
    currency: typeof record.currency === "string" ? record.currency : null,
    budgetLabel: budget,
    itemCount,
    itemSummary: summarizeItems(rawItems),
    sourceLabel: input.isFromAi ? "Assistente IA" : "Manual"
  };

  if (!schemaResult.success) {
    const issues = schemaResult.error.issues.slice(0, 6).map((issue) => ({
      path: getPathLabel(issue.path),
      message: issue.message
    }));

    return {
      status: "invalid_schema",
      tone: "warning",
      title: "Payload incompleto",
      description: "O JSON existe, mas ainda nao bate com o contrato de importacao.",
      canSubmit: false,
      issues,
      metrics: buildBaseMetrics({
        jsonText: input.jsonText,
        itemCount,
        issueCount: issues.length,
        customerCount: input.customerCount
      }),
      preview
    };
  }

  return {
    status: "ready",
    tone: "success",
    title: "Pronto para importar",
    description: "O payload esta coerente e pode criar um draft revisavel.",
    canSubmit: true,
    issues: [],
    metrics: buildBaseMetrics({
      jsonText: input.jsonText,
      itemCount: schemaResult.data.items.length,
      issueCount: 0,
      customerCount: input.customerCount
    }),
    preview: {
      customerId: schemaResult.data.customerId,
      category: schemaResult.data.category,
      currency: schemaResult.data.currency,
      budgetLabel: schemaResult.data.budgetMaxCents
        ? formatCurrency(schemaResult.data.budgetMaxCents, schemaResult.data.currency)
        : "Nao informado",
      itemCount: schemaResult.data.items.length,
      itemSummary: summarizeItems(schemaResult.data.items),
      sourceLabel: input.isFromAi ? "Assistente IA" : "Manual"
    }
  };
}
