import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { env } from "@orcamento/shared";
import type { AuthenticatedPayload, AuthContext, RoleCode } from "../types/auth";
import { AuthError } from "./authErrors";

const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;

/**
 * Emite o access token do contexto autenticado.
 */
export function issueAccessToken(input: {
  userId: string;
  tenantId: string;
  sessionId: string;
  roles: RoleCode[];
}): { accessToken: string; expiresIn: number } {
  const payload: AuthenticatedPayload = {
    sub: input.userId,
    tenantId: input.tenantId,
    sessionId: input.sessionId,
    roles: input.roles,
    type: "access"
  };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"]
  } as SignOptions);

  return {
    accessToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS
  };
}

/**
 * Valida e normaliza o access token para o contexto interno.
 */
export function verifyAccessToken(accessToken: string): AuthContext {
  try {
    const payload = jwt.verify(
      accessToken,
      env.JWT_ACCESS_SECRET as Secret
    ) as AuthenticatedPayload;

    if (payload.type !== "access") {
      throw new AuthError(
        "authentication_error",
        "Tipo de token inválido.",
        401
      );
    }

    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      sessionId: payload.sessionId,
      roles: payload.roles
    };
  } catch {
    throw new AuthError(
      "authentication_error",
      "Access token inválido ou expirado.",
      401
    );
  }
}
