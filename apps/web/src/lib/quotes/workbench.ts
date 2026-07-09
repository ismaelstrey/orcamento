import type { CustomerResponse } from "@/lib/customers/schemas";
import type { QuoteDetail, QuoteSummary } from "./schemas";

export type QuoteStatusFilter = "all" | QuoteSummary["status"];
export type QuoteValueBandFilter =
  | "all"
  | "up_to_1k"
  | "from_1k_to_5k"
  | "from_5k_to_20k"
  | "above_20k";
export type QuoteSortKey =
  | "updated_desc"
  | "updated_asc"
  | "total_desc"
  | "total_asc"
  | "title_asc"
  | "customer_asc";
export type QuotePipelinePriority = "urgent" | "high" | "normal" | "low";
export type QuoteRiskTone = "success" | "warning" | "danger" | "muted";

export interface QuoteWorkbenchFilters {
  query: string;
  status: QuoteStatusFilter;
  valueBand: QuoteValueBandFilter;
  sort: QuoteSortKey;
}

export interface QuoteWorkbenchPage {
  page: number;
  pageSize: number;
}

export interface QuoteWorkbenchViewModel {
  id: string;
  customerId: string;
  title: string;
  customerName: string;
  status: QuoteSummary["status"];
  statusLabel: string;
  statusTone: "neutral" | "success" | "muted";
  versionLabel: string;
  totalCents: number;
  currency: string;
  updatedAt: string;
  updatedAtMs: number;
  valueBand: Exclude<QuoteValueBandFilter, "all">;
  insight: string;
  searchText: string;
}

export interface QuoteWorkbenchPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface QuoteWorkbenchSummary {
  totalQuotes: number;
  visibleQuotes: number;
  draftQuotes: number;
  publishedQuotes: number;
  archivedQuotes: number;
  totalVisibleCents: number;
  averageVisibleCents: number;
  highestVisibleQuote: QuoteWorkbenchViewModel | null;
  mostRecentVisibleQuote: QuoteWorkbenchViewModel | null;
}

export interface QuotePipelineCard {
  id: string;
  quoteId: string;
  title: string;
  customerName: string;
  valueLabel: string;
  priority: QuotePipelinePriority;
  priorityLabel: string;
  riskTone: QuoteRiskTone;
  statusLabel: string;
  actionLabel: string;
  reason: string;
  href: string;
}

export interface QuotePipelineHealth {
  score: number;
  label: string;
  tone: QuoteRiskTone;
  description: string;
}

export interface QuotePipelineNarrative {
  headline: string;
  body: string;
  bullets: string[];
}

export interface QuotePipelineStage {
  key: QuoteSummary["status"];
  label: string;
  count: number;
  totalCents: number;
  valueLabel: string;
  description: string;
}

export interface QuotePipelineSnapshot {
  health: QuotePipelineHealth;
  narrative: QuotePipelineNarrative;
  stages: QuotePipelineStage[];
  priorityCards: QuotePipelineCard[];
}

export interface QuoteDetailVersionViewModel {
  id: string;
  versionNumber: number;
  label: string;
  sourceLabel: string;
  totalLabel: string;
  itemCount: number;
  createdAt: string;
  isCurrent: boolean;
}

export interface QuoteDetailSnapshot {
  quoteId: string;
  title: string;
  customerName: string;
  statusLabel: string;
  currentVersionLabel: string;
  currentTotalLabel: string;
  totalVersions: number;
  totalItems: number;
  averageItemValueLabel: string;
  sourceMixLabel: string;
  timeline: QuoteDetailVersionViewModel[];
  actionHints: string[];
}

export const quoteWorkbenchPageSize = 5;

const quotePipelinePriorityLabels: Record<QuotePipelinePriority, string> = {
  urgent: "Urgente",
  high: "Alta",
  normal: "Normal",
  low: "Baixa"
};

export const quoteStatusFilterOptions: Array<{
  value: QuoteStatusFilter;
  label: string;
}> = [
  { value: "all", label: "Todos" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Arquivado" }
];

export const quoteValueBandOptions: Array<{
  value: QuoteValueBandFilter;
  label: string;
}> = [
  { value: "all", label: "Todos os valores" },
  { value: "up_to_1k", label: "Ate R$ 1 mil" },
  { value: "from_1k_to_5k", label: "R$ 1 mil a R$ 5 mil" },
  { value: "from_5k_to_20k", label: "R$ 5 mil a R$ 20 mil" },
  { value: "above_20k", label: "Acima de R$ 20 mil" }
];

export const quoteSortOptions: Array<{
  value: QuoteSortKey;
  label: string;
}> = [
  { value: "updated_desc", label: "Atualizados recentemente" },
  { value: "updated_asc", label: "Atualizados primeiro" },
  { value: "total_desc", label: "Maior valor" },
  { value: "total_asc", label: "Menor valor" },
  { value: "title_asc", label: "Titulo A-Z" },
  { value: "customer_asc", label: "Cliente A-Z" }
];

const defaultQuoteWorkbenchFilters: QuoteWorkbenchFilters = {
  query: "",
  status: "all",
  valueBand: "all",
  sort: "updated_desc"
};

export function getDefaultQuoteWorkbenchFilters(): QuoteWorkbenchFilters {
  return { ...defaultQuoteWorkbenchFilters };
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function formatQuoteStatusLabel(status: QuoteSummary["status"]): string {
  if (status === "draft") {
    return "Draft";
  }

  if (status === "published") {
    return "Publicado";
  }

  return "Arquivado";
}

export function formatQuoteCurrency(
  valueInCents: number,
  currency: string
): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency
  }).format(valueInCents / 100);
}

export function getQuoteStatusTone(
  status: QuoteSummary["status"]
): QuoteWorkbenchViewModel["statusTone"] {
  if (status === "published") {
    return "success";
  }

  if (status === "archived") {
    return "muted";
  }

  return "neutral";
}

export function classifyQuoteValueBand(
  totalCents: number
): Exclude<QuoteValueBandFilter, "all"> {
  if (totalCents <= 100000) {
    return "up_to_1k";
  }

  if (totalCents <= 500000) {
    return "from_1k_to_5k";
  }

  if (totalCents <= 2000000) {
    return "from_5k_to_20k";
  }

  return "above_20k";
}

function buildCustomerMap(customers: CustomerResponse[]): Map<string, CustomerResponse> {
  return new Map(customers.map((customer) => [customer.id, customer]));
}

function buildQuoteInsight(input: {
  status: QuoteSummary["status"];
  versionNumber: number;
  totalCents: number;
}): string {
  if (input.status === "published") {
    return `Versao ${input.versionNumber} publicada e pronta para distribuicao.`;
  }

  if (input.status === "archived") {
    return `Orcamento arquivado na versao ${input.versionNumber}.`;
  }

  if (input.totalCents === 0) {
    return `Draft na versao ${input.versionNumber} ainda sem valor comercial.`;
  }

  return `Draft aberto na versao ${input.versionNumber} para revisao comercial.`;
}

function buildQuoteSearchText(input: {
  quote: QuoteSummary;
  customerName: string;
  statusLabel: string;
  versionLabel: string;
  valueBand: string;
  insight: string;
}): string {
  return normalizeSearchText(
    [
      input.quote.id,
      input.quote.customerId,
      input.quote.title,
      input.quote.status,
      input.customerName,
      input.statusLabel,
      input.versionLabel,
      input.valueBand,
      input.insight,
      input.quote.currentVersion.currency,
      input.quote.currentVersion.totalCents
    ].join(" ")
  );
}

export function buildQuoteWorkbenchViewModel(input: {
  quote: QuoteSummary;
  customers: CustomerResponse[];
}): QuoteWorkbenchViewModel {
  const customerMap = buildCustomerMap(input.customers);
  const customer = customerMap.get(input.quote.customerId);
  const customerName = customer?.name ?? "Cliente nao carregado";
  const statusLabel = formatQuoteStatusLabel(input.quote.status);
  const statusTone = getQuoteStatusTone(input.quote.status);
  const versionLabel = `Versao atual: ${input.quote.currentVersion.versionNumber}`;
  const valueBand = classifyQuoteValueBand(input.quote.currentVersion.totalCents);
  const insight = buildQuoteInsight({
    status: input.quote.status,
    versionNumber: input.quote.currentVersion.versionNumber,
    totalCents: input.quote.currentVersion.totalCents
  });

  return {
    id: input.quote.id,
    customerId: input.quote.customerId,
    title: input.quote.title,
    customerName,
    status: input.quote.status,
    statusLabel,
    statusTone,
    versionLabel,
    totalCents: input.quote.currentVersion.totalCents,
    currency: input.quote.currentVersion.currency,
    updatedAt: input.quote.updatedAt,
    updatedAtMs: new Date(input.quote.updatedAt).getTime(),
    valueBand,
    insight,
    searchText: buildQuoteSearchText({
      quote: input.quote,
      customerName,
      statusLabel,
      versionLabel,
      valueBand,
      insight
    })
  };
}

export function buildQuoteWorkbenchViewModels(input: {
  quotes: QuoteSummary[];
  customers: CustomerResponse[];
}): QuoteWorkbenchViewModel[] {
  return input.quotes.map((quote) =>
    buildQuoteWorkbenchViewModel({
      quote,
      customers: input.customers
    })
  );
}

function compareByString(leftValue: string, rightValue: string): number {
  return leftValue.localeCompare(rightValue, "pt-BR", {
    sensitivity: "base"
  });
}

export function sortQuoteWorkbenchViewModels(
  quotes: QuoteWorkbenchViewModel[],
  sort: QuoteSortKey
): QuoteWorkbenchViewModel[] {
  return [...quotes].sort((leftQuote, rightQuote) => {
    if (sort === "updated_asc") {
      return leftQuote.updatedAtMs - rightQuote.updatedAtMs;
    }

    if (sort === "total_desc") {
      return rightQuote.totalCents - leftQuote.totalCents;
    }

    if (sort === "total_asc") {
      return leftQuote.totalCents - rightQuote.totalCents;
    }

    if (sort === "title_asc") {
      return compareByString(leftQuote.title, rightQuote.title);
    }

    if (sort === "customer_asc") {
      return compareByString(leftQuote.customerName, rightQuote.customerName);
    }

    return rightQuote.updatedAtMs - leftQuote.updatedAtMs;
  });
}

export function filterQuoteWorkbenchViewModels(
  quotes: QuoteWorkbenchViewModel[],
  filters: QuoteWorkbenchFilters
): QuoteWorkbenchViewModel[] {
  const normalizedQuery = normalizeSearchText(filters.query);

  const filteredQuotes = quotes.filter((quote) => {
    const matchesStatus = filters.status === "all" || quote.status === filters.status;
    const matchesValueBand =
      filters.valueBand === "all" || quote.valueBand === filters.valueBand;
    const matchesQuery =
      !normalizedQuery || quote.searchText.includes(normalizedQuery);

    return matchesStatus && matchesValueBand && matchesQuery;
  });

  return sortQuoteWorkbenchViewModels(filteredQuotes, filters.sort);
}

export function buildQuoteWorkbenchPagination(input: {
  totalItems: number;
  page: number;
  pageSize?: number;
}): QuoteWorkbenchPagination {
  const pageSize = input.pageSize ?? quoteWorkbenchPageSize;
  const totalPages = Math.max(1, Math.ceil(input.totalItems / pageSize));
  const page = Math.min(Math.max(input.page, 1), totalPages);
  const startItem = input.totalItems ? (page - 1) * pageSize + 1 : 0;
  const endItem = Math.min(page * pageSize, input.totalItems);

  return {
    page,
    pageSize,
    totalItems: input.totalItems,
    totalPages,
    startItem,
    endItem,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages
  };
}

export function paginateQuoteWorkbenchViewModels(input: {
  quotes: QuoteWorkbenchViewModel[];
  pagination: Pick<QuoteWorkbenchPagination, "page" | "pageSize">;
}): QuoteWorkbenchViewModel[] {
  const startIndex = (input.pagination.page - 1) * input.pagination.pageSize;

  return input.quotes.slice(startIndex, startIndex + input.pagination.pageSize);
}

export function buildQuoteWorkbenchSummary(input: {
  allQuotes: QuoteWorkbenchViewModel[];
  visibleQuotes: QuoteWorkbenchViewModel[];
}): QuoteWorkbenchSummary {
  const totalVisibleCents = input.visibleQuotes.reduce(
    (total, quote) => total + quote.totalCents,
    0
  );
  const sortedByValue = [...input.visibleQuotes].sort(
    (leftQuote, rightQuote) => rightQuote.totalCents - leftQuote.totalCents
  );
  const sortedByUpdate = [...input.visibleQuotes].sort(
    (leftQuote, rightQuote) => rightQuote.updatedAtMs - leftQuote.updatedAtMs
  );

  return {
    totalQuotes: input.allQuotes.length,
    visibleQuotes: input.visibleQuotes.length,
    draftQuotes: input.allQuotes.filter((quote) => quote.status === "draft").length,
    publishedQuotes: input.allQuotes.filter((quote) => quote.status === "published")
      .length,
    archivedQuotes: input.allQuotes.filter((quote) => quote.status === "archived")
      .length,
    totalVisibleCents,
    averageVisibleCents: input.visibleQuotes.length
      ? Math.round(totalVisibleCents / input.visibleQuotes.length)
      : 0,
    highestVisibleQuote: sortedByValue[0] ?? null,
    mostRecentVisibleQuote: sortedByUpdate[0] ?? null
  };
}

function getQuotePipelinePriority(
  quote: QuoteWorkbenchViewModel
): QuotePipelinePriority {
  if (quote.status === "draft" && quote.totalCents >= 2_000_000) {
    return "urgent";
  }

  if (quote.status === "draft" && quote.totalCents >= 500_000) {
    return "high";
  }

  if (quote.status === "published") {
    return "normal";
  }

  if (quote.status === "archived") {
    return "low";
  }

  return "normal";
}

function getQuotePipelineRiskTone(
  quote: QuoteWorkbenchViewModel
): QuoteRiskTone {
  if (quote.status === "draft" && quote.totalCents >= 2_000_000) {
    return "danger";
  }

  if (quote.status === "draft") {
    return "warning";
  }

  if (quote.status === "published") {
    return "success";
  }

  return "muted";
}

function buildQuotePipelineActionLabel(quote: QuoteWorkbenchViewModel): string {
  if (quote.status === "draft" && quote.totalCents === 0) {
    return "Revisar itens";
  }

  if (quote.status === "draft") {
    return "Publicar proposta";
  }

  if (quote.status === "published") {
    return "Acompanhar link";
  }

  return "Consultar historico";
}

function buildQuotePipelineReason(quote: QuoteWorkbenchViewModel): string {
  if (quote.status === "draft" && quote.totalCents >= 2_000_000) {
    return "Draft de alto valor parado no funil comercial.";
  }

  if (quote.status === "draft") {
    return "Ainda depende de revisao antes da distribuicao.";
  }

  if (quote.status === "published") {
    return "Proposta publicada deve ser acompanhada ate decisao do cliente.";
  }

  return "Orcamento arquivado preserva contexto historico.";
}

export function buildQuotePipelineCards(
  quotes: QuoteWorkbenchViewModel[]
): QuotePipelineCard[] {
  const priorityWeight: Record<QuotePipelinePriority, number> = {
    urgent: 4,
    high: 3,
    normal: 2,
    low: 1
  };

  return quotes
    .map((quote) => {
      const priority = getQuotePipelinePriority(quote);

      return {
        id: `${quote.id}:${priority}`,
        quoteId: quote.id,
        title: quote.title,
        customerName: quote.customerName,
        valueLabel: formatQuoteCurrency(quote.totalCents, quote.currency),
        priority,
        priorityLabel: quotePipelinePriorityLabels[priority],
        riskTone: getQuotePipelineRiskTone(quote),
        statusLabel: quote.statusLabel,
        actionLabel: buildQuotePipelineActionLabel(quote),
        reason: buildQuotePipelineReason(quote),
        href: `/quotes?quoteId=${quote.id}`
      };
    })
    .sort((leftCard, rightCard) => {
      const priorityDelta =
        priorityWeight[rightCard.priority] - priorityWeight[leftCard.priority];

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return (
        (quotes.find((quote) => quote.id === rightCard.quoteId)?.totalCents ?? 0) -
        (quotes.find((quote) => quote.id === leftCard.quoteId)?.totalCents ?? 0)
      );
    })
    .slice(0, 5);
}

export function buildQuotePipelineStages(
  quotes: QuoteWorkbenchViewModel[]
): QuotePipelineStage[] {
  const stageDefinitions: Array<{
    key: QuoteSummary["status"];
    label: string;
    description: string;
  }> = [
    {
      key: "draft",
      label: "Draft",
      description: "Propostas em preparacao ou revisao comercial."
    },
    {
      key: "published",
      label: "Publicado",
      description: "Propostas prontas para consumo externo."
    },
    {
      key: "archived",
      label: "Arquivado",
      description: "Historico preservado para consulta."
    }
  ];

  return stageDefinitions.map((stage) => {
    const stageQuotes = quotes.filter((quote) => quote.status === stage.key);
    const totalCents = stageQuotes.reduce(
      (sum, quote) => sum + quote.totalCents,
      0
    );

    return {
      ...stage,
      count: stageQuotes.length,
      totalCents,
      valueLabel: formatQuoteCurrency(
        totalCents,
        stageQuotes[0]?.currency ?? "BRL"
      )
    };
  });
}

export function buildQuotePipelineHealth(
  summary: QuoteWorkbenchSummary
): QuotePipelineHealth {
  if (summary.totalQuotes === 0) {
    return {
      score: 0,
      label: "Pipeline vazio",
      tone: "danger",
      description: "Crie ou importe o primeiro orcamento para iniciar leitura comercial."
    };
  }

  let score = 35;

  if (summary.visibleQuotes > 0) {
    score += 15;
  }

  if (summary.publishedQuotes > 0) {
    score += 25;
  }

  if (summary.draftQuotes > 0) {
    score += 10;
  }

  if (summary.archivedQuotes > 0) {
    score += 5;
  }

  if (summary.averageVisibleCents > 0) {
    score += 10;
  }

  if (score >= 80) {
    return {
      score,
      label: "Pipeline ativo",
      tone: "success",
      description: "Ha propostas em movimento, historico e valor comercial visivel."
    };
  }

  if (score >= 55) {
    return {
      score,
      label: "Pipeline em aquecimento",
      tone: "warning",
      description: "O funil tem volume, mas ainda precisa de publicacao ou follow-up."
    };
  }

  return {
    score,
    label: "Pipeline inicial",
    tone: "danger",
    description: "A operacao ainda depende de mais orcamentos e distribuicao."
  };
}

export function buildQuotePipelineNarrative(input: {
  summary: QuoteWorkbenchSummary;
  filters: QuoteWorkbenchFilters;
}): QuotePipelineNarrative {
  const { summary, filters } = input;

  if (summary.totalQuotes === 0) {
    return {
      headline: "Pipeline pronto para o primeiro orcamento",
      body: "A tela ainda nao tem propostas registradas. O melhor caminho e criar um draft manual ou importar um JSON revisavel para validar o fluxo completo.",
      bullets: [
        "Cadastre clientes e produtos antes de montar propostas recorrentes.",
        "Use a aba Assistente IA para transformar briefing em JSON quando houver provider ativo.",
        "Depois de publicar, acompanhe links e versoes pelo modal roteado."
      ]
    };
  }

  if (summary.visibleQuotes === 0 && hasActiveQuoteWorkbenchFilters(filters)) {
    return {
      headline: "Filtros ocultam todo o pipeline",
      body: "A base possui orcamentos, mas a combinacao atual de busca, status e valor removeu todos da lista.",
      bullets: [
        "Limpe os filtros para recuperar a leitura geral.",
        "Use status e faixa de valor separadamente quando precisar investigar gargalos.",
        "Exporte CSV apenas depois de confirmar a consulta visivel."
      ]
    };
  }

  const bullets = [
    `${summary.draftQuotes} draft(s) podem receber revisao ou publicacao.`,
    `${summary.publishedQuotes} proposta(s) ja estao publicadas.`,
    `Valor visivel medio: ${formatQuoteCurrency(
      summary.averageVisibleCents,
      summary.highestVisibleQuote?.currency ?? "BRL"
    )}.`
  ];

  if (summary.draftQuotes > summary.publishedQuotes) {
    return {
      headline: "Pipeline concentrado em drafts",
      body: "A maior parte do trabalho esta antes da publicacao. Priorize revisao de valor, itens e notas para liberar propostas ao cliente.",
      bullets
    };
  }

  if (summary.publishedQuotes > 0) {
    return {
      headline: "Pipeline com propostas em distribuicao",
      body: "Existem propostas publicadas que merecem acompanhamento comercial e revisao de links ativos.",
      bullets
    };
  }

  return {
    headline: "Pipeline em acompanhamento",
    body: "O conjunto filtrado tem historico util para leitura comercial e priorizacao das proximas acoes.",
    bullets
  };
}

export function buildQuotePipelineSnapshot(input: {
  summary: QuoteWorkbenchSummary;
  filters: QuoteWorkbenchFilters;
  visibleQuotes: QuoteWorkbenchViewModel[];
}): QuotePipelineSnapshot {
  return {
    health: buildQuotePipelineHealth(input.summary),
    narrative: buildQuotePipelineNarrative({
      summary: input.summary,
      filters: input.filters
    }),
    stages: buildQuotePipelineStages(input.visibleQuotes),
    priorityCards: buildQuotePipelineCards(input.visibleQuotes)
  };
}

function formatQuoteSourceType(
  sourceType: QuoteDetail["versions"][number]["sourceType"]
): string {
  if (sourceType === "import_json") {
    return "Importacao JSON";
  }

  if (sourceType === "ai_future") {
    return "IA";
  }

  return "Manual";
}

export function buildQuoteDetailTimeline(
  detail: QuoteDetail
): QuoteDetailVersionViewModel[] {
  return [...detail.versions]
    .sort(
      (leftVersion, rightVersion) =>
        rightVersion.versionNumber - leftVersion.versionNumber
    )
    .map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      label: version.label || `Versao ${version.versionNumber}`,
      sourceLabel: formatQuoteSourceType(version.sourceType),
      totalLabel: formatQuoteCurrency(version.totalCents, version.currency),
      itemCount: version.items.length,
      createdAt: version.createdAt,
      isCurrent: version.id === detail.currentVersion.id
    }));
}

function buildQuoteDetailActionHints(input: {
  detail: QuoteDetail;
  currentVersion: QuoteDetail["versions"][number] | null;
}): string[] {
  const hints: string[] = [];

  if (input.detail.status === "draft") {
    hints.push("Revise itens e notas antes de publicar a proposta.");
  }

  if (input.detail.status === "published") {
    hints.push("Acompanhe links compartilhados e gere PDF quando necessario.");
  }

  if (input.currentVersion && input.currentVersion.items.length === 0) {
    hints.push("Versao atual sem itens; crie uma revisao com produtos validos.");
  }

  if (input.currentVersion && input.currentVersion.totalCents === 0) {
    hints.push("Total zerado pede revisao de precos unitarios.");
  }

  if (input.detail.versions.length > 1) {
    hints.push("Compare versoes para entender mudancas de escopo e preco.");
  }

  if (!hints.length) {
    hints.push("Orcamento pronto para acompanhamento comercial.");
  }

  return hints.slice(0, 4);
}

export function buildQuoteDetailSnapshot(input: {
  detail: QuoteDetail;
  customerName?: string | null;
}): QuoteDetailSnapshot {
  const currentVersion =
    input.detail.versions.find(
      (version) => version.id === input.detail.currentVersion.id
    ) ?? null;
  const timeline = buildQuoteDetailTimeline(input.detail);
  const totalItems =
    currentVersion?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const sourceTypes = new Set(
    input.detail.versions.map((version) => formatQuoteSourceType(version.sourceType))
  );
  const averageItemValueCents =
    currentVersion && totalItems > 0
      ? Math.round(currentVersion.totalCents / totalItems)
      : 0;

  return {
    quoteId: input.detail.id,
    title: input.detail.title,
    customerName: input.customerName || "Cliente nao carregado",
    statusLabel: formatQuoteStatusLabel(input.detail.status),
    currentVersionLabel: `Versao atual: ${input.detail.currentVersion.versionNumber}`,
    currentTotalLabel: formatQuoteCurrency(
      input.detail.currentVersion.totalCents,
      input.detail.currentVersion.currency
    ),
    totalVersions: input.detail.versions.length,
    totalItems,
    averageItemValueLabel: formatQuoteCurrency(
      averageItemValueCents,
      input.detail.currentVersion.currency
    ),
    sourceMixLabel: [...sourceTypes].join(" + ") || "Sem origem",
    timeline,
    actionHints: buildQuoteDetailActionHints({
      detail: input.detail,
      currentVersion
    })
  };
}

export function hasActiveQuoteWorkbenchFilters(
  filters: QuoteWorkbenchFilters
): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.status !== defaultQuoteWorkbenchFilters.status ||
    filters.valueBand !== defaultQuoteWorkbenchFilters.valueBand ||
    filters.sort !== defaultQuoteWorkbenchFilters.sort
  );
}

export function buildQuoteWorkbenchRecommendations(input: {
  summary: QuoteWorkbenchSummary;
  filters: QuoteWorkbenchFilters;
}): string[] {
  const recommendations: string[] = [];

  if (input.summary.draftQuotes > 0) {
    recommendations.push(
      `${input.summary.draftQuotes} draft(s) ainda podem virar proposta publicada.`
    );
  }

  if (input.summary.visibleQuotes === 0 && hasActiveQuoteWorkbenchFilters(input.filters)) {
    recommendations.push(
      "Nenhum orcamento aparece com os filtros atuais; limpe a busca para recuperar a visao geral."
    );
  }

  if (input.summary.highestVisibleQuote) {
    recommendations.push(
      `Maior oportunidade visivel: ${input.summary.highestVisibleQuote.title}.`
    );
  }

  if (!recommendations.length && input.summary.totalQuotes === 0) {
    recommendations.push(
      "Crie o primeiro orcamento manual ou importe um JSON revisavel para iniciar o pipeline."
    );
  }

  return recommendations.slice(0, 3);
}

function escapeCsvValue(value: string): string {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
}

export function buildQuoteWorkbenchCsvContent(
  quotes: QuoteWorkbenchViewModel[]
): string {
  const rows = [
    [
      "id",
      "title",
      "customer",
      "status",
      "version",
      "totalCents",
      "currency",
      "updatedAt",
      "insight"
    ],
    ...quotes.map((quote) => [
      quote.id,
      quote.title,
      quote.customerName,
      quote.statusLabel,
      quote.versionLabel,
      String(quote.totalCents),
      quote.currency,
      quote.updatedAt,
      quote.insight
    ])
  ];

  return rows
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");
}
