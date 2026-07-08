import type { CustomerResponse } from "@/lib/customers/schemas";
import type { QuoteSummary } from "./schemas";

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

export const quoteWorkbenchPageSize = 5;

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
