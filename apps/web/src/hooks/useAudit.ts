"use client";

import { useCallback, useState } from "react";
import type { AuditEventsResponse } from "@/lib/audit/schemas";

interface UseAuditState {
  events: AuditEventsResponse["items"];
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

export function useAudit(accessToken: string | null) {
  const [state, setState] = useState<UseAuditState>({
    events: [],
    isLoading: false,
    error: null
  });

  const loadRecentAuditEvents = useCallback(async () => {
    if (!accessToken) {
      setState({
        events: [],
        isLoading: false,
        error: null
      });

      return [];
    }

    setState((currentState) => ({
      ...currentState,
      isLoading: true,
      error: null
    }));

    try {
      const response = await fetch("/api/v1/audit/recent", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        }
      });
      const data = (await response.json()) as AuditEventsResponse | ErrorEnvelope;

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Falha ao carregar auditoria."));
      }

      const payload = data as AuditEventsResponse;

      setState({
        events: payload.items,
        isLoading: false,
        error: null
      });

      return payload.items;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Falha ao carregar auditoria.";

      setState((currentState) => ({
        ...currentState,
        isLoading: false,
        error: message
      }));

      throw error;
    }
  }, [accessToken]);

  return {
    ...state,
    loadRecentAuditEvents
  };
}
