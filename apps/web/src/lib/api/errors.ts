import { AuthError } from "@orcamento/auth";
import { ZodError } from "zod";
import { AiDraftGenerationError } from "@/lib/ai/service";

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
