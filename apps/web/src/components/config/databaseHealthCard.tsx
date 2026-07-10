"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthContext } from "@/components/auth/authProvider";
import type { DatabaseHealthResponse } from "@/lib/config/databaseHealth";
import { classNames } from "@/lib/utils/classNames";

type DatabaseHealthUiState =
  | {
      status: "idle" | "loading";
      data: null;
      error: null;
    }
  | {
      status: "success";
      data: DatabaseHealthResponse;
      error: null;
    }
  | {
      status: "error";
      data: DatabaseHealthResponse | null;
      error: string;
    };

const initialState: DatabaseHealthUiState = {
  status: "idle",
  data: null,
  error: null
};

function getCardClassName(state: DatabaseHealthUiState): string {
  if (state.status === "success" && state.data.status === "healthy") {
    return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  }

  if (state.status === "error" || state.data?.status === "unhealthy") {
    return "border-rose-300/20 bg-rose-500/10 text-rose-100";
  }

  return "border-sky-300/20 bg-sky-400/10 text-sky-100";
}

function formatCheckedAt(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(new Date(value));
}

async function parseHealthResponse(response: Response): Promise<{
  data: DatabaseHealthResponse | null;
  message: string;
}> {
  const payload = (await response.json()) as
    | DatabaseHealthResponse
    | {
        details?: {
          message?: string;
        };
      };

  if ("status" in payload && "latencyMs" in payload) {
    return {
      data: payload,
      message: payload.message
    };
  }

  return {
    data: null,
    message:
      payload.details?.message ??
      "Nao foi possivel executar o health check do banco."
  };
}

export function DatabaseHealthCard() {
  const { accessToken, roles } = useAuthContext();
  const [state, setState] = useState<DatabaseHealthUiState>(initialState);
  const canRunHealthCheck = Boolean(
    accessToken && roles.some((role) => role === "owner" || role === "admin")
  );

  const runHealthCheck = useCallback(async () => {
    if (!accessToken || !canRunHealthCheck) {
      return;
    }

    setState({
      status: "loading",
      data: null,
      error: null
    });

    try {
      const response = await fetch("/api/v1/config/database-health", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      const { data, message } = await parseHealthResponse(response);

      if (!data || !response.ok || data.status === "unhealthy") {
        setState({
          status: "error",
          data,
          error: message
        });
        return;
      }

      setState({
        status: "success",
        data,
        error: null
      });
    } catch {
      setState({
        status: "error",
        data: null,
        error: "Falha de rede ao executar o health check."
      });
    }
  }, [accessToken, canRunHealthCheck]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void runHealthCheck();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [runHealthCheck]);

  return (
    <article
      className={classNames(
        "rounded-2xl border p-4",
        getCardClassName(state)
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] opacity-75">
            Health check runtime
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            Consulta real via Prisma
          </h3>
          <p className="mt-2 text-sm leading-6 opacity-85">
            Valida o banco com uma consulta curta autenticada, sem revelar URL ou
            credenciais.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runHealthCheck()}
          disabled={!canRunHealthCheck || state.status === "loading"}
          className="inline-flex w-fit items-center justify-center rounded-full border border-white/15 bg-slate-950/35 px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state.status === "loading" ? "Verificando..." : "Verificar agora"}
        </button>
      </div>

      {!canRunHealthCheck ? (
        <p className="mt-4 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-xs leading-5">
          Disponivel apenas para perfis owner ou admin com sessao ativa.
        </p>
      ) : null}

      {state.data ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-70">
              Status
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {state.data.status === "healthy" ? "Saudavel" : "Indisponivel"}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-70">
              Latencia
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {state.data.latencyMs}ms
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-70">
              Verificado
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {formatCheckedAt(state.data.checkedAt)}
            </p>
          </div>
        </div>
      ) : null}

      <p className="mt-4 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-xs leading-5">
        {state.error ?? state.data?.message ?? "Aguardando verificacao runtime."}
      </p>
    </article>
  );
}
