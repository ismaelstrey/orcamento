import { describe, expect, it } from "vitest";
import type { CustomerResponse } from "@/lib/customers/schemas";
import type { QuoteSummary } from "./schemas";
import {
  buildQuoteWorkbenchCsvContent,
  buildQuoteWorkbenchPagination,
  buildQuoteWorkbenchRecommendations,
  buildQuoteWorkbenchSummary,
  buildQuoteWorkbenchViewModel,
  buildQuoteWorkbenchViewModels,
  classifyQuoteValueBand,
  filterQuoteWorkbenchViewModels,
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
});
