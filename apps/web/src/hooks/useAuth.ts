"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthResponse, MeResponse, RoleCode, UserStatus } from "@orcamento/auth";

const accessTokenStorageKey = "orcamento.accessToken";

interface AuthUserState {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
}

interface AuthTenantState {
  id: string;
  name: string;
  slug: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUserState | null;
  tenant: AuthTenantState | null;
  roles: RoleCode[];
  isBootstrapping: boolean;
  isSubmitting: boolean;
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
 * Persiste ou remove o access token do navegador para reaproveitar a sessão.
 */
function persistAccessToken(accessToken: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (accessToken) {
    window.localStorage.setItem(accessTokenStorageKey, accessToken);
    return;
  }

  window.localStorage.removeItem(accessTokenStorageKey);
}

/**
 * Centraliza a autenticação do frontend com persistência simples em localStorage.
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    user: null,
    tenant: null,
    roles: [],
    isBootstrapping: true,
    isSubmitting: false,
    error: null
  });

  const applyAuthenticatedSession = useCallback(
    (input: {
      accessToken: string;
      user: AuthUserState;
      tenant: AuthTenantState;
      roles: RoleCode[];
    }) => {
      persistAccessToken(input.accessToken);
      setState({
        accessToken: input.accessToken,
        user: input.user,
        tenant: input.tenant,
        roles: input.roles,
        isBootstrapping: false,
        isSubmitting: false,
        error: null
      });
    },
    []
  );

  const clearSession = useCallback((error: string | null = null) => {
    persistAccessToken(null);
    setState({
      accessToken: null,
      user: null,
      tenant: null,
      roles: [],
      isBootstrapping: false,
      isSubmitting: false,
      error
    });
  }, []);

  const restoreSession = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    const storedAccessToken = window.localStorage.getItem(accessTokenStorageKey);

    if (!storedAccessToken) {
      setState((currentState) => ({
        ...currentState,
        isBootstrapping: false
      }));
      return;
    }

    try {
      const response = await fetch("/api/v1/auth/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedAccessToken}`
        }
      });

      const data = (await response.json()) as MeResponse | ErrorEnvelope;

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Não foi possível restaurar a sessão.")
        );
      }

      const payload = data as MeResponse;

      applyAuthenticatedSession({
        accessToken: storedAccessToken,
        user: payload.user,
        tenant: payload.tenant,
        roles: payload.roles
      });
    } catch {
      clearSession("Sua sessão expirou. Faça login novamente.");
    }
  }, [applyAuthenticatedSession, clearSession]);

  useEffect(() => {
    const restoreSessionTimeout = window.setTimeout(() => {
      void restoreSession();
    }, 0);

    return () => {
      window.clearTimeout(restoreSessionTimeout);
    };
  }, [restoreSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      setState((currentState) => ({
        ...currentState,
        isSubmitting: true,
        error: null
      }));

      try {
        const response = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        });

        const data = (await response.json()) as AuthResponse | ErrorEnvelope;

        if (!response.ok) {
          throw new Error(getErrorMessage(data, "Falha ao realizar login."));
        }

        const payload = data as AuthResponse;

        applyAuthenticatedSession({
          accessToken: payload.accessToken,
          user: payload.user,
          tenant: payload.tenant,
          roles: payload.roles
        });

        return payload;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Falha ao realizar login.";

        setState((currentState) => ({
          ...currentState,
          isSubmitting: false,
          error: message
        }));

        throw error;
      }
    },
    [applyAuthenticatedSession]
  );

  const logout = useCallback(async () => {
    const accessToken = state.accessToken;

    if (accessToken) {
      try {
        await fetch("/api/v1/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          }
        });
      } catch {
        // Mantém a limpeza local mesmo se o backend falhar.
      }
    }

    clearSession(null);
  }, [clearSession, state.accessToken]);

  return {
    ...state,
    isAuthenticated: Boolean(state.accessToken && state.user && state.tenant),
    login,
    logout
  };
}
