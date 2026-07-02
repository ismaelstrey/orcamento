import type { AuthAuditLogger } from "../repositories/authRepository";

/**
 * Fornece um logger de auditoria neutro para uso enquanto a auditoria real não existe.
 */
export function createNoopAuthAuditLogger(): AuthAuditLogger {
  return {
    async logSuccess(): Promise<void> {
      return;
    },
    async logFailure(): Promise<void> {
      return;
    }
  };
}
