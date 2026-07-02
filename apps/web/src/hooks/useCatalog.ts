"use client";

import { useCallback } from "react";
import type {
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

export function useCatalog() {
  const listCategories = useCallback(async () => {
    const response = await fetch("/api/v1/categories");
    const data = await parseJson<
      Array<{
        id: string;
        name: string;
        slug: string;
        createdAt: string;
        updatedAt: string;
      }>
    >(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Falha ao carregar categorias."));
    }

    return data as Array<{
      id: string;
      name: string;
      slug: string;
      createdAt: string;
      updatedAt: string;
    }>;
  }, []);

  const createCategory = useCallback(async (input: CreateCategoryRequest) => {
    const response = await fetch("/api/v1/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });

    const data = await parseJson(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Falha ao criar categoria."));
    }

    return data as {
      id: string;
      name: string;
      slug: string;
      createdAt: string;
      updatedAt: string;
    };
  }, []);

  const listBrands = useCallback(async () => {
    const response = await fetch("/api/v1/brands");
    const data = await parseJson<
      Array<{
        id: string;
        name: string;
        slug: string;
        createdAt: string;
        updatedAt: string;
      }>
    >(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Falha ao carregar marcas."));
    }

    return data as Array<{
      id: string;
      name: string;
      slug: string;
      createdAt: string;
      updatedAt: string;
    }>;
  }, []);

  const createBrand = useCallback(async (input: CreateBrandRequest) => {
    const response = await fetch("/api/v1/brands", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });

    const data = await parseJson(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Falha ao criar marca."));
    }

    return data as {
      id: string;
      name: string;
      slug: string;
      createdAt: string;
      updatedAt: string;
    };
  }, []);

  const listProducts = useCallback(async (): Promise<ProductResponse[]> => {
    const response = await fetch("/api/v1/products");
    const data = await parseJson<ProductResponse[]>(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Falha ao carregar produtos."));
    }

    return data as ProductResponse[];
  }, []);

  const createProduct = useCallback(async (input: CreateProductRequest) => {
    const response = await fetch("/api/v1/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });

    const data = await parseJson<ProductResponse>(response);

    if (!response.ok) {
        throw new Error(getErrorMessage(data, "Falha ao criar produto."));
    }

      return data as ProductResponse;
  }, []);


  const getProductById = useCallback(async (productId: string) => {
    const response = await fetch(`/api/v1/products/${productId}`);
    const data = await parseJson<ProductResponse>(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Falha ao buscar produto."));
    }

    return data as ProductResponse;
  }, []);

  const updateProduct = useCallback(
    async (productId: string, input: UpdateProductRequest) => {
      const response = await fetch(`/api/v1/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });

      const data = await parseJson<ProductResponse>(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Falha ao atualizar produto."));
      }

      return data as ProductResponse;
    },
    []
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
