import { describe, expect, it } from "vitest";
import type { DashboardSummaryResponse } from "./schemas";
import {
  buildDashboardActions,
  buildDashboardHealthSummary,
  buildDashboardMetricViewModels,
  buildDashboardNarrative,
  buildDashboardOperationalKpis,
  buildDashboardSignals,
  buildDashboardSnapshotCsvContent,
  buildRecentQuoteViewModels,
  buildTopProductViewModels,
  dashboardMetricDefinitions,
  formatDashboardCurrency,
  formatDashboardMetric,
  formatDashboardStatus
} from "./workbench";

const matureSummary: DashboardSummaryResponse = {
  totalQuotes: 12,
  quotesThisMonth: 4,
  activeCustomers: 6,
  publishedLinks: 2,
  aiActivity: {
    draftsThisMonth: 3,
    failuresThisMonth: 1,
    totalAttemptsThisMonth: 4,
    successRate: 0.75
  },
  topProducts: [
    {
      productId: "prod_1",
      productName: "Notebook Pro",
      uses: 8
    },
    {
      productId: null,
      productName: "Servico de instalacao",
      uses: 1
    }
  ],
  recentQuotes: [
    {
      id: "quo_1",
      title: "Renovacao comercial",
      customerName: "Cliente A",
      status: "published",
      versionNumber: 3,
      totalCents: 280_000,
      currency: "BRL",
      updatedAt: "2026-07-08T12:00:00.000Z"
    },
    {
      id: "quo_2",
      title: "Draft de expansao",
      customerName: "Cliente B",
      status: "draft",
      versionNumber: 1,
      totalCents: 90_000,
      currency: "BRL",
      updatedAt: "2026-07-07T12:00:00.000Z"
    }
  ]
};

const initialSummary: DashboardSummaryResponse = {
  totalQuotes: 0,
  quotesThisMonth: 0,
  activeCustomers: 0,
  publishedLinks: 0,
  aiActivity: {
    draftsThisMonth: 0,
    failuresThisMonth: 0,
    totalAttemptsThisMonth: 0,
    successRate: 0
  },
  topProducts: [],
  recentQuotes: []
};

describe("dashboard/workbench", () => {
  it("mantem definicoes de metricas em ordem estavel", () => {
    expect(dashboardMetricDefinitions.map((metric) => metric.key)).toEqual([
      "totalQuotes",
      "quotesThisMonth",
      "activeCustomers",
      "publishedLinks"
    ]);
  });

  it("formata metricas, moeda e status", () => {
    expect(formatDashboardMetric(1200)).toBe("1.200");
    expect(formatDashboardCurrency(280_000, "BRL")).toContain("2.800,00");
    expect(formatDashboardStatus("draft")).toBe("Draft");
    expect(formatDashboardStatus("published")).toBe("Publicado");
    expect(formatDashboardStatus("archived")).toBe("Arquivado");
  });

  it("cria metric cards com helpers de contexto", () => {
    expect(
      buildDashboardMetricViewModels({
        summary: matureSummary,
        isLoading: false
      }).map((metric) => ({
        key: metric.key,
        value: metric.value,
        helper: metric.helper
      }))
    ).toEqual([
      {
        key: "totalQuotes",
        value: "12",
        helper: "Historico comercial disponivel para analise"
      },
      {
        key: "quotesThisMonth",
        value: "4",
        helper: "33% do pipeline total nasceu neste mes"
      },
      {
        key: "activeCustomers",
        value: "6",
        helper: "Media aproximada de 2 orcamento(s) por cliente"
      },
      {
        key: "publishedLinks",
        value: "2",
        helper: "Ha distribuicao publica ativa"
      }
    ]);

    expect(
      buildDashboardMetricViewModels({
        summary: null,
        isLoading: true
      }).every((metric) => metric.value === "...")
    ).toBe(true);
  });

  it("calcula saude operacional por maturidade", () => {
    expect(buildDashboardHealthSummary(matureSummary)).toMatchObject({
      score: 100,
      label: "Operacao aquecida",
      tone: "success"
    });
    expect(buildDashboardHealthSummary(initialSummary)).toMatchObject({
      score: 0,
      label: "Operacao inicial",
      tone: "danger"
    });
    expect(buildDashboardHealthSummary(null)).toMatchObject({
      score: 0,
      label: "Sincronizando",
      tone: "neutral"
    });
  });

  it("monta sinais executivos do tenant", () => {
    expect(
      buildDashboardSignals(matureSummary).map((signal) => ({
        key: signal.key,
        value: signal.value,
        tone: signal.tone
      }))
    ).toEqual([
      { key: "pipeline", value: "4", tone: "success" },
      { key: "distribution", value: "2", tone: "success" },
      { key: "ai", value: "75%", tone: "success" }
    ]);

    expect(buildDashboardSignals(null)).toEqual([
      {
        key: "loading",
        label: "Situacao",
        value: "Carregando",
        tone: "neutral",
        description: "Indicadores ainda nao foram sincronizados."
      }
    ]);
  });

  it("gera narrativa executiva para diferentes fases", () => {
    expect(buildDashboardNarrative(null)).toMatchObject({
      headline: "Carregando leitura executiva",
      bullets: [
        "Acompanhe pipeline, clientes, links e atividade do assistente IA.",
        "Use as abas para alternar entre leitura comercial, operacao e auditoria."
      ]
    });

    expect(buildDashboardNarrative(initialSummary)).toMatchObject({
      headline: "Operacao pronta para o primeiro pipeline",
      bullets: [
        "Nenhum orcamento novo foi iniciado neste mes.",
        "Nao ha links publicos ativos para distribuicao comercial.",
        "Assistente IA ainda nao foi acionado neste ciclo."
      ]
    });

    expect(
      buildDashboardNarrative({
        ...matureSummary,
        publishedLinks: 0
      })
    ).toMatchObject({
      headline: "Pipeline existe, mas falta distribuicao"
    });

    expect(buildDashboardNarrative(matureSummary)).toMatchObject({
      headline: "Operacao com sinais comerciais ativos",
      bullets: [
        "4 orcamento(s) foram iniciados no mes.",
        "2 link(s) publico(s) estao ativos.",
        "Assistente IA teve 75% de sucesso no mes."
      ]
    });
  });

  it("gera proximas acoes conforme lacunas da operacao", () => {
    expect(buildDashboardActions(initialSummary).map((action) => action.id)).toEqual([
      "create-customer",
      "create-quote",
      "review-catalog",
      "import-json"
    ]);

    expect(buildDashboardActions(matureSummary).map((action) => action.id)).toEqual([
      "import-json"
    ]);

    expect(
      buildDashboardActions({
        ...matureSummary,
        publishedLinks: 0
      }).map((action) => action.id)
    ).toEqual(["publish-link", "import-json"]);
  });

  it("monta KPIs operacionais testaveis para leitura rapida", () => {
    expect(
      buildDashboardOperationalKpis(matureSummary).map((kpi) => ({
        id: kpi.id,
        value: kpi.value,
        tone: kpi.tone
      }))
    ).toEqual([
      {
        id: "monthly-pressure",
        value: "4 orcamento(s)",
        tone: "success"
      },
      {
        id: "distribution-coverage",
        value: "2 link(s)",
        tone: "warning"
      },
      {
        id: "relationship-base",
        value: "6 cliente(s)",
        tone: "success"
      },
      {
        id: "ai-activity",
        value: "3 draft(s)",
        tone: "success"
      }
    ]);

    expect(buildDashboardOperationalKpis(null)).toEqual([
      {
        id: "loading",
        label: "Sincronizacao",
        value: "Carregando...",
        detail: "Aguardando o resumo operacional do tenant.",
        tone: "neutral"
      }
    ]);
  });

  it("enriquece ranking de produtos", () => {
    expect(buildTopProductViewModels(matureSummary.topProducts)).toEqual([
      {
        id: "prod_1",
        productName: "Notebook Pro",
        productId: "prod_1",
        uses: 8,
        usesLabel: "8",
        rankLabel: "#1",
        originLabel: "Produto vinculado ao catalogo: prod_1",
        insight: "Produto lider do ranking atual."
      },
      {
        id: "manual:Servico de instalacao",
        productName: "Servico de instalacao",
        productId: null,
        uses: 1,
        usesLabel: "1",
        rankLabel: "#2",
        originLabel: "Item manual sem vinculo com catalogo",
        insight: "Item ainda com baixa recorrencia."
      }
    ]);
  });

  it("enriquece orcamentos recentes", () => {
    expect(buildRecentQuoteViewModels(matureSummary.recentQuotes)).toEqual([
      {
        id: "quo_1",
        title: "Renovacao comercial",
        customerName: "Cliente A",
        statusLabel: "Publicado",
        versionLabel: "versao 3",
        totalLabel: formatDashboardCurrency(280_000, "BRL"),
        updatedAt: "2026-07-08T12:00:00.000Z",
        href: "/quotes?quoteId=quo_1",
        tone: "success"
      },
      {
        id: "quo_2",
        title: "Draft de expansao",
        customerName: "Cliente B",
        statusLabel: "Draft",
        versionLabel: "versao 1",
        totalLabel: formatDashboardCurrency(90_000, "BRL"),
        updatedAt: "2026-07-07T12:00:00.000Z",
        href: "/quotes?quoteId=quo_2",
        tone: "warning"
      }
    ]);
  });

  it("exporta snapshot operacional em CSV", () => {
    expect(buildDashboardSnapshotCsvContent(matureSummary)).toBe(
      [
        "indicador,valor",
        "orcamentos_totais,12",
        "orcamentos_no_mes,4",
        "clientes_ativos,6",
        "links_publicados,2",
        "ia_drafts_no_mes,3",
        "ia_falhas_no_mes,1",
        "ia_taxa_sucesso,0.75"
      ].join("\n")
    );
  });
});
