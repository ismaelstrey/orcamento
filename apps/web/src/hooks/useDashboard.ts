"use client";

import { useCallback, useState } from "react";
import type { DashboardSummaryResponse } from "@/lib/dashboard/schemas";

interface UseDashboardState {
  summary: DashboardSummaryResponse | null;
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
 * Centraliza o carregamento do resumo do dashboard para manter a UI desacoplada da API.
 */
export function useDashboard() {
  const [state, setState] = useState<UseDashboardState>({
    summary: null,
    isLoading: false,
    error: null
  });

  const loadDashboardSummary = useCallback(async () => {
    setState((currentState) => ({
      ...currentState,
      isLoading: true,
      error: null
    }));

    try {
      const response = await fetch("/api/v1/dashboard/summary", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data = (await response.json()) as DashboardSummaryResponse | ErrorEnvelope;

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Falha ao carregar dashboard."));
      }

      const payload = data as DashboardSummaryResponse;

      setState({
        summary: payload,
        isLoading: false,
        error: null
      });

      return payload;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Falha ao carregar dashboard.";

      setState((currentState) => ({
        ...currentState,
        isLoading: false,
        error: message
      }));

      throw error;
    }
  }, []);

  return {
    ...state,
    loadDashboardSummary
  };
}
