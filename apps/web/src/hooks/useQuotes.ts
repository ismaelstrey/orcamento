"use client";

import { useCallback } from "react";
import type {
  CreateQuoteRequest,
  CreateShareLinkRequest,
  ExportQuoteJsonResponse,
  CreateQuoteVersionRequest,
  GeneratePdfRequest,
  ImportQuoteJsonRequest,
  ImportQuoteJsonResponse,
  PdfResponse,
  PublicQuoteShare,
  QuoteDetail,
  QuoteSummary,
  QuoteVersionResponse,
  ShareLinkResponse,
  UpdateQuoteRequest
} from "@/lib/quotes/schemas";

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
 * Centraliza as chamadas HTTP do módulo de orçamentos para uso no frontend.
 */
export function useQuotes() {
  const listQuotes = useCallback(async (): Promise<QuoteSummary[]> => {
    const response = await fetch("/api/v1/quotes");
    const data = await parseJson<QuoteSummary[]>(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Falha ao carregar orçamentos."));
    }

    return data as QuoteSummary[];
  }, []);

  const createQuote = useCallback(async (input: CreateQuoteRequest) => {
    const response = await fetch("/api/v1/quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });

    const data = await parseJson<QuoteSummary>(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Falha ao criar orçamento."));
    }

    return data as QuoteSummary;
  }, []);

  const getQuoteById = useCallback(async (quoteId: string): Promise<QuoteDetail> => {
    const response = await fetch(`/api/v1/quotes/${quoteId}`);
    const data = await parseJson<QuoteDetail>(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Falha ao buscar orçamento."));
    }

    return data as QuoteDetail;
  }, []);

  const updateQuote = useCallback(
    async (quoteId: string, input: UpdateQuoteRequest): Promise<QuoteDetail> => {
      const response = await fetch(`/api/v1/quotes/${quoteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });

      const data = await parseJson<QuoteDetail>(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Falha ao atualizar orçamento."));
      }

      return data as QuoteDetail;
    },
    []
  );

  const listQuoteVersions = useCallback(
    async (quoteId: string): Promise<QuoteVersionResponse[]> => {
      const response = await fetch(`/api/v1/quotes/${quoteId}/versions`);
      const data = await parseJson<QuoteVersionResponse[]>(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Falha ao carregar versões do orçamento.")
        );
      }

      return data as QuoteVersionResponse[];
    },
    []
  );

  const getQuoteVersionById = useCallback(
    async (
      quoteId: string,
      versionId: string
    ): Promise<QuoteVersionResponse> => {
      const response = await fetch(
        `/api/v1/quotes/${quoteId}/versions/${versionId}`
      );
      const data = await parseJson<QuoteVersionResponse>(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Falha ao buscar versão do orçamento."));
      }

      return data as QuoteVersionResponse;
    },
    []
  );

  const createQuoteVersion = useCallback(
    async (
      quoteId: string,
      input: CreateQuoteVersionRequest
    ): Promise<QuoteVersionResponse> => {
      const response = await fetch(`/api/v1/quotes/${quoteId}/versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });

      const data = await parseJson<QuoteVersionResponse>(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Falha ao criar nova versão do orçamento.")
        );
      }

      return data as QuoteVersionResponse;
    },
    []
  );

  const listQuoteShareLinks = useCallback(
    async (quoteId: string): Promise<ShareLinkResponse[]> => {
      const response = await fetch(`/api/v1/quotes/${quoteId}/share-links`);
      const data = await parseJson<ShareLinkResponse[]>(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Falha ao carregar links de compartilhamento.")
        );
      }

      return data as ShareLinkResponse[];
    },
    []
  );

  const createQuoteShareLink = useCallback(
    async (
      quoteId: string,
      input: CreateShareLinkRequest
    ): Promise<ShareLinkResponse> => {
      const response = await fetch(`/api/v1/quotes/${quoteId}/share-links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });

      const data = await parseJson<ShareLinkResponse>(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Falha ao criar link de compartilhamento.")
        );
      }

      return data as ShareLinkResponse;
    },
    []
  );

  const revokeQuoteShareLink = useCallback(
    async (quoteId: string, shareLinkId: string): Promise<ShareLinkResponse> => {
      const response = await fetch(
        `/api/v1/quotes/${quoteId}/share-links/${shareLinkId}/revoke`,
        {
          method: "POST"
        }
      );
      const data = await parseJson<ShareLinkResponse>(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Falha ao revogar link de compartilhamento.")
        );
      }

      return data as ShareLinkResponse;
    },
    []
  );

  const getPublicQuoteBySlug = useCallback(
    async (slug: string): Promise<PublicQuoteShare> => {
      const response = await fetch(`/api/v1/public/quotes/${slug}`);
      const data = await parseJson<PublicQuoteShare>(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Falha ao carregar orçamento compartilhado.")
        );
      }

      return data as PublicQuoteShare;
    },
    []
  );

  const generateQuotePdf = useCallback(
    async (quoteId: string, input: GeneratePdfRequest = {}): Promise<PdfResponse> => {
      const response = await fetch(`/api/v1/quotes/${quoteId}/pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });
      const data = await parseJson<PdfResponse>(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Falha ao gerar PDF do orçamento."));
      }

      return data as PdfResponse;
    },
    []
  );

  const importQuoteFromJson = useCallback(
    async (input: ImportQuoteJsonRequest): Promise<ImportQuoteJsonResponse> => {
      const response = await fetch("/api/v1/quotes/import-json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });
      const data = await parseJson<ImportQuoteJsonResponse>(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Falha ao importar orçamento via JSON."));
      }

      return data as ImportQuoteJsonResponse;
    },
    []
  );

  const exportQuoteToJson = useCallback(
    async (quoteId: string): Promise<ExportQuoteJsonResponse> => {
      const response = await fetch(`/api/v1/quotes/${quoteId}/export-json`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await parseJson<ExportQuoteJsonResponse>(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Falha ao exportar orçamento em JSON."));
      }

      return data as ExportQuoteJsonResponse;
    },
    []
  );

  return {
    listQuotes,
    createQuote,
    getQuoteById,
    updateQuote,
    listQuoteVersions,
    getQuoteVersionById,
    createQuoteVersion,
    listQuoteShareLinks,
    createQuoteShareLink,
    revokeQuoteShareLink,
    getPublicQuoteBySlug,
    generateQuotePdf,
    importQuoteFromJson,
    exportQuoteToJson
  };
}
