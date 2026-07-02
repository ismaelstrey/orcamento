import { NextResponse } from "next/server";
import { toErrorResponse } from "./errors";

/**
 * Retorna uma resposta JSON padronizada.
 */
export function jsonResponse<T>(body: T, status = 200): NextResponse<T> {
  return NextResponse.json(body, { status });
}

/**
 * Converte exceções conhecidas em respostas HTTP.
 */
export function errorResponse(error: unknown): NextResponse {
  const normalized = toErrorResponse(error);
  return NextResponse.json(normalized.body, { status: normalized.status });
}
