import { createHash, randomBytes } from "node:crypto";

/**
 * Gera um token opaco para refresh token.
 */
export function generateOpaqueToken(size = 48): string {
  return randomBytes(size).toString("base64url");
}

/**
 * Gera um hash determinístico para persistir tokens sensíveis.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
