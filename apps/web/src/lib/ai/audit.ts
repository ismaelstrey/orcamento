import { authorizeRoles, type AuthContext } from "@orcamento/auth";
import type { Prisma } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit/service";
import type { AiQuoteDraftProvider } from "./quoteDraft";
import {
  AiDraftGenerationError,
  generateQuoteDraftReviewWithFallback,
  type QuoteDraftFallbackReview
} from "./service";

function getRequestMetric(input: unknown, key: string): unknown {
  if (!input || typeof input !== "object" || !(key in input)) {
    return undefined;
  }

  return (input as Record<string, unknown>)[key];
}

function buildRequestAuditPayload(input: unknown): Prisma.InputJsonObject {
  const userText = getRequestMetric(input, "userText");
  const catalogHints = getRequestMetric(input, "catalogHints");
  const budgetMaxCents = getRequestMetric(input, "budgetMaxCents");
  const customerId = getRequestMetric(input, "customerId");

  return {
    ...(typeof customerId === "string" ? { customerId } : {}),
    userTextLength: typeof userText === "string" ? userText.length : 0,
    catalogHintsCount: Array.isArray(catalogHints) ? catalogHints.length : 0,
    ...(typeof budgetMaxCents === "number" ? { budgetMaxCents } : {})
  };
}

async function logAiAuditEvent(
  authContext: AuthContext,
  input: {
    action: string;
    payloadJson: Prisma.InputJsonValue;
  }
): Promise<void> {
  await logAuditEvent({
    tenantId: authContext.tenantId,
    actorUserId: authContext.userId,
    action: input.action,
    entityType: "ai_quote_draft",
    entityId: authContext.sessionId,
    payloadJson: input.payloadJson
  });
}

/**
 * Restringe o assistente de IA aos papéis que também podem operar orçamentos.
 */
export function ensureAiQuoteDraftAccess(authContext: AuthContext): void {
  authorizeRoles(authContext, ["owner", "admin", "seller"]);
}

/**
 * Gera draft de orçamento por IA e registra metadados de auditoria sem persistir o briefing bruto.
 */
export async function generateAuditedQuoteDraftReview(input: {
  authContext: AuthContext;
  providers: AiQuoteDraftProvider[];
  request: unknown;
}): Promise<QuoteDraftFallbackReview> {
  ensureAiQuoteDraftAccess(input.authContext);
  const requestAuditPayload = buildRequestAuditPayload(input.request);

  try {
    const review = await generateQuoteDraftReviewWithFallback({
      providers: input.providers,
      request: input.request
    });

    await logAiAuditEvent(input.authContext, {
      action: "ai.quote_draft.generate.success",
      payloadJson: {
        ...requestAuditPayload,
        promptVersion: review.promptVersion,
        provider: review.provider,
        warningCount: review.warnings.length,
        itemCount: review.importPayload.items.length,
        fallbackAttemptsCount: review.fallbackAttempts.length
      }
    });

    return review;
  } catch (error: unknown) {
    if (error instanceof AiDraftGenerationError) {
      await logAiAuditEvent(input.authContext, {
        action: "ai.quote_draft.generate.failure",
        payloadJson: {
          ...requestAuditPayload,
          code: error.code,
          ...(error.providerName ? { provider: error.providerName } : {})
        }
      });
    }

    throw error;
  }
}
