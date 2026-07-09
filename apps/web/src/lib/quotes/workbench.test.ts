import { describe, expect, it } from "vitest";
import type { CustomerResponse } from "@/lib/customers/schemas";
import type { QuoteDetail, QuoteSummary } from "./schemas";
import {
  buildQuoteDetailSnapshot,
  buildQuoteDetailTimeline,
  buildQuotePipelineCards,
  buildQuotePipelineHealth,
  buildQuotePipelineNarrative,
  buildQuotePipelineSnapshot,
  buildQuotePipelineStages,
  buildQuoteWorkbenchCsvContent,
  buildQuoteWorkbenchPagination,
  buildQuoteWorkbenchRecommendations,
  buildQuoteWorkbenchSummary,
  buildQuoteWorkbenchViewModel,
  buildQuoteWorkbenchViewModels,
  classifyQuoteValueBand,
  filterQuoteWorkbenchViewModels,
  formatQuoteCurrency,
  formatQuoteStatusLabel,
  getDefaultQuoteWorkbenchFilters,
  getQuoteStatusTone,
  hasActiveQuoteWorkbenchFilters,
  paginateQuoteWorkbenchViewModels,
  quoteSortOptions,
  quoteStatusFilterOptions,
  quoteValueBandOptions,
  sortQuoteWorkbenchViewModels
} from "./workbench";

function makeCustomer(input: Partial<CustomerResponse> & { id: string; name: string }) {
  return {
    id: input.id,
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    document: input.document ?? null,
    notes: input.notes ?? null,
    createdAt: input.createdAt ?? "2026-07-01T10:00:00.000Z",
    updatedAt: input.updatedAt ?? "2026-07-01T10:00:00.000Z"
  };
}

function makeQuote(
  input: Partial<QuoteSummary> & {
    id: string;
    customerId: string;
    title: string;
    status: QuoteSummary["status"];
    totalCents: number;
    versionNumber: number;
    updatedAt: string;
  }
): QuoteSummary {
  return {
    id: input.id,
    customerId: input.customerId,
    title: input.title,
    status: input.status,
    publicNotes: input.publicNotes ?? null,
    internalNotes: input.internalNotes ?? null,
    createdAt: input.createdAt ?? "2026-07-01T10:00:00.000Z",
    updatedAt: input.updatedAt,
    currentVersion: {
      id: input.currentVersion?.id ?? `qv_${input.id}`,
      versionNumber: input.versionNumber,
      subtotalCents: input.currentVersion?.subtotalCents ?? input.totalCents,
      discountCents: input.currentVersion?.discountCents ?? 0,
      totalCents: input.totalCents,
      currency: input.currentVersion?.currency ?? "BRL"
    }
  };
}

const customers = [
  makeCustomer({
    id: "cus_a",
    name: "Cliente Alpha"
  }),
  makeCustomer({
    id: "cus_b",
    name: "Cliente Beta"
  }),
  makeCustomer({
    id: "cus_c",
    name: "Cliente Gama"
  })
];

const quotes = [
  makeQuote({
    id: "quo_draft_high",
    customerId: "cus_a",
    title: "Renovacao notebooks diretoria",
    status: "draft",
    totalCents: 2400000,
    versionNumber: 3,
    updatedAt: "2026-07-08T15:00:00.000Z"
  }),
  makeQuote({
    id: "quo_published_mid",
    customerId: "cus_b",
    title: "Monitores equipe comercial",
    status: "published",
    totalCents: 450000,
    versionNumber: 2,
    updatedAt: "2026-07-08T12:00:00.000Z"
  }),
  makeQuote({
    id: "quo_archived_low",
    customerId: "cus_c",
    title: "Mouse ergonomico suporte",
    status: "archived",
    totalCents: 90000,
    versionNumber: 1,
    updatedAt: "2026-07-07T09:00:00.000Z"
  }),
  makeQuote({
    id: "quo_draft_zero",
    customerId: "cus_missing",
    title: "Servico a definir",
    status: "draft",
    totalCents: 0,
    versionNumber: 1,
    updatedAt: "2026-07-06T09:00:00.000Z"
  })
];

const quoteDetail: QuoteDetail = {
  ...quotes[0]!,
  currentVersion: {
    id: "qv_current",
    versionNumber: 2,
    subtotalCents: 2400000,
    discountCents: 0,
    totalCents: 2400000,
    currency: "BRL"
  },
  versions: [
    {
      id: "qv_previous",
      versionNumber: 1,
      label: "Primeira proposta",
      currency: "BRL",
      subtotalCents: 1200000,
      discountCents: 0,
      totalCents: 1200000,
      sourceType: "manual",
      createdAt: "2026-07-07T10:00:00.000Z",
      items: [
        {
          id: "item_old",
          productId: "prd_old",
          productName: "Notebook antigo",
          productDescription: null,
          quantity: 2,
          unitPriceCents: 600000,
          totalPriceCents: 1200000
        }
      ]
    },
    {
      id: "qv_current",
      versionNumber: 2,
      label: null,
      currency: "BRL",
      subtotalCents: 2400000,
      discountCents: 0,
      totalCents: 2400000,
      sourceType: "import_json",
      createdAt: "2026-07-08T10:00:00.000Z",
      items: [
        {
          id: "item_a",
          productId: "prd_a",
          productName: "Notebook Pro",
          productDescription: "Equipamento corporativo",
          quantity: 3,
          unitPriceCents: 800000,
          totalPriceCents: 2400000
        }
      ]
    }
  ]
};

describe("quotes/workbench", () => {
  it("mantem opcoes de filtros e ordenacao estaveis para a UI", () => {
    expect(quoteStatusFilterOptions.map((option) => option.value)).toEqual([
      "all",
      "draft",
      "published",
      "archived"
    ]);
    expect(quoteValueBandOptions.map((option) => option.value)).toEqual([
      "all",
      "up_to_1k",
      "from_1k_to_5k",
      "from_5k_to_20k",
      "above_20k"
    ]);
    expect(quoteSortOptions.map((option) => option.value)).toEqual([
      "updated_desc",
      "updated_asc",
      "total_desc",
      "total_asc",
      "title_asc",
      "customer_asc"
    ]);
  });

  it("formata status e classifica tons sem depender da pagina", () => {
    expect(formatQuoteStatusLabel("draft")).toBe("Draft");
    expect(formatQuoteStatusLabel("published")).toBe("Publicado");
    expect(formatQuoteStatusLabel("archived")).toBe("Arquivado");
    expect(getQuoteStatusTone("draft")).toBe("neutral");
    expect(getQuoteStatusTone("published")).toBe("success");
    expect(getQuoteStatusTone("archived")).toBe("muted");
  });

  it("classifica faixas de valor por total em centavos", () => {
    expect(classifyQuoteValueBand(0)).toBe("up_to_1k");
    expect(classifyQuoteValueBand(100000)).toBe("up_to_1k");
    expect(classifyQuoteValueBand(100001)).toBe("from_1k_to_5k");
    expect(classifyQuoteValueBand(500001)).toBe("from_5k_to_20k");
    expect(classifyQuoteValueBand(2000001)).toBe("above_20k");
  });

  it("monta view model com cliente, busca normalizada e insight operacional", () => {
    const viewModel = buildQuoteWorkbenchViewModel({
      quote: quotes[0]!,
      customers
    });

    expect(viewModel).toMatchObject({
      id: "quo_draft_high",
      customerName: "Cliente Alpha",
      statusLabel: "Draft",
      statusTone: "neutral",
      versionLabel: "Versao atual: 3",
      valueBand: "above_20k",
      insight: "Draft aberto na versao 3 para revisao comercial."
    });
    expect(viewModel.searchText).toContain("renovacao notebooks diretoria");
    expect(viewModel.searchText).toContain("cliente alpha");
  });

  it("usa fallback legivel quando cliente ainda nao esta carregado", () => {
    const viewModel = buildQuoteWorkbenchViewModel({
      quote: quotes[3]!,
      customers
    });

    expect(viewModel.customerName).toBe("Cliente nao carregado");
    expect(viewModel.insight).toBe("Draft na versao 1 ainda sem valor comercial.");
  });

  it("filtra por status, faixa de valor e busca textual", () => {
    const viewModels = buildQuoteWorkbenchViewModels({
      quotes,
      customers
    });

    expect(
      filterQuoteWorkbenchViewModels(viewModels, {
        query: "notebooks",
        status: "draft",
        valueBand: "above_20k",
        sort: "updated_desc"
      }).map((quote) => quote.id)
    ).toEqual(["quo_draft_high"]);

    expect(
      filterQuoteWorkbenchViewModels(viewModels, {
        query: "cliente beta",
        status: "all",
        valueBand: "from_1k_to_5k",
        sort: "updated_desc"
      }).map((quote) => quote.id)
    ).toEqual(["quo_published_mid"]);
  });

  it("ordena por data, valor, titulo e cliente", () => {
    const viewModels = buildQuoteWorkbenchViewModels({
      quotes,
      customers
    });

    expect(sortQuoteWorkbenchViewModels(viewModels, "updated_asc")[0]?.id).toBe(
      "quo_draft_zero"
    );
    expect(sortQuoteWorkbenchViewModels(viewModels, "total_desc")[0]?.id).toBe(
      "quo_draft_high"
    );
    expect(sortQuoteWorkbenchViewModels(viewModels, "total_asc")[0]?.id).toBe(
      "quo_draft_zero"
    );
    expect(sortQuoteWorkbenchViewModels(viewModels, "title_asc")[0]?.id).toBe(
      "quo_published_mid"
    );
    expect(sortQuoteWorkbenchViewModels(viewModels, "customer_asc")[0]?.id).toBe(
      "quo_draft_high"
    );
  });

  it("calcula paginacao e recorta a pagina atual", () => {
    const viewModels = buildQuoteWorkbenchViewModels({
      quotes,
      customers
    });
    const pagination = buildQuoteWorkbenchPagination({
      totalItems: viewModels.length,
      page: 2,
      pageSize: 2
    });

    expect(pagination).toEqual({
      page: 2,
      pageSize: 2,
      totalItems: 4,
      totalPages: 2,
      startItem: 3,
      endItem: 4,
      hasPreviousPage: true,
      hasNextPage: false
    });
    expect(
      paginateQuoteWorkbenchViewModels({
        quotes: viewModels,
        pagination
      }).map((quote) => quote.id)
    ).toEqual(["quo_archived_low", "quo_draft_zero"]);
  });

  it("resume volume, status e oportunidades visiveis", () => {
    const viewModels = buildQuoteWorkbenchViewModels({
      quotes,
      customers
    });
    const visibleQuotes = filterQuoteWorkbenchViewModels(viewModels, {
      query: "",
      status: "all",
      valueBand: "all",
      sort: "total_desc"
    });

    expect(
      buildQuoteWorkbenchSummary({
        allQuotes: viewModels,
        visibleQuotes
      })
    ).toMatchObject({
      totalQuotes: 4,
      visibleQuotes: 4,
      draftQuotes: 2,
      publishedQuotes: 1,
      archivedQuotes: 1,
      totalVisibleCents: 2940000,
      averageVisibleCents: 735000,
      highestVisibleQuote: expect.objectContaining({
        id: "quo_draft_high"
      }),
      mostRecentVisibleQuote: expect.objectContaining({
        id: "quo_draft_high"
      })
    });
  });

  it("identifica filtros ativos e gera recomendacoes operacionais", () => {
    const viewModels = buildQuoteWorkbenchViewModels({
      quotes,
      customers
    });
    const visibleQuotes = filterQuoteWorkbenchViewModels(viewModels, {
      query: "",
      status: "all",
      valueBand: "all",
      sort: "total_desc"
    });
    const summary = buildQuoteWorkbenchSummary({
      allQuotes: viewModels,
      visibleQuotes
    });

    expect(hasActiveQuoteWorkbenchFilters(getDefaultQuoteWorkbenchFilters())).toBe(
      false
    );
    expect(
      hasActiveQuoteWorkbenchFilters({
        ...getDefaultQuoteWorkbenchFilters(),
        query: "alpha"
      })
    ).toBe(true);
    expect(
      buildQuoteWorkbenchRecommendations({
        summary,
        filters: getDefaultQuoteWorkbenchFilters()
      })
    ).toEqual([
      "2 draft(s) ainda podem virar proposta publicada.",
      "Maior oportunidade visivel: Renovacao notebooks diretoria."
    ]);
  });

  it("exporta orcamentos visiveis em CSV escapado", () => {
    const [viewModel] = buildQuoteWorkbenchViewModels({
      quotes: [
        makeQuote({
          id: "quo_csv",
          customerId: "cus_a",
          title: 'Orcamento "Especial"',
          status: "published",
          totalCents: 123456,
          versionNumber: 4,
          updatedAt: "2026-07-08T15:00:00.000Z"
        })
      ],
      customers
    });

    expect(buildQuoteWorkbenchCsvContent(viewModel ? [viewModel] : [])).toBe(
      [
        "id,title,customer,status,version,totalCents,currency,updatedAt,insight",
        'quo_csv,"Orcamento ""Especial""",Cliente Alpha,Publicado,Versao atual: 4,123456,BRL,2026-07-08T15:00:00.000Z,Versao 4 publicada e pronta para distribuicao.'
      ].join("\n")
    );
  });

  it("formata moeda do pipeline respeitando Intl", () => {
    expect(formatQuoteCurrency(2400000, "BRL")).toContain("24.000,00");
  });

  it("monta cards priorizados do pipeline comercial", () => {
    const viewModels = buildQuoteWorkbenchViewModels({
      quotes,
      customers
    });

    expect(buildQuotePipelineCards(viewModels)).toEqual([
      {
        id: "quo_draft_high:urgent",
        quoteId: "quo_draft_high",
        title: "Renovacao notebooks diretoria",
        customerName: "Cliente Alpha",
        valueLabel: formatQuoteCurrency(2400000, "BRL"),
        priority: "urgent",
        priorityLabel: "Urgente",
        riskTone: "danger",
        statusLabel: "Draft",
        actionLabel: "Publicar proposta",
        reason: "Draft de alto valor parado no funil comercial.",
        href: "/quotes?quoteId=quo_draft_high"
      },
      {
        id: "quo_published_mid:normal",
        quoteId: "quo_published_mid",
        title: "Monitores equipe comercial",
        customerName: "Cliente Beta",
        valueLabel: formatQuoteCurrency(450000, "BRL"),
        priority: "normal",
        priorityLabel: "Normal",
        riskTone: "success",
        statusLabel: "Publicado",
        actionLabel: "Acompanhar link",
        reason: "Proposta publicada deve ser acompanhada ate decisao do cliente.",
        href: "/quotes?quoteId=quo_published_mid"
      },
      {
        id: "quo_draft_zero:normal",
        quoteId: "quo_draft_zero",
        title: "Servico a definir",
        customerName: "Cliente nao carregado",
        valueLabel: formatQuoteCurrency(0, "BRL"),
        priority: "normal",
        priorityLabel: "Normal",
        riskTone: "warning",
        statusLabel: "Draft",
        actionLabel: "Revisar itens",
        reason: "Ainda depende de revisao antes da distribuicao.",
        href: "/quotes?quoteId=quo_draft_zero"
      },
      {
        id: "quo_archived_low:low",
        quoteId: "quo_archived_low",
        title: "Mouse ergonomico suporte",
        customerName: "Cliente Gama",
        valueLabel: formatQuoteCurrency(90000, "BRL"),
        priority: "low",
        priorityLabel: "Baixa",
        riskTone: "muted",
        statusLabel: "Arquivado",
        actionLabel: "Consultar historico",
        reason: "Orcamento arquivado preserva contexto historico.",
        href: "/quotes?quoteId=quo_archived_low"
      }
    ]);
  });

  it("resume o pipeline por estagios", () => {
    const viewModels = buildQuoteWorkbenchViewModels({
      quotes,
      customers
    });

    expect(buildQuotePipelineStages(viewModels)).toEqual([
      {
        key: "draft",
        label: "Draft",
        count: 2,
        totalCents: 2400000,
        valueLabel: formatQuoteCurrency(2400000, "BRL"),
        description: "Propostas em preparacao ou revisao comercial."
      },
      {
        key: "published",
        label: "Publicado",
        count: 1,
        totalCents: 450000,
        valueLabel: formatQuoteCurrency(450000, "BRL"),
        description: "Propostas prontas para consumo externo."
      },
      {
        key: "archived",
        label: "Arquivado",
        count: 1,
        totalCents: 90000,
        valueLabel: formatQuoteCurrency(90000, "BRL"),
        description: "Historico preservado para consulta."
      }
    ]);
  });

  it("calcula saude do pipeline a partir do resumo", () => {
    const viewModels = buildQuoteWorkbenchViewModels({
      quotes,
      customers
    });
    const summary = buildQuoteWorkbenchSummary({
      allQuotes: viewModels,
      visibleQuotes: viewModels
    });

    expect(buildQuotePipelineHealth(summary)).toEqual({
      score: 100,
      label: "Pipeline ativo",
      tone: "success",
      description: "Ha propostas em movimento, historico e valor comercial visivel."
    });
    expect(
      buildQuotePipelineHealth({
        ...summary,
        totalQuotes: 0,
        visibleQuotes: 0,
        draftQuotes: 0,
        publishedQuotes: 0,
        archivedQuotes: 0,
        totalVisibleCents: 0,
        averageVisibleCents: 0,
        highestVisibleQuote: null,
        mostRecentVisibleQuote: null
      })
    ).toEqual({
      score: 0,
      label: "Pipeline vazio",
      tone: "danger",
      description: "Crie ou importe o primeiro orcamento para iniciar leitura comercial."
    });
  });

  it("gera narrativa para pipeline vazio, filtrado e concentrado em drafts", () => {
    const emptySummary = buildQuoteWorkbenchSummary({
      allQuotes: [],
      visibleQuotes: []
    });

    expect(
      buildQuotePipelineNarrative({
        summary: emptySummary,
        filters: getDefaultQuoteWorkbenchFilters()
      })
    ).toMatchObject({
      headline: "Pipeline pronto para o primeiro orcamento"
    });

    expect(
      buildQuotePipelineNarrative({
        summary: {
          ...emptySummary,
          totalQuotes: 4
        },
        filters: {
          ...getDefaultQuoteWorkbenchFilters(),
          query: "sem resultado"
        }
      })
    ).toMatchObject({
      headline: "Filtros ocultam todo o pipeline"
    });

    const viewModels = buildQuoteWorkbenchViewModels({
      quotes,
      customers
    });
    const summary = buildQuoteWorkbenchSummary({
      allQuotes: viewModels,
      visibleQuotes: viewModels
    });

    expect(
      buildQuotePipelineNarrative({
        summary,
        filters: getDefaultQuoteWorkbenchFilters()
      })
    ).toMatchObject({
      headline: "Pipeline concentrado em drafts",
      bullets: [
        "2 draft(s) podem receber revisao ou publicacao.",
        "1 proposta(s) ja estao publicadas.",
        `Valor visivel medio: ${formatQuoteCurrency(735000, "BRL")}.`
      ]
    });
  });

  it("monta snapshot completo do pipeline", () => {
    const viewModels = buildQuoteWorkbenchViewModels({
      quotes,
      customers
    });
    const summary = buildQuoteWorkbenchSummary({
      allQuotes: viewModels,
      visibleQuotes: viewModels
    });

    expect(
      buildQuotePipelineSnapshot({
        summary,
        filters: getDefaultQuoteWorkbenchFilters(),
        visibleQuotes: viewModels
      })
    ).toMatchObject({
      health: {
        score: 100,
        label: "Pipeline ativo"
      },
      narrative: {
        headline: "Pipeline concentrado em drafts"
      },
      stages: [
        expect.objectContaining({ key: "draft", count: 2 }),
        expect.objectContaining({ key: "published", count: 1 }),
        expect.objectContaining({ key: "archived", count: 1 })
      ],
      priorityCards: expect.arrayContaining([
        expect.objectContaining({
          quoteId: "quo_draft_high",
          priority: "urgent"
        })
      ])
    });
  });

  it("monta timeline de versoes do detalhe", () => {
    expect(buildQuoteDetailTimeline(quoteDetail)).toEqual([
      {
        id: "qv_current",
        versionNumber: 2,
        label: "Versao 2",
        sourceLabel: "Importacao JSON",
        totalLabel: formatQuoteCurrency(2400000, "BRL"),
        itemCount: 1,
        createdAt: "2026-07-08T10:00:00.000Z",
        isCurrent: true
      },
      {
        id: "qv_previous",
        versionNumber: 1,
        label: "Primeira proposta",
        sourceLabel: "Manual",
        totalLabel: formatQuoteCurrency(1200000, "BRL"),
        itemCount: 1,
        createdAt: "2026-07-07T10:00:00.000Z",
        isCurrent: false
      }
    ]);
  });

  it("monta snapshot do detalhe com hints acionaveis", () => {
    expect(
      buildQuoteDetailSnapshot({
        detail: quoteDetail,
        customerName: "Cliente Alpha"
      })
    ).toEqual({
      quoteId: "quo_draft_high",
      title: "Renovacao notebooks diretoria",
      customerName: "Cliente Alpha",
      statusLabel: "Draft",
      currentVersionLabel: "Versao atual: 2",
      currentTotalLabel: formatQuoteCurrency(2400000, "BRL"),
      totalVersions: 2,
      totalItems: 3,
      averageItemValueLabel: formatQuoteCurrency(800000, "BRL"),
      sourceMixLabel: "Manual + Importacao JSON",
      timeline: buildQuoteDetailTimeline(quoteDetail),
      actionHints: [
        "Revise itens e notas antes de publicar a proposta.",
        "Compare versoes para entender mudancas de escopo e preco."
      ]
    });
  });
});
