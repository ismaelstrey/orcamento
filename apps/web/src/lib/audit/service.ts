import { authorizeRoles, type AuthContext } from "@orcamento/auth";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { AuditEventsResponse } from "./schemas";

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
  findMany(args: {
    where: {
      tenantId: string;
    };
    orderBy: {
      createdAt: "desc";
    };
    take: number;
    select: {
      id: true;
      action: true;
      entityType: true;
      entityId: true;
      payloadJson: true;
      createdAt: true;
      actorUser: {
        select: {
          name: true;
          email: true;
        };
      };
    };
  }): Promise<
    Array<{
      id: string;
      action: string;
      entityType: string;
      entityId: string;
      payloadJson: Prisma.JsonValue | null;
      createdAt: Date;
      actorUser: {
        name: string;
        email: string;
      } | null;
    }>
  >;
}

type PrismaAuditClient = PrismaClient & {
  auditLog: AuditLogDelegate;
};

function getAuditClient(): PrismaAuditClient {
  // O client Prisma pode estar sem regenerate neste ambiente; o cast mantém a integração compilável.
  return prisma as PrismaAuditClient;
}

function getPayloadRecord(payloadJson: Prisma.JsonValue | null): Record<string, unknown> {
  if (!payloadJson || typeof payloadJson !== "object" || Array.isArray(payloadJson)) {
    return {};
  }

  return payloadJson as Record<string, unknown>;
}

function buildAuditPayloadSummary(
  action: string,
  payloadJson: Prisma.JsonValue | null
): string[] {
  const payload = getPayloadRecord(payloadJson);
  const summary: string[] = [];

  if (action.startsWith("ai.quote_draft.")) {
    if (typeof payload.provider === "string") {
      summary.push(`Provider: ${payload.provider}`);
    }

    if (typeof payload.promptVersion === "string") {
      summary.push(`Prompt: ${payload.promptVersion}`);
    }

    if (typeof payload.outputSchemaVersion === "string") {
      summary.push(`Schema: ${payload.outputSchemaVersion}`);
    }

    if (typeof payload.model === "string") {
      summary.push(`Modelo: ${payload.model}`);
    }

    if (typeof payload.totalTokens === "number") {
      summary.push(`Tokens: ${payload.totalTokens}`);
    }

    if (typeof payload.estimatedCostCents === "number") {
      summary.push(`Custo estimado: ${payload.estimatedCostCents} centavos`);
    }

    if (typeof payload.durationMs === "number") {
      summary.push(`Duração: ${payload.durationMs}ms`);
    }

    if (typeof payload.itemCount === "number") {
      summary.push(`Itens sugeridos: ${payload.itemCount}`);
    }

    if (typeof payload.confidenceAverage === "number") {
      summary.push(`Confianca media: ${Math.round(payload.confidenceAverage * 100)}%`);
    }

    if (typeof payload.confidenceMin === "number") {
      summary.push(`Confianca minima: ${Math.round(payload.confidenceMin * 100)}%`);
    }

    if (typeof payload.warningCount === "number") {
      summary.push(`Alertas: ${payload.warningCount}`);
    }

    if (typeof payload.fallbackAttemptsCount === "number") {
      summary.push(`Fallbacks: ${payload.fallbackAttemptsCount}`);
    }

    if (typeof payload.code === "string") {
      summary.push(`Erro: ${payload.code}`);
    }

    return summary;
  }

  if (typeof payload.warningCount === "number") {
    summary.push(`Alertas: ${payload.warningCount}`);
  }

  if (typeof payload.normalizedItemsCount === "number") {
    summary.push(`Itens normalizados: ${payload.normalizedItemsCount}`);
  }

  if (typeof payload.currentVersionId === "string") {
    summary.push("Versão inicial registrada");
  }

  if (typeof payload.quoteId === "string") {
    summary.push(`Orcamento: ${payload.quoteId}`);
  }

  if (typeof payload.versionId === "string") {
    summary.push(`Versao ID: ${payload.versionId}`);
  }

  if (typeof payload.quoteVersionId === "string") {
    summary.push(`Versao ID: ${payload.quoteVersionId}`);
  }

  if (typeof payload.versionNumber === "number") {
    summary.push(`Versao: ${payload.versionNumber}`);
  }

  if (typeof payload.slug === "string") {
    summary.push(`Slug publico: ${payload.slug}`);
  }

  return summary;
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

/**
 * Lista eventos recentes de auditoria do tenant para leitura operacional.
 */
export async function listRecentAuditEvents(
  authContext: AuthContext
): Promise<AuditEventsResponse> {
  authorizeRoles(authContext, ["owner", "admin"]);

  const events = await getAuditClient().auditLog.findMany({
    where: {
      tenantId: authContext.tenantId
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 8,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      payloadJson: true,
      createdAt: true,
      actorUser: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  return {
    items: events.map((event) => ({
      id: event.id,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      actorUserName: event.actorUser?.name ?? null,
      actorUserEmail: event.actorUser?.email ?? null,
      payloadSummary: buildAuditPayloadSummary(event.action, event.payloadJson),
      createdAt: event.createdAt.toISOString()
    }))
  };
}
