"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/components/auth/authProvider";
import { useCatalog } from "@/hooks/useCatalog";
import type {
  BrandResponse,
  CategoryResponse,
  CreateBrandRequest,
  CreateCategoryRequest,
  CreateProductRequest,
  ProductResponse,
  UpdateProductRequest
} from "@/lib/catalog/schemas";

interface SimpleEntryFormValues {
  name: string;
  slug: string;
}

interface ProductFormValues {
  categoryId: string;
  brandId: string;
  name: string;
  sku: string;
  description: string;
  basePrice: string;
  currency: string;
  specificationsText: string;
}

const initialSimpleEntryFormValues: SimpleEntryFormValues = {
  name: "",
  slug: ""
};

const initialProductFormValues: ProductFormValues = {
  categoryId: "",
  brandId: "",
  name: "",
  sku: "",
  description: "",
  basePrice: "",
  currency: "BRL",
  specificationsText: ""
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatCurrency(valueInCents: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency
  }).format(valueInCents / 100);
}

/**
 * Gera um slug simples com base no nome digitado para acelerar o cadastro.
 */
function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Converte o bloco de texto do formulário em especificações estruturadas.
 */
function parseSpecificationsText(input: string): CreateProductRequest["specifications"] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [rawKey, ...rawValue] = line.split(":");
      const key = rawKey?.trim() ?? "";
      const value = rawValue.join(":").trim();

      if (!key || !value) {
        throw new Error(
          "Use o formato chave: valor nas especificações do produto."
        );
      }

      return {
        key,
        value
      };
    });
}

function mapProductToFormValues(product: ProductResponse): ProductFormValues {
  return {
    categoryId: product.categoryId,
    brandId: product.brandId ?? "",
    name: product.name,
    sku: product.sku ?? "",
    description: product.description ?? "",
    basePrice: (product.basePriceCents / 100).toFixed(2).replace(".", ","),
    currency: product.currency,
    specificationsText: product.specifications
      .map((specification) => `${specification.key}: ${specification.value}`)
      .join("\n")
  };
}

export default function CatalogPage() {
  const { accessToken, tenant } = useAuthContext();
  const {
    listCategories,
    createCategory,
    listBrands,
    createBrand,
    listProducts,
    createProduct,
    getProductById,
    updateProduct
  } = useCatalog(accessToken);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categoryForm, setCategoryForm] = useState<SimpleEntryFormValues>(
    initialSimpleEntryFormValues
  );
  const [brandForm, setBrandForm] = useState<SimpleEntryFormValues>(
    initialSimpleEntryFormValues
  );
  const [productForm, setProductForm] = useState<ProductFormValues>(
    initialProductFormValues
  );
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [isSubmittingBrand, setIsSubmittingBrand] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [isLoadingProductDetail, setIsLoadingProductDetail] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null);
  const [brandMessage, setBrandMessage] = useState<string | null>(null);
  const [productMessage, setProductMessage] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );
  const brandMap = useMemo(
    () => new Map(brands.map((brand) => [brand.id, brand])),
    [brands]
  );

  const refreshCatalog = useCallback(async () => {
    setIsLoading(true);
    setPageError(null);

    try {
      const [nextCategories, nextBrands, nextProducts] = await Promise.all([
        listCategories(),
        listBrands(),
        listProducts()
      ]);

      setCategories(nextCategories);
      setBrands(nextBrands);
      setProducts(nextProducts);

      setProductForm((currentValues) => ({
        ...currentValues,
        categoryId:
          currentValues.categoryId ||
          nextCategories[0]?.id ||
          initialProductFormValues.categoryId
      }));
    } catch (catalogError: unknown) {
      setPageError(
        catalogError instanceof Error
          ? catalogError.message
          : "Falha ao carregar o catálogo."
      );
    } finally {
      setIsLoading(false);
    }
  }, [listBrands, listCategories, listProducts]);

  useEffect(() => {
    const refreshCatalogTimeout = window.setTimeout(() => {
      void refreshCatalog();
    }, 0);

    return () => {
      window.clearTimeout(refreshCatalogTimeout);
    };
  }, [refreshCatalog]);

  async function handleCategorySubmit(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    setIsSubmittingCategory(true);
    setCategoryMessage(null);
    setPageError(null);

    const payload: CreateCategoryRequest = {
      name: categoryForm.name.trim(),
      slug: categoryForm.slug.trim()
    };

    try {
      await createCategory(payload);
      setCategoryForm(initialSimpleEntryFormValues);
      setCategoryMessage("Categoria criada com sucesso.");
      await refreshCatalog();
    } catch (categoryError: unknown) {
      setPageError(
        categoryError instanceof Error
          ? categoryError.message
          : "Falha ao criar categoria."
      );
    } finally {
      setIsSubmittingCategory(false);
    }
  }

  async function handleBrandSubmit(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    setIsSubmittingBrand(true);
    setBrandMessage(null);
    setPageError(null);

    const payload: CreateBrandRequest = {
      name: brandForm.name.trim(),
      slug: brandForm.slug.trim()
    };

    try {
      await createBrand(payload);
      setBrandForm(initialSimpleEntryFormValues);
      setBrandMessage("Marca criada com sucesso.");
      await refreshCatalog();
    } catch (brandError: unknown) {
      setPageError(
        brandError instanceof Error ? brandError.message : "Falha ao criar marca."
      );
    } finally {
      setIsSubmittingBrand(false);
    }
  }

  async function handleSelectProduct(productId: string): Promise<void> {
    setIsLoadingProductDetail(true);
    setProductMessage(null);
    setProductError(null);

    try {
      const product = await getProductById(productId);
      setSelectedProductId(product.id);
      setProductForm(mapProductToFormValues(product));
    } catch (selectionError: unknown) {
      setProductError(
        selectionError instanceof Error
          ? selectionError.message
          : "Falha ao carregar produto."
      );
    } finally {
      setIsLoadingProductDetail(false);
    }
  }

  function handleResetProductForm(): void {
    setSelectedProductId(null);
    setProductForm({
      ...initialProductFormValues,
      categoryId: categories[0]?.id ?? ""
    });
    setProductMessage(null);
    setProductError(null);
  }

  function handleProductFieldChange(
    field: keyof ProductFormValues,
    value: string
  ): void {
    setProductForm((currentValues) => ({
      ...currentValues,
      [field]: value
    }));
  }

  async function handleProductSubmit(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    setIsSubmittingProduct(true);
    setProductMessage(null);
    setProductError(null);

    try {
      const basePriceNormalized = productForm.basePrice.replace(",", ".");
      const basePriceCents = Math.round(Number(basePriceNormalized) * 100);

      if (Number.isNaN(basePriceCents)) {
        throw new Error("Informe um preco base valido para o produto.");
      }

      const payloadBase = {
        categoryId: productForm.categoryId,
        ...(productForm.brandId ? { brandId: productForm.brandId } : {}),
        name: productForm.name.trim(),
        ...(productForm.sku.trim() ? { sku: productForm.sku.trim() } : {}),
        ...(productForm.description.trim()
          ? { description: productForm.description.trim() }
          : {}),
        basePriceCents,
        currency: productForm.currency.trim().toUpperCase(),
        specifications: parseSpecificationsText(productForm.specificationsText)
      };

      if (selectedProductId) {
        const updatedProduct = await updateProduct(
          selectedProductId,
          payloadBase as UpdateProductRequest
        );

        setProductMessage("Produto atualizado com sucesso.");
        await refreshCatalog();
        await handleSelectProduct(updatedProduct.id);
      } else {
        const createdProduct = await createProduct(
          payloadBase as CreateProductRequest
        );

        setProductMessage("Produto criado com sucesso.");
        await refreshCatalog();
        await handleSelectProduct(createdProduct.id);
      }
    } catch (submissionError: unknown) {
      setProductError(
        submissionError instanceof Error
          ? submissionError.message
          : "Falha ao salvar produto."
      );
    } finally {
      setIsSubmittingProduct(false);
    }
  }

  return (
    <div className="grid gap-5">
      <header className="flex flex-col gap-5 rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.32em] text-sky-200">
            Catalogo
          </span>
          <h1 className="mt-4 text-4xl leading-tight tracking-tight text-white">
            Estruture categorias, marcas e produtos
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Organize a base comercial do tenant {tenant?.name} para acelerar a
            montagem dos proximos orcamentos.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-200">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-sky-200/70">
            Panorama atual
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            {categories.length} categoria(s), {brands.length} marca(s) e{" "}
            {products.length} produto(s) carregados.
          </p>
        </div>
      </header>

      {pageError ? (
        <section className="rounded-[1.75rem] border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-100">
          {pageError}
        </section>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="grid gap-5">
          <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
              Categorias
            </p>
            <h2 className="mt-3 text-2xl text-white">Base de classificacao</h2>

            <form className="mt-6 grid gap-4" onSubmit={handleCategorySubmit}>
              <label className="grid gap-2 text-sm text-slate-200">
                <span>Nome</span>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(event) =>
                    setCategoryForm({
                      name: event.target.value,
                      slug: slugify(event.target.value)
                    })
                  }
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                  placeholder="Notebooks"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm text-slate-200">
                <span>Slug</span>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(event) =>
                    setCategoryForm((currentValues) => ({
                      ...currentValues,
                      slug: event.target.value
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                  placeholder="notebooks"
                  required
                />
              </label>

              {categoryMessage ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
                  {categoryMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmittingCategory}
                className="inline-flex w-fit rounded-full border border-sky-300/20 bg-sky-400/10 px-5 py-3 font-medium text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingCategory ? "Salvando..." : "Criar categoria"}
              </button>
            </form>

            <div className="mt-6 grid gap-3">
              {isLoading ? (
                [0, 1].map((item) => (
                  <div
                    key={item}
                    className="h-20 rounded-2xl border border-white/10 bg-white/5"
                  />
                ))
              ) : categories.length ? (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                  >
                    <p className="text-base font-medium text-white">{category.name}</p>
                    <p className="mt-1 text-sm text-slate-300">Slug: {category.slug}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                      Atualizada em {formatDate(category.updatedAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                  Nenhuma categoria cadastrada ainda.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
              Marcas
            </p>
            <h2 className="mt-3 text-2xl text-white">Referencias comerciais</h2>

            <form className="mt-6 grid gap-4" onSubmit={handleBrandSubmit}>
              <label className="grid gap-2 text-sm text-slate-200">
                <span>Nome</span>
                <input
                  type="text"
                  value={brandForm.name}
                  onChange={(event) =>
                    setBrandForm({
                      name: event.target.value,
                      slug: slugify(event.target.value)
                    })
                  }
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                  placeholder="Lenovo"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm text-slate-200">
                <span>Slug</span>
                <input
                  type="text"
                  value={brandForm.slug}
                  onChange={(event) =>
                    setBrandForm((currentValues) => ({
                      ...currentValues,
                      slug: event.target.value
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                  placeholder="lenovo"
                  required
                />
              </label>

              {brandMessage ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
                  {brandMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmittingBrand}
                className="inline-flex w-fit rounded-full border border-sky-300/20 bg-sky-400/10 px-5 py-3 font-medium text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingBrand ? "Salvando..." : "Criar marca"}
              </button>
            </form>

            <div className="mt-6 grid gap-3">
              {isLoading ? (
                [0, 1].map((item) => (
                  <div
                    key={item}
                    className="h-20 rounded-2xl border border-white/10 bg-white/5"
                  />
                ))
              ) : brands.length ? (
                brands.map((brand) => (
                  <div
                    key={brand.id}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                  >
                    <p className="text-base font-medium text-white">{brand.name}</p>
                    <p className="mt-1 text-sm text-slate-300">Slug: {brand.slug}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                      Atualizada em {formatDate(brand.updatedAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                  Nenhuma marca cadastrada ainda.
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="grid gap-5">
          <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
                  Produtos
                </p>
                <h2 className="mt-3 text-2xl text-white">
                  Cadastro operacional do catalogo
                </h2>
              </div>

              <button
                type="button"
                onClick={handleResetProductForm}
                className="inline-flex w-fit rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Novo produto
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleProductSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-200">
                  <span>Categoria</span>
                  <select
                    value={productForm.categoryId}
                    onChange={(event) =>
                      handleProductFieldChange("categoryId", event.target.value)
                    }
                    className="rounded-2xl border border-white/10 bg-[#0c1526] px-4 py-3 text-white outline-none transition focus:border-sky-300/40"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-slate-200">
                  <span>Marca</span>
                  <select
                    value={productForm.brandId}
                    onChange={(event) =>
                      handleProductFieldChange("brandId", event.target.value)
                    }
                    className="rounded-2xl border border-white/10 bg-[#0c1526] px-4 py-3 text-white outline-none transition focus:border-sky-300/40"
                  >
                    <option value="">Sem marca vinculada</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-200">
                  <span>Nome</span>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(event) =>
                      handleProductFieldChange("name", event.target.value)
                    }
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                    placeholder="Notebook ThinkPad T14"
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm text-slate-200">
                  <span>SKU</span>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(event) =>
                      handleProductFieldChange("sku", event.target.value)
                    }
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                    placeholder="SKU-001"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-200">
                  <span>Preco base</span>
                  <input
                    type="text"
                    value={productForm.basePrice}
                    onChange={(event) =>
                      handleProductFieldChange("basePrice", event.target.value)
                    }
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                    placeholder="1599,90"
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm text-slate-200">
                  <span>Moeda</span>
                  <input
                    type="text"
                    value={productForm.currency}
                    onChange={(event) =>
                      handleProductFieldChange("currency", event.target.value)
                    }
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white uppercase outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                    placeholder="BRL"
                    maxLength={3}
                    required
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm text-slate-200">
                <span>Descricao</span>
                <textarea
                  value={productForm.description}
                  onChange={(event) =>
                    handleProductFieldChange("description", event.target.value)
                  }
                  className="min-h-28 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                  placeholder="Resumo comercial e tecnico do item."
                />
              </label>

              <label className="grid gap-2 text-sm text-slate-200">
                <span>Especificacoes</span>
                <textarea
                  value={productForm.specificationsText}
                  onChange={(event) =>
                    handleProductFieldChange(
                      "specificationsText",
                      event.target.value
                    )
                  }
                  className="min-h-32 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                  placeholder={"memoria: 16GB\narmazenamento: 512GB SSD"}
                />
              </label>

              {isLoadingProductDetail ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  Carregando detalhes do produto selecionado...
                </div>
              ) : null}

              {productError ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {productError}
                </div>
              ) : null}

              {productMessage ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
                  {productMessage}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 md:flex-row">
                <button
                  type="submit"
                  disabled={
                    isSubmittingProduct ||
                    isLoadingProductDetail ||
                    categories.length === 0
                  }
                  className="inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-5 py-3 font-medium text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingProduct
                    ? "Salvando..."
                    : selectedProductId
                      ? "Salvar produto"
                      : "Criar produto"}
                </button>
                <button
                  type="button"
                  onClick={handleResetProductForm}
                  className="inline-flex rounded-full border border-white/10 bg-white/10 px-5 py-3 font-medium text-white transition hover:bg-white/15"
                >
                  Limpar formulario
                </button>
              </div>
            </form>
          </article>

          <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
              Lista de produtos
            </p>
            <div className="mt-6 grid gap-3">
              {isLoading ? (
                [0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-24 rounded-2xl border border-white/10 bg-white/5"
                  />
                ))
              ) : products.length ? (
                products.map((product) => {
                  const isSelected = product.id === selectedProductId;
                  const categoryName = categoryMap.get(product.categoryId)?.name;
                  const brandName = product.brandId
                    ? brandMap.get(product.brandId)?.name
                    : null;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => void handleSelectProduct(product.id)}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        isSelected
                          ? "border-sky-300/30 bg-sky-400/15"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-base font-medium text-white">
                            {product.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-300">
                            {categoryName ?? "Categoria nao identificada"}
                            {brandName ? ` | ${brandName}` : ""}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            {product.sku ? `SKU: ${product.sku}` : "Sem SKU"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-[var(--accent)]">
                            {formatCurrency(product.basePriceCents, product.currency)}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                            {product.isActive ? "Ativo" : "Inativo"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                  Nenhum produto cadastrado ainda.
                </div>
              )}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
