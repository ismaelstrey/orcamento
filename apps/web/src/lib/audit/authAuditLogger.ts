import type { AuthAuditLogger } from "@orcamento/auth";
import { logAuditEvent } from "./service";

function resolveAuthEntityId(input: {
  sessionId?: string;
  userId?: string;
  email?: string;
}): string {
  return input.sessionId ?? input.userId ?? input.email ?? "unknown";
}

/**
 * Adapta a auditoria do módulo auth para o modelo AuditLog da aplicação.
 */
export function createPrismaAuthAuditLogger(): AuthAuditLogger {
  return {
    async logSuccess(action, context): Promise<void> {
      await logAuditEvent({
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: `auth.${action}.success`,
        entityType: "auth",
        entityId: resolveAuthEntityId(context),
        payloadJson: {
          sessionId: context.sessionId ?? null
        }
      });
    },
    async logFailure(action, context): Promise<void> {
      await logAuditEvent({
        tenantId: context.tenantId ?? null,
        actorUserId: context.userId ?? null,
        action: `auth.${action}.failure`,
        entityType: "auth",
        entityId: resolveAuthEntityId(context),
        payloadJson: {
          email: context.email ?? null,
          sessionId: context.sessionId ?? null,
          reason: context.reason
        }
      });
    }
  };
}
