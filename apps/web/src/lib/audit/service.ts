import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

interface AuditLogCreateData {
  tenantId?: string | null;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  payloadJson?: Prisma.InputJsonValue;
}

interface AuditLogDelegate {
  create(args: {
    data: AuditLogCreateData;
  }): Promise<unknown>;
}

type PrismaAuditClient = PrismaClient & {
  auditLog: AuditLogDelegate;
};

function getAuditClient(): PrismaAuditClient {
  // O client Prisma pode estar sem regenerate neste ambiente; o cast mantém a integração compilável.
  return prisma as PrismaAuditClient;
}

/**
 * Persiste um evento mínimo de auditoria para rastrear ações sensíveis do MVP.
 */
export async function logAuditEvent(input: AuditLogCreateData): Promise<void> {
  await getAuditClient().auditLog.create({
    data: {
      tenantId: input.tenantId ?? null,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      ...(input.payloadJson !== undefined ? { payloadJson: input.payloadJson } : {})
    }
  });
}
