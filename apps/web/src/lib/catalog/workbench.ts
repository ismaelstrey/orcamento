import type {
  BrandResponse,
  CategoryResponse,
  ProductResponse
} from "./schemas";

export type ProductStatusFilter = "all" | "active" | "inactive";
export type ProductPriceBandFilter = "all" | "budget" | "standard" | "premium";
export type ProductSortKey =
  | "updated_desc"
  | "name_asc"
  | "price_desc"
  | "price_asc";

export interface CatalogWorkbenchFilters {
  search: string;
  categoryId: string;
  status: ProductStatusFilter;
  priceBand: ProductPriceBandFilter;
  sort: ProductSortKey;
}

export interface ProductViewModel {
  id: string;
  categoryId: string;
  brandId: string | null;
  name: string;
  skuLabel: string;
  categoryLabel: string;
  brandLabel: string;
  priceLabel: string;
  basePriceCents: number;
  currency: string;
  statusLabel: string;
  isActive: boolean;
  specificationCount: number;
  specificationLabel: string;
  insight: string;
  createdAt: string;
  updatedAt: string;
  searchText: string;
}

export interface CatalogWorkbenchSummary {
  totalProducts: number;
  visibleProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  productsWithoutBrand: number;
  productsWithoutSku: number;
  averagePriceCents: number;
  totalInventoryValueCents: number;
}

export const productStatusFilterOptions: Array<{
  value: ProductStatusFilter;
  label: string;
}> = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "inactive", label: "Inativos" }
];

export const productPriceBandFilterOptions: Array<{
  value: ProductPriceBandFilter;
  label: string;
}> = [
  { value: "all", label: "Todas as faixas" },
  { value: "budget", label: "Ate R$ 1.000" },
  { value: "standard", label: "R$ 1.000 a R$ 5.000" },
  { value: "premium", label: "Acima de R$ 5.000" }
];

export const productSortOptions: Array<{ value: ProductSortKey; label: string }> = [
  { value: "updated_desc", label: "Atualizados recentemente" },
  { value: "name_asc", label: "Nome A-Z" },
  { value: "price_desc", label: "Maior preco" },
  { value: "price_asc", label: "Menor preco" }
];

export function getDefaultCatalogWorkbenchFilters(): CatalogWorkbenchFilters {
  return {
    search: "",
    categoryId: "all",
    status: "all",
    priceBand: "all",
    sort: "updated_desc"
  };
}

export function formatCatalogCurrency(
  valueInCents: number,
  currency: string
): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency
  }).format(valueInCents / 100);
}

function normalizeSearchToken(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function matchesPriceBand(
  priceCents: number,
  priceBand: ProductPriceBandFilter
): boolean {
  if (priceBand === "budget") {
    return priceCents <= 100_000;
  }

  if (priceBand === "standard") {
    return priceCents > 100_000 && priceCents <= 500_000;
  }

  if (priceBand === "premium") {
    return priceCents > 500_000;
  }

  return true;
}

function buildProductInsight(product: ProductResponse): string {
  if (!product.isActive) {
    return "Produto fora do catalogo ativo; revise antes de usar em orcamentos.";
  }

  if (!product.brandId) {
    return "Vincular uma marca melhora filtros comerciais e leitura da proposta.";
  }

  if (!product.sku) {
    return "Adicionar SKU facilita rastreio interno e integracoes futuras.";
  }

  if (!product.specifications.length) {
    return "Especificacoes tecnicas deixam o item mais claro para o cliente.";
  }

  return "Item pronto para uso em orcamentos e revisoes comerciais.";
}

export function buildProductViewModel(input: {
  product: ProductResponse;
  category: CategoryResponse | null;
  brand: BrandResponse | null;
}): ProductViewModel {
  const { product, category, brand } = input;
  const skuLabel = product.sku?.trim() || "Sem SKU";
  const categoryLabel = category?.name ?? "Categoria nao identificada";
  const brandLabel = brand?.name ?? "Sem marca vinculada";
  const specificationCount = product.specifications.length;

  return {
    id: product.id,
    categoryId: product.categoryId,
    brandId: product.brandId ?? null,
    name: product.name,
    skuLabel,
    categoryLabel,
    brandLabel,
    priceLabel: formatCatalogCurrency(product.basePriceCents, product.currency),
    basePriceCents: product.basePriceCents,
    currency: product.currency,
    statusLabel: product.isActive ? "Ativo" : "Inativo",
    isActive: product.isActive,
    specificationCount,
    specificationLabel:
      specificationCount === 1
        ? "1 especificacao"
        : `${specificationCount} especificacoes`,
    insight: buildProductInsight(product),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    searchText: [
      product.name,
      product.sku ?? "",
      product.description ?? "",
      categoryLabel,
      brandLabel,
      product.currency,
      ...product.specifications.flatMap((specification) => [
        specification.key,
        specification.value
      ])
    ]
      .map(normalizeSearchToken)
      .join(" ")
  };
}

export function buildProductViewModels(input: {
  products: ProductResponse[];
  categories: CategoryResponse[];
  brands: BrandResponse[];
}): ProductViewModel[] {
  const categoryMap = new Map(
    input.categories.map((category) => [category.id, category])
  );
  const brandMap = new Map(input.brands.map((brand) => [brand.id, brand]));

  return input.products.map((product) =>
    buildProductViewModel({
      product,
      category: categoryMap.get(product.categoryId) ?? null,
      brand: product.brandId ? brandMap.get(product.brandId) ?? null : null
    })
  );
}

export function sortProductViewModels(
  products: ProductViewModel[],
  sort: ProductSortKey
): ProductViewModel[] {
  return [...products].sort((left, right) => {
    if (sort === "name_asc") {
      return left.name.localeCompare(right.name, "pt-BR");
    }

    if (sort === "price_desc") {
      return right.basePriceCents - left.basePriceCents;
    }

    if (sort === "price_asc") {
      return left.basePriceCents - right.basePriceCents;
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

export function filterProductViewModels(
  products: ProductViewModel[],
  filters: CatalogWorkbenchFilters
): ProductViewModel[] {
  const normalizedSearch = normalizeSearchToken(filters.search);
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      filters.categoryId === "all" || product.categoryId === filters.categoryId;
    const matchesStatus =
      filters.status === "all" ||
      (filters.status === "active" && product.isActive) ||
      (filters.status === "inactive" && !product.isActive);
    const matchesBand = matchesPriceBand(product.basePriceCents, filters.priceBand);
    const matchesSearch =
      !normalizedSearch || product.searchText.includes(normalizedSearch);

    return matchesCategory && matchesStatus && matchesBand && matchesSearch;
  });

  return sortProductViewModels(filteredProducts, filters.sort);
}

export function hasActiveCatalogWorkbenchFilters(
  filters: CatalogWorkbenchFilters
): boolean {
  const defaults = getDefaultCatalogWorkbenchFilters();

  return (
    filters.search.trim().length > 0 ||
    filters.categoryId !== defaults.categoryId ||
    filters.status !== defaults.status ||
    filters.priceBand !== defaults.priceBand ||
    filters.sort !== defaults.sort
  );
}

export function buildCatalogWorkbenchSummary(input: {
  allProducts: ProductViewModel[];
  visibleProducts: ProductViewModel[];
}): CatalogWorkbenchSummary {
  const totalInventoryValueCents = input.visibleProducts.reduce(
    (sum, product) => sum + product.basePriceCents,
    0
  );

  return {
    totalProducts: input.allProducts.length,
    visibleProducts: input.visibleProducts.length,
    activeProducts: input.visibleProducts.filter((product) => product.isActive)
      .length,
    inactiveProducts: input.visibleProducts.filter((product) => !product.isActive)
      .length,
    productsWithoutBrand: input.visibleProducts.filter((product) => !product.brandId)
      .length,
    productsWithoutSku: input.visibleProducts.filter(
      (product) => product.skuLabel === "Sem SKU"
    ).length,
    averagePriceCents: input.visibleProducts.length
      ? Math.round(totalInventoryValueCents / input.visibleProducts.length)
      : 0,
    totalInventoryValueCents
  };
}

export function buildCatalogWorkbenchRecommendations(
  summary: CatalogWorkbenchSummary
): string[] {
  const recommendations: string[] = [];

  if (summary.inactiveProducts > 0) {
    recommendations.push(
      `${summary.inactiveProducts} produto(s) visivel(is) estao inativos.`
    );
  }

  if (summary.productsWithoutBrand > 0) {
    recommendations.push(
      `${summary.productsWithoutBrand} produto(s) precisam de marca vinculada.`
    );
  }

  if (summary.productsWithoutSku > 0) {
    recommendations.push(`${summary.productsWithoutSku} produto(s) sem SKU.`);
  }

  if (summary.visibleProducts === 0 && summary.totalProducts > 0) {
    recommendations.push("Ajuste os filtros para recuperar itens do catalogo.");
  }

  return recommendations.slice(0, 3);
}

function escapeCsvCell(value: string | number): string {
  const normalizedValue = String(value);

  if (!/[",\n]/.test(normalizedValue)) {
    return normalizedValue;
  }

  return `"${normalizedValue.replace(/"/g, '""')}"`;
}

export function buildCatalogCsvContent(products: ProductViewModel[]): string {
  const header = [
    "id",
    "nome",
    "categoria",
    "marca",
    "sku",
    "preco",
    "moeda",
    "status",
    "especificacoes",
    "atualizado_em"
  ];
  const rows = products.map((product) => [
    product.id,
    product.name,
    product.categoryLabel,
    product.brandLabel,
    product.skuLabel,
    product.basePriceCents,
    product.currency,
    product.statusLabel,
    product.specificationCount,
    product.updatedAt
  ]);

  return [header, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
}
