import { AuthError } from "@orcamento/auth";
import { ZodError } from "zod";
import { AiDraftGenerationError } from "@/lib/ai/service";

function getErrorRecord(error: unknown): Record<string, unknown> | null {
  return error && typeof error === "object"
    ? (error as Record<string, unknown>)
    : null;
}

function getNestedCause(error: unknown): unknown {
  const record = getErrorRecord(error);

  return record && "cause" in record ? record.cause : undefined;
}

function isPrismaDatabaseUnavailableError(error: unknown): boolean {
  const record = getErrorRecord(error);
  const code = record?.code;
  const message =
    error instanceof Error ? error.message : String(record?.message ?? "");

  if (code === "P1001" || code === "P1002") {
    return true;
  }

  if (
    message.includes("Can't reach database server") ||
    message.includes("Timed out fetching a new connection") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT")
  ) {
    return true;
  }

  const cause = getNestedCause(error);

  return cause ? isPrismaDatabaseUnavailableError(cause) : false;
}

/**
 * Normaliza erros conhecidos para o envelope HTTP da aplicação.
 */
export function toErrorResponse(error: unknown): {
  status: number;
  body: {
    error: string;
    details?: {
      field?: string;
      message: string;
    };
  };
} {
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const field = issue?.path.join(".");

    return {
      status: 400,
      body: {
        error: "validation_error",
        details: field
          ? {
              field,
              message: issue?.message ?? "Payload inválido."
            }
          : {
              message: issue?.message ?? "Payload inválido."
            }
      }
    };
  }

  if (error instanceof AuthError) {
    return {
      status: error.statusCode,
      body: {
        error: error.code,
        details: {
          message: error.message
        }
      }
    };
  }

  if (error instanceof AiDraftGenerationError) {
    return {
      status: error.code === "invalid_provider_output" ? 502 : 503,
      body: {
        error: error.code,
        details: {
          message: error.message
        }
      }
    };
  }

  if (isPrismaDatabaseUnavailableError(error)) {
    return {
      status: 503,
      body: {
        error: "database_unavailable",
        details: {
          message:
            "Banco de dados indisponivel. Verifique a conexao com o Postgres/Neon e as variaveis DATABASE_URL e DIRECT_URL."
        }
      }
    };
  }

  return {
    status: 500,
    body: {
      error: "internal_server_error",
      details: {
        message: "Erro interno não tratado."
      }
    }
  };
}
