import { describe, expect, it } from "vitest";
import type {
  BrandResponse,
  CategoryResponse,
  ProductResponse
} from "./schemas";
import {
  buildCatalogCsvContent,
  buildCatalogWorkbenchRecommendations,
  buildCatalogWorkbenchSummary,
  buildProductViewModel,
  buildProductViewModels,
  filterProductViewModels,
  formatCatalogCurrency,
  getDefaultCatalogWorkbenchFilters,
  hasActiveCatalogWorkbenchFilters,
  productPriceBandFilterOptions,
  productSortOptions,
  productStatusFilterOptions
} from "./workbench";

const categories: CategoryResponse[] = [
  {
    id: "cat_note",
    name: "Notebooks",
    slug: "notebooks",
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z"
  },
  {
    id: "cat_service",
    name: "Servicos",
    slug: "servicos",
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z"
  }
];

const brands: BrandResponse[] = [
  {
    id: "brand_lenovo",
    name: "Lenovo",
    slug: "lenovo",
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z"
  }
];

const products: ProductResponse[] = [
  {
    id: "prod_full",
    categoryId: "cat_note",
    brandId: "brand_lenovo",
    name: "Notebook Pro",
    sku: "N-PRO",
    description: "Produto principal",
    basePriceCents: 650_000,
    currency: "BRL",
    isActive: true,
    specifications: [{ key: "memoria", value: "32GB" }],
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-04T10:00:00.000Z"
  },
  {
    id: "prod_budget",
    categoryId: "cat_note",
    brandId: null,
    name: "Mouse Basico",
    sku: null,
    description: null,
    basePriceCents: 9_900,
    currency: "BRL",
    isActive: true,
    specifications: [],
    createdAt: "2026-07-02T10:00:00.000Z",
    updatedAt: "2026-07-03T10:00:00.000Z"
  },
  {
    id: "prod_inactive",
    categoryId: "cat_service",
    brandId: null,
    name: "Instalacao legado",
    sku: "LEG-1",
    description: null,
    basePriceCents: 150_000,
    currency: "BRL",
    isActive: false,
    specifications: [],
    createdAt: "2026-07-03T10:00:00.000Z",
    updatedAt: "2026-07-02T10:00:00.000Z"
  }
];

function buildFixtureViewModels() {
  return buildProductViewModels({
    products,
    categories,
    brands
  });
}

describe("catalog/workbench", () => {
  it("expoe opcoes estaveis para filtros e ordenacao", () => {
    expect(productStatusFilterOptions.map((option) => option.value)).toEqual([
      "all",
      "active",
      "inactive"
    ]);
    expect(productPriceBandFilterOptions.map((option) => option.value)).toEqual([
      "all",
      "budget",
      "standard",
      "premium"
    ]);
    expect(productSortOptions.map((option) => option.value)).toEqual([
      "updated_desc",
      "name_asc",
      "price_desc",
      "price_asc"
    ]);
  });

  it("formata moeda e cria view model comercial", () => {
    const viewModel = buildProductViewModel({
      product: products[0]!,
      category: categories[0]!,
      brand: brands[0]!
    });

    expect(formatCatalogCurrency(650_000, "BRL")).toContain("6.500,00");
    expect(viewModel).toMatchObject({
      id: "prod_full",
      categoryLabel: "Notebooks",
      brandLabel: "Lenovo",
      skuLabel: "N-PRO",
      statusLabel: "Ativo",
      specificationLabel: "1 especificacao",
      insight: "Item pronto para uso em orcamentos e revisoes comerciais."
    });
  });

  it("filtra por busca, categoria, status e faixa de preco", () => {
    const viewModels = buildFixtureViewModels();

    expect(
      filterProductViewModels(viewModels, {
        ...getDefaultCatalogWorkbenchFilters(),
        search: "mouse",
        categoryId: "cat_note",
        status: "active",
        priceBand: "budget"
      }).map((product) => product.id)
    ).toEqual(["prod_budget"]);

    expect(
      filterProductViewModels(viewModels, {
        ...getDefaultCatalogWorkbenchFilters(),
        status: "inactive",
        priceBand: "standard"
      }).map((product) => product.id)
    ).toEqual(["prod_inactive"]);
  });

  it("ordena por preco e nome", () => {
    const viewModels = buildFixtureViewModels();

    expect(
      filterProductViewModels(viewModels, {
        ...getDefaultCatalogWorkbenchFilters(),
        sort: "price_desc"
      }).map((product) => product.id)
    ).toEqual(["prod_full", "prod_inactive", "prod_budget"]);

    expect(
      filterProductViewModels(viewModels, {
        ...getDefaultCatalogWorkbenchFilters(),
        sort: "name_asc"
      }).map((product) => product.id)
    ).toEqual(["prod_inactive", "prod_budget", "prod_full"]);
  });

  it("resume a consulta visivel", () => {
    const viewModels = buildFixtureViewModels();
    const visibleProducts = filterProductViewModels(viewModels, {
      ...getDefaultCatalogWorkbenchFilters(),
      sort: "price_asc"
    });

    expect(
      buildCatalogWorkbenchSummary({
        allProducts: viewModels,
        visibleProducts
      })
    ).toEqual({
      totalProducts: 3,
      visibleProducts: 3,
      activeProducts: 2,
      inactiveProducts: 1,
      productsWithoutBrand: 2,
      productsWithoutSku: 1,
      averagePriceCents: 269_967,
      totalInventoryValueCents: 809_900
    });
  });

  it("detecta filtros ativos e gera recomendacoes", () => {
    expect(hasActiveCatalogWorkbenchFilters(getDefaultCatalogWorkbenchFilters())).toBe(
      false
    );
    expect(
      hasActiveCatalogWorkbenchFilters({
        ...getDefaultCatalogWorkbenchFilters(),
        search: "note"
      })
    ).toBe(true);
    expect(
      buildCatalogWorkbenchRecommendations({
        totalProducts: 3,
        visibleProducts: 3,
        activeProducts: 2,
        inactiveProducts: 1,
        productsWithoutBrand: 2,
        productsWithoutSku: 1,
        averagePriceCents: 269_967,
        totalInventoryValueCents: 809_900
      })
    ).toEqual([
      "1 produto(s) visivel(is) estao inativos.",
      "2 produto(s) precisam de marca vinculada.",
      "1 produto(s) sem SKU."
    ]);
  });

  it("exporta CSV escapando campos com virgula", () => {
    const [viewModel] = buildProductViewModels({
      products: [
        {
          ...products[0]!,
          name: "Notebook, Especial"
        }
      ],
      categories,
      brands
    });

    expect(viewModel).toBeDefined();
    expect(buildCatalogCsvContent(viewModel ? [viewModel] : [])).toBe(
      [
        "id,nome,categoria,marca,sku,preco,moeda,status,especificacoes,atualizado_em",
        'prod_full,"Notebook, Especial",Notebooks,Lenovo,N-PRO,650000,BRL,Ativo,1,2026-07-04T10:00:00.000Z'
      ].join("\n")
    );
  });
});
