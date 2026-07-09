import type {
  DashboardRecentQuote,
  DashboardSummaryResponse,
  DashboardTopProduct
} from "./schemas";

export type DashboardSignalTone = "success" | "warning" | "danger" | "neutral";
export type DashboardActionPriority = "high" | "medium" | "low";

export interface DashboardMetricDefinition {
  key:
    | "totalQuotes"
    | "quotesThisMonth"
    | "activeCustomers"
    | "publishedLinks";
  label: string;
  description: string;
}

export interface DashboardMetricViewModel {
  key: DashboardMetricDefinition["key"];
  label: string;
  value: string;
  description: string;
  helper: string;
}

export interface DashboardSignalViewModel {
  key: string;
  label: string;
  value: string;
  tone: DashboardSignalTone;
  description: string;
}

export interface DashboardActionViewModel {
  id: string;
  label: string;
  description: string;
  href: string;
  priority: DashboardActionPriority;
}

export interface DashboardTopProductViewModel {
  id: string;
  productName: string;
  productId: string | null;
  uses: number;
  usesLabel: string;
  rankLabel: string;
  originLabel: string;
  insight: string;
}

export interface DashboardRecentQuoteViewModel {
  id: string;
  title: string;
  customerName: string;
  statusLabel: string;
  versionLabel: string;
  totalLabel: string;
  updatedAt: string;
  href: string;
  tone: DashboardSignalTone;
}

export interface DashboardHealthSummary {
  score: number;
  label: string;
  tone: DashboardSignalTone;
  description: string;
}

export interface DashboardNarrative {
  headline: string;
  body: string;
  bullets: string[];
}

export const dashboardMetricDefinitions: DashboardMetricDefinition[] = [
  {
    key: "totalQuotes",
    label: "Orcamentos totais",
    description: "Volume geral de orcamentos registrados no tenant."
  },
  {
    key: "quotesThisMonth",
    label: "Orcamentos no mes",
    description: "Iniciativas comerciais abertas no ciclo atual."
  },
  {
    key: "activeCustomers",
    label: "Clientes ativos",
    description: "Clientes disponiveis para montar novos orcamentos."
  },
  {
    key: "publishedLinks",
    label: "Links publicados",
    description: "Compartilhamentos publicos atualmente ativos."
  }
];

export function formatDashboardMetric(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatDashboardCurrency(
  valueInCents: number,
  currency: string
): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency
  }).format(valueInCents / 100);
}

export function formatDashboardStatus(
  value: DashboardRecentQuote["status"]
): string {
  if (value === "draft") {
    return "Draft";
  }

  if (value === "published") {
    return "Publicado";
  }

  return "Arquivado";
}

function buildMetricHelper(
  summary: DashboardSummaryResponse,
  key: DashboardMetricDefinition["key"]
): string {
  if (key === "quotesThisMonth") {
    const percentage =
      summary.totalQuotes > 0
        ? Math.round((summary.quotesThisMonth / summary.totalQuotes) * 100)
        : 0;

    return `${percentage}% do pipeline total nasceu neste mes`;
  }

  if (key === "activeCustomers") {
    const ratio =
      summary.activeCustomers > 0
        ? Math.round(summary.totalQuotes / summary.activeCustomers)
        : 0;

    return ratio > 0
      ? `Media aproximada de ${ratio} orcamento(s) por cliente`
      : "Cadastre clientes para iniciar recorrencia";
  }

  if (key === "publishedLinks") {
    return summary.publishedLinks > 0
      ? "Ha distribuicao publica ativa"
      : "Nenhum link publico ativo agora";
  }

  return summary.totalQuotes > 0
    ? "Historico comercial disponivel para analise"
    : "Pipeline ainda esta em formacao";
}

export function buildDashboardMetricViewModels(input: {
  summary: DashboardSummaryResponse | null;
  isLoading: boolean;
}): DashboardMetricViewModel[] {
  return dashboardMetricDefinitions.map((definition) => ({
    ...definition,
    value:
      input.isLoading || !input.summary
        ? "..."
        : formatDashboardMetric(input.summary[definition.key]),
    helper: input.summary
      ? buildMetricHelper(input.summary, definition.key)
      : "Aguardando sincronizacao"
  }));
}

export function buildDashboardHealthSummary(
  summary: DashboardSummaryResponse | null
): DashboardHealthSummary {
  if (!summary) {
    return {
      score: 0,
      label: "Sincronizando",
      tone: "neutral",
      description: "Carregando sinais comerciais do tenant."
    };
  }

  let score = 0;

  if (summary.totalQuotes > 0) {
    score += 20;
  }

  if (summary.quotesThisMonth > 0) {
    score += 20;
  }

  if (summary.activeCustomers > 0) {
    score += 20;
  }

  if (summary.publishedLinks > 0) {
    score += 15;
  }

  if (summary.topProducts.length > 0) {
    score += 10;
  }

  if (summary.recentQuotes.length > 0) {
    score += 10;
  }

  if (
    summary.aiActivity.totalAttemptsThisMonth > 0 &&
    summary.aiActivity.successRate >= 0.75
  ) {
    score += 5;
  }

  if (score >= 75) {
    return {
      score,
      label: "Operacao aquecida",
      tone: "success",
      description: "O tenant tem pipeline, clientes, distribuicao e dados recentes."
    };
  }

  if (score >= 45) {
    return {
      score,
      label: "Operacao em maturacao",
      tone: "warning",
      description: "Existem sinais comerciais, mas ainda ha alavancas para ativar."
    };
  }

  return {
    score,
    label: "Operacao inicial",
    tone: "danger",
    description: "A base precisa de clientes, orcamentos ou distribuicao para ganhar tracao."
  };
}

export function buildDashboardSignals(
  summary: DashboardSummaryResponse | null
): DashboardSignalViewModel[] {
  if (!summary) {
    return [
      {
        key: "loading",
        label: "Situacao",
        value: "Carregando",
        tone: "neutral",
        description: "Indicadores ainda nao foram sincronizados."
      }
    ];
  }

  const aiSuccessRate = Math.round(summary.aiActivity.successRate * 100);

  return [
    {
      key: "pipeline",
      label: "Pipeline",
      value: formatDashboardMetric(summary.quotesThisMonth),
      tone: summary.quotesThisMonth > 0 ? "success" : "warning",
      description:
        summary.quotesThisMonth > 0
          ? "Ha propostas novas no ciclo atual."
          : "Nenhum orcamento novo registrado neste mes."
    },
    {
      key: "distribution",
      label: "Distribuicao",
      value: formatDashboardMetric(summary.publishedLinks),
      tone: summary.publishedLinks > 0 ? "success" : "warning",
      description:
        summary.publishedLinks > 0
          ? "Links publicos ativos mantem a proposta acessivel."
          : "Publique links quando quiser acompanhar compartilhamento."
    },
    {
      key: "ai",
      label: "Assistente IA",
      value:
        summary.aiActivity.totalAttemptsThisMonth > 0
          ? `${aiSuccessRate}%`
          : "Sem uso",
      tone:
        summary.aiActivity.totalAttemptsThisMonth === 0
          ? "neutral"
          : aiSuccessRate >= 75
            ? "success"
            : "warning",
      description:
        summary.aiActivity.totalAttemptsThisMonth > 0
          ? `${formatDashboardMetric(
              summary.aiActivity.totalAttemptsThisMonth
            )} tentativa(s) no mes.`
          : "Use o assistente em Orcamentos para medir produtividade."
    }
  ];
}

export function buildDashboardNarrative(
  summary: DashboardSummaryResponse | null
): DashboardNarrative {
  if (!summary) {
    return {
      headline: "Carregando leitura executiva",
      body: "Assim que o resumo sincronizar, o painel vai destacar os principais sinais comerciais do tenant.",
      bullets: [
        "Acompanhe pipeline, clientes, links e atividade do assistente IA.",
        "Use as abas para alternar entre leitura comercial, operacao e auditoria."
      ]
    };
  }

  const bullets: string[] = [];

  if (summary.quotesThisMonth > 0) {
    bullets.push(
      `${formatDashboardMetric(summary.quotesThisMonth)} orcamento(s) foram iniciados no mes.`
    );
  } else {
    bullets.push("Nenhum orcamento novo foi iniciado neste mes.");
  }

  if (summary.publishedLinks > 0) {
    bullets.push(
      `${formatDashboardMetric(summary.publishedLinks)} link(s) publico(s) estao ativos.`
    );
  } else {
    bullets.push("Nao ha links publicos ativos para distribuicao comercial.");
  }

  if (summary.aiActivity.totalAttemptsThisMonth > 0) {
    bullets.push(
      `Assistente IA teve ${Math.round(
        summary.aiActivity.successRate * 100
      )}% de sucesso no mes.`
    );
  } else {
    bullets.push("Assistente IA ainda nao foi acionado neste ciclo.");
  }

  if (summary.totalQuotes === 0) {
    return {
      headline: "Operacao pronta para o primeiro pipeline",
      body: "A base ainda nao tem historico de orcamentos, entao o melhor proximo passo e criar uma proposta simples e validar o fluxo completo.",
      bullets
    };
  }

  if (summary.publishedLinks === 0) {
    return {
      headline: "Pipeline existe, mas falta distribuicao",
      body: "O tenant ja possui historico comercial. Publicar links de propostas ajuda a transformar esse historico em acompanhamento externo.",
      bullets
    };
  }

  return {
    headline: "Operacao com sinais comerciais ativos",
    body: "O tenant combina pipeline, base de clientes e distribuicao publica, criando uma leitura mais confiavel para priorizar as proximas propostas.",
    bullets
  };
}

export function buildDashboardActions(
  summary: DashboardSummaryResponse | null
): DashboardActionViewModel[] {
  const actions: DashboardActionViewModel[] = [];

  if (!summary || summary.activeCustomers === 0) {
    actions.push({
      id: "create-customer",
      label: "Cadastrar cliente",
      description: "Crie uma base minima antes de montar propostas recorrentes.",
      href: "/customers?tab=form",
      priority: "high"
    });
  }

  if (!summary || summary.totalQuotes === 0) {
    actions.push({
      id: "create-quote",
      label: "Criar orcamento manual",
      description: "Monte a primeira proposta usando um item do catalogo.",
      href: "/quotes?tab=new",
      priority: "high"
    });
  }

  if (summary && summary.totalQuotes > 0 && summary.publishedLinks === 0) {
    actions.push({
      id: "publish-link",
      label: "Publicar link compartilhado",
      description: "Transforme uma proposta pronta em link rastreavel.",
      href: "/quotes?tab=list",
      priority: "medium"
    });
  }

  if (!summary || summary.topProducts.length === 0) {
    actions.push({
      id: "review-catalog",
      label: "Revisar catalogo",
      description: "Organize produtos para o ranking comercial ficar mais util.",
      href: "/catalog?tab=products",
      priority: "medium"
    });
  }

  actions.push({
    id: "import-json",
    label: "Importar JSON revisavel",
    description: "Use payload estruturado para acelerar criacao de draft.",
    href: "/quotes?tab=import",
    priority: "low"
  });

  return actions.slice(0, 5);
}

export function buildTopProductViewModels(
  products: DashboardTopProduct[]
): DashboardTopProductViewModel[] {
  return products.map((product, index) => ({
    id: product.productId ?? `manual:${product.productName}`,
    productName: product.productName,
    productId: product.productId ?? null,
    uses: product.uses,
    usesLabel: formatDashboardMetric(product.uses),
    rankLabel: `#${index + 1}`,
    originLabel: product.productId
      ? `Produto vinculado ao catalogo: ${product.productId}`
      : "Item manual sem vinculo com catalogo",
    insight:
      index === 0
        ? "Produto lider do ranking atual."
        : product.uses > 1
          ? "Item recorrente em propostas recentes."
          : "Item ainda com baixa recorrencia."
  }));
}

export function buildRecentQuoteViewModels(
  quotes: DashboardRecentQuote[]
): DashboardRecentQuoteViewModel[] {
  return quotes.map((quote) => ({
    id: quote.id,
    title: quote.title,
    customerName: quote.customerName,
    statusLabel: formatDashboardStatus(quote.status),
    versionLabel: `versao ${quote.versionNumber}`,
    totalLabel: formatDashboardCurrency(quote.totalCents, quote.currency),
    updatedAt: quote.updatedAt,
    href: `/quotes?quoteId=${quote.id}`,
    tone:
      quote.status === "published"
        ? "success"
        : quote.status === "archived"
          ? "neutral"
          : "warning"
  }));
}

export function buildDashboardSnapshotCsvContent(
  summary: DashboardSummaryResponse
): string {
  const rows = [
    ["indicador", "valor"],
    ["orcamentos_totais", summary.totalQuotes],
    ["orcamentos_no_mes", summary.quotesThisMonth],
    ["clientes_ativos", summary.activeCustomers],
    ["links_publicados", summary.publishedLinks],
    ["ia_drafts_no_mes", summary.aiActivity.draftsThisMonth],
    ["ia_falhas_no_mes", summary.aiActivity.failuresThisMonth],
    ["ia_taxa_sucesso", summary.aiActivity.successRate]
  ];

  return rows.map((row) => row.join(",")).join("\n");
}
