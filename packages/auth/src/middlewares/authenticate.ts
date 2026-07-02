import type { AuthenticatedRequestLike, AuthContext } from "../types/auth";
import { AuthError } from "../utils/authErrors";
import { verifyAccessToken } from "../utils/jwt";

function normalizeAuthorizationHeader(
  headers: AuthenticatedRequestLike["headers"]
): string | undefined {
  const rawHeader = headers.authorization ?? headers.Authorization;

  if (Array.isArray(rawHeader)) {
    return rawHeader[0];
  }

  return rawHeader;
}

/**
 * Extrai o token Bearer e monta o contexto autenticado da requisição.
 */
export function authenticateRequest(
  request: AuthenticatedRequestLike
): AuthContext {
  const authorizationHeader = normalizeAuthorizationHeader(request.headers);

  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AuthError(
      "authentication_error",
      "Header Authorization ausente ou inválido.",
      401
    );
  }

  const accessToken = authorizationHeader.slice("Bearer ".length).trim();
  const authContext = verifyAccessToken(accessToken);
  request.authContext = authContext;

  return authContext;
}
