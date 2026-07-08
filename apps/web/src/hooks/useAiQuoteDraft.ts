"use client";

import { useCallback } from "react";
import type { AiQuoteDraftRequest } from "@/lib/ai/quoteDraft";
import type { QuoteDraftFallbackReview } from "@/lib/ai/service";

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

function getRequestHeaders(accessToken: string | null): HeadersInit {
  if (!accessToken) {
    throw new Error("Sessão autenticada obrigatória para usar o assistente de IA.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`
  };
}

/**
 * Centraliza as chamadas HTTP do assistente de IA para drafts de orçamento.
 */
export function useAiQuoteDraft(accessToken: string | null) {
  const generateQuoteDraft = useCallback(
    async (input: AiQuoteDraftRequest): Promise<QuoteDraftFallbackReview> => {
      const response = await fetch("/api/v1/ai/quote-draft", {
        method: "POST",
        headers: getRequestHeaders(accessToken),
        body: JSON.stringify(input)
      });
      const data = await parseJson<QuoteDraftFallbackReview>(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Falha ao gerar draft com assistente de IA.")
        );
      }

      return data as QuoteDraftFallbackReview;
    },
    [accessToken]
  );

  return {
    generateQuoteDraft
  };
}
