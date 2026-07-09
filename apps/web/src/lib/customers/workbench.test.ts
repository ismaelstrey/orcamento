import { describe, expect, it } from "vitest";
import type { CustomerResponse } from "./schemas";
import {
  buildCustomerCsvContent,
  buildCustomerViewModel,
  buildCustomerViewModels,
  buildCustomerWorkbenchRecommendations,
  buildCustomerWorkbenchSummary,
  customerContactFilterOptions,
  customerSortOptions,
  filterCustomerViewModels,
  getDefaultCustomerWorkbenchFilters,
  hasActiveCustomerWorkbenchFilters
} from "./workbench";

const customers: CustomerResponse[] = [
  {
    id: "cus_full",
    name: "Cliente Completo",
    email: "contato@cliente.com",
    phone: "11999990000",
    document: "12345678000190",
    notes: "Cliente prioritario",
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-04T10:00:00.000Z"
  },
  {
    id: "cus_partial",
    name: "Beta Parcial",
    email: "beta@example.com",
    phone: null,
    document: null,
    notes: null,
    createdAt: "2026-07-02T10:00:00.000Z",
    updatedAt: "2026-07-03T10:00:00.000Z"
  },
  {
    id: "cus_empty",
    name: "Alpha Sem Contato",
    email: null,
    phone: null,
    document: null,
    notes: null,
    createdAt: "2026-07-03T10:00:00.000Z",
    updatedAt: "2026-07-02T10:00:00.000Z"
  }
];

describe("customers/workbench", () => {
  it("expoe opcoes estaveis para filtros e ordenacao", () => {
    expect(customerContactFilterOptions.map((option) => option.value)).toEqual([
      "all",
      "with_email",
      "with_phone",
      "with_document",
      "incomplete"
    ]);
    expect(customerSortOptions.map((option) => option.value)).toEqual([
      "updated_desc",
      "name_asc",
      "created_desc"
    ]);
  });

  it("cria view model com qualidade de contato e fallback legivel", () => {
    expect(buildCustomerViewModel(customers[0]!)).toMatchObject({
      id: "cus_full",
      contactScore: 3,
      contactLabel: "Contato completo",
      insight: "Cadastro pronto para uso comercial e identificacao do cliente."
    });

    expect(buildCustomerViewModel(customers[2]!)).toMatchObject({
      contactScore: 0,
      emailLabel: "Sem e-mail informado",
      phoneLabel: "Sem telefone",
      documentLabel: "Documento nao informado",
      contactLabel: "Sem contato"
    });
  });

  it("filtra clientes por dados de contato incompletos", () => {
    const viewModels = buildCustomerViewModels(customers);

    expect(
      filterCustomerViewModels(viewModels, {
        contact: "incomplete",
        sort: "updated_desc"
      }).map((customer) => customer.id)
    ).toEqual(["cus_partial", "cus_empty"]);
  });

  it("ordena clientes por nome", () => {
    const viewModels = buildCustomerViewModels(customers);

    expect(
      filterCustomerViewModels(viewModels, {
        contact: "all",
        sort: "name_asc"
      }).map((customer) => customer.id)
    ).toEqual(["cus_empty", "cus_partial", "cus_full"]);
  });

  it("resume a consulta visivel", () => {
    const viewModels = buildCustomerViewModels(customers);
    const visibleCustomers = filterCustomerViewModels(viewModels, {
      contact: "all",
      sort: "updated_desc"
    });

    expect(
      buildCustomerWorkbenchSummary({
        allCustomers: viewModels,
        visibleCustomers
      })
    ).toEqual({
      totalCustomers: 3,
      visibleCustomers: 3,
      customersWithEmail: 2,
      customersWithPhone: 1,
      customersWithDocument: 1,
      incompleteCustomers: 2
    });
  });

  it("detecta filtros ativos e recomenda saneamento da base", () => {
    expect(hasActiveCustomerWorkbenchFilters(getDefaultCustomerWorkbenchFilters())).toBe(
      false
    );
    expect(
      hasActiveCustomerWorkbenchFilters({
        contact: "with_email",
        sort: "updated_desc"
      })
    ).toBe(true);
    expect(
      buildCustomerWorkbenchRecommendations({
        totalCustomers: 3,
        visibleCustomers: 3,
        customersWithEmail: 2,
        customersWithPhone: 1,
        customersWithDocument: 1,
        incompleteCustomers: 2
      })
    ).toEqual(["2 cliente(s) visivel(is) precisam de dados complementares."]);
  });

  it("exporta CSV escapando celulas com virgula", () => {
    const [viewModel] = buildCustomerViewModels([
      {
        ...customers[0]!,
        name: "Cliente, Especial"
      }
    ]);

    expect(viewModel).toBeDefined();
    expect(buildCustomerCsvContent(viewModel ? [viewModel] : [])).toBe(
      [
        "id,nome,email,telefone,documento,qualidade_contato,atualizado_em",
        'cus_full,"Cliente, Especial",contato@cliente.com,11999990000,12345678000190,Contato completo,2026-07-04T10:00:00.000Z'
      ].join("\n")
    );
  });
});
