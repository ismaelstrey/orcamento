import type { AuthContext, RoleCode } from "../types/auth";
import { AuthError } from "../utils/authErrors";

/**
 * Valida se o usuário possui ao menos um dos papéis permitidos.
 */
export function authorizeRoles(
  context: AuthContext,
  allowedRoles: RoleCode[]
): void {
  const isAllowed = context.roles.some((role) => allowedRoles.includes(role));

  if (!isAllowed) {
    throw new AuthError(
      "authorization_error",
      "Usuário sem permissão para acessar este recurso.",
      403
    );
  }
}
