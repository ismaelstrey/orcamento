"use client";

import { useCallback, useState } from "react";
import type {
  CreateCustomerRequest,
  CustomerResponse,
  CustomersListResponse,
  UpdateCustomerRequest
} from "@/lib/customers/schemas";

interface UseCustomersState {
  items: CustomerResponse[];
  page: number;
  pageSize: number;
  total: number;
  isLoading: boolean;
  error: string | null;
}

type ErrorEnvelope = {
  details?: {
    message?: string;
  };
};

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
 * Monta os headers autenticados usados nas chamadas do módulo de clientes.
 */
function getRequestHeaders(accessToken: string | null): HeadersInit {
  if (!accessToken) {
    throw new Error("Sessão autenticada obrigatória para operar clientes.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`
  };
}

/**
 * Centraliza o acesso HTTP ao módulo de clientes para manter o componente limpo.
 */
export function useCustomers(accessToken: string | null) {
  const [state, setState] = useState<UseCustomersState>({
    items: [],
    page: 1,
    pageSize: 20,
    total: 0,
    isLoading: false,
    error: null
  });

  const setLoading = useCallback((isLoading: boolean) => {
    setState((currentState) => ({
      ...currentState,
      isLoading,
      error: isLoading ? null : currentState.error
    }));
  }, []);

  const loadCustomers = useCallback(
    async (input?: { page?: number; pageSize?: number; search?: string }) => {
      setLoading(true);

      try {
        const searchParams = new URLSearchParams();

        if (input?.page) {
          searchParams.set("page", String(input.page));
        }

        if (input?.pageSize) {
          searchParams.set("pageSize", String(input.pageSize));
        }

        if (input?.search) {
          searchParams.set("search", input.search);
        }

        const response = await fetch(`/api/v1/customers?${searchParams.toString()}`, {
          method: "GET",
          headers: getRequestHeaders(accessToken)
        });

        const data = (await response.json()) as CustomersListResponse | ErrorEnvelope;

        if (!response.ok) {
          throw new Error(getErrorMessage(data, "Falha ao carregar clientes."));
        }

        const payload = data as CustomersListResponse;

        setState({
          items: payload.items,
          page: payload.page,
          pageSize: payload.pageSize,
          total: payload.total,
          isLoading: false,
          error: null
        });

        return payload;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Falha ao carregar clientes.";

        setState((currentState) => ({
          ...currentState,
          isLoading: false,
          error: message
        }));

        throw error;
      }
    },
    [accessToken, setLoading]
  );

  const createCustomer = useCallback(
    async (input: CreateCustomerRequest): Promise<CustomerResponse> => {
      const response = await fetch("/api/v1/customers", {
        method: "POST",
        headers: getRequestHeaders(accessToken),
        body: JSON.stringify(input)
      });

      const data = (await response.json()) as CustomerResponse | ErrorEnvelope;

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Falha ao criar cliente."));
      }

      return data as CustomerResponse;
    },
    [accessToken]
  );

  const getCustomerById = useCallback(async (customerId: string) => {
    const response = await fetch(`/api/v1/customers/${customerId}`, {
      method: "GET",
      headers: getRequestHeaders(accessToken)
    });

    const data = (await response.json()) as CustomerResponse | ErrorEnvelope;

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Falha ao buscar cliente."));
    }

    return data as CustomerResponse;
  }, [accessToken]);

  const updateCustomer = useCallback(
    async (
      customerId: string,
      input: UpdateCustomerRequest
    ): Promise<CustomerResponse> => {
      const response = await fetch(`/api/v1/customers/${customerId}`, {
        method: "PATCH",
        headers: getRequestHeaders(accessToken),
        body: JSON.stringify(input)
      });

      const data = (await response.json()) as CustomerResponse | ErrorEnvelope;

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Falha ao atualizar cliente."));
      }

      return data as CustomerResponse;
    },
    [accessToken]
  );

  return {
    ...state,
    loadCustomers,
    createCustomer,
    getCustomerById,
    updateCustomer
  };
}
