"use client";

import { useCallback } from "react";
import type {
  BrandResponse,
  CategoryResponse,
  CreateBrandRequest,
  CreateCategoryRequest,
  CreateProductRequest,
  ProductResponse,
  UpdateProductRequest
} from "@/lib/catalog/schemas";

type ErrorEnvelope = {
  details?: {
    message?: string;
  };
};

async function parseJson<T>(response: Response): Promise<T | ErrorEnvelope> {
  return response.json() as Promise<T | ErrorEnvelope>;
}

function getErrorMessage(data: ErrorEnvelope | unknown, fallback: string): string {
  if (
    data &&
    typeof data === "object" &&
    "details" in data &&
    data.details &&
    typeof data.details === "object" &&
    "message" in data.details &&
    typeof data.details.message === "string"
  ) {
    return data.details.message;
  }

  return fallback;
}

/**
 * Monta os headers autenticados usados nas chamadas do módulo de catálogo.
 */
function getRequestHeaders(accessToken: string | null): HeadersInit {
  if (!accessToken) {
    throw new Error("Sessão autenticada obrigatória para operar o catálogo.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`
  };
}

export function useCatalog(accessToken: string | null) {
  const listCategories = useCallback(async () => {
    const response = await fetch("/api/v1/categories", {
      headers: getRequestHeaders(accessToken)
    });
    const data = await parseJson<CategoryResponse[]>(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Falha ao carregar categorias."));
    }

    return data as CategoryResponse[];
  }, [accessToken]);

  const createCategory = useCallback(async (input: CreateCategoryRequest) => {
    const response = await fetch("/api/v1/categories", {
      method: "POST",
      headers: getRequestHeaders(accessToken),
      body: JSON.stringify(input)
    });

    const data = await parseJson<CategoryResponse>(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Falha ao criar categoria."));
    }

    return data as CategoryResponse;
  }, [accessToken]);

  const listBrands = useCallback(async () => {
    const response = await fetch("/api/v1/brands", {
      headers: getRequestHeaders(accessToken)
    });
    const data = await parseJson<BrandResponse[]>(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Falha ao carregar marcas."));
    }

    return data as BrandResponse[];
  }, [accessToken]);

  const createBrand = useCallback(async (input: CreateBrandRequest) => {
    const response = await fetch("/api/v1/brands", {
      method: "POST",
      headers: getRequestHeaders(accessToken),
      body: JSON.stringify(input)
    });

    const data = await parseJson<BrandResponse>(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Falha ao criar marca."));
    }

    return data as BrandResponse;
  }, [accessToken]);

  const listProducts = useCallback(async (): Promise<ProductResponse[]> => {
    const response = await fetch("/api/v1/products", {
      headers: getRequestHeaders(accessToken)
    });
    const data = await parseJson<ProductResponse[]>(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Falha ao carregar produtos."));
    }

    return data as ProductResponse[];
  }, [accessToken]);

  const createProduct = useCallback(async (input: CreateProductRequest) => {
    const response = await fetch("/api/v1/products", {
      method: "POST",
      headers: getRequestHeaders(accessToken),
      body: JSON.stringify(input)
    });

    const data = await parseJson<ProductResponse>(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Falha ao criar produto."));
    }

    return data as ProductResponse;
  }, [accessToken]);


  const getProductById = useCallback(async (productId: string) => {
    const response = await fetch(`/api/v1/products/${productId}`, {
      headers: getRequestHeaders(accessToken)
    });
    const data = await parseJson<ProductResponse>(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Falha ao buscar produto."));
    }

    return data as ProductResponse;
  }, [accessToken]);

  const updateProduct = useCallback(
    async (productId: string, input: UpdateProductRequest) => {
      const response = await fetch(`/api/v1/products/${productId}`, {
        method: "PATCH",
        headers: getRequestHeaders(accessToken),
        body: JSON.stringify(input)
      });

      const data = await parseJson<ProductResponse>(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Falha ao atualizar produto."));
      }

      return data as ProductResponse;
    },
    [accessToken]
  );

  return {
    listCategories,
    createCategory,
    listBrands,
    createBrand,
    listProducts,
    createProduct,
    getProductById,
    updateProduct
  };
}
