import type { AuthenticatedRequestLike } from "@orcamento/auth";
import { authenticateRequest } from "@orcamento/auth";
import type { NextRequest } from "next/server";

/**
 * Converte os headers do NextRequest para o formato esperado pelo módulo auth.
 */
export function createAuthenticatedRequestLike(
  request: NextRequest
): AuthenticatedRequestLike {
  const headers: Record<string, string> = {};

  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    headers
  };
}

/**
 * Autentica a requisição e devolve o contexto pronto para uso.
 */
export function authenticateNextRequest(request: NextRequest) {
  const authRequest = createAuthenticatedRequestLike(request);
  const authContext = authenticateRequest(authRequest);

  return {
    authContext,
    authRequest
  };
}
