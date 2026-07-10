import type { CommercialPlan, CommercialPlanTier } from "./readiness";

export type ApiAccessTone = "success" | "warning" | "danger";
export type WebhookEvent =
  | "quote.created"
  | "quote.updated"
  | "quote.shared"
  | "quote.accepted";

export interface ApiAccessPolicyInput {
  plan: CommercialPlan;
  requestedEvents: WebhookEvent[];
  hasSigningSecret: boolean;
  monthlyRequestLimit: number;
  usedRequests: number;
}

export interface ApiAccessPolicySummary {
  tone: ApiAccessTone;
  score: number;
  tier: CommercialPlanTier;
  apiEnabled: boolean;
  webhookEnabled: boolean;
  requestUsagePercent: number;
  remainingRequests: number;
  allowedEvents: WebhookEvent[];
  blockers: string[];
  safeguards: string[];
}

const supportedEvents: WebhookEvent[] = [
  "quote.created",
  "quote.updated",
  "quote.shared",
  "quote.accepted"
];

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getTone(score: number): ApiAccessTone {
  if (score >= 85) {
    return "success";
  }

  if (score >= 60) {
    return "warning";
  }

  return "danger";
}

export function buildApiAccessPolicySummary(
  input: ApiAccessPolicyInput
): ApiAccessPolicySummary {
  const requestUsagePercent =
    input.monthlyRequestLimit > 0
      ? clampPercent((input.usedRequests / input.monthlyRequestLimit) * 100)
      : 100;
  const remainingRequests = Math.max(
    0,
    input.monthlyRequestLimit - input.usedRequests
  );
  const allowedEvents = input.requestedEvents.filter((event) =>
    supportedEvents.includes(event)
  );
  const apiEnabled =
    input.plan.includesApiAccess &&
    input.monthlyRequestLimit > 0 &&
    requestUsagePercent < 100;
  const webhookEnabled =
    apiEnabled && input.hasSigningSecret && allowedEvents.length > 0;
  const blockers = [
    !input.plan.includesApiAccess
      ? "Plano atual nao inclui acesso API."
      : null,
    input.monthlyRequestLimit <= 0 ? "Definir limite mensal de requisicoes." : null,
    requestUsagePercent >= 100 ? "Limite mensal de API foi consumido." : null,
    !input.hasSigningSecret ? "Definir segredo de assinatura para webhooks." : null,
    allowedEvents.length === 0
      ? "Selecionar pelo menos um evento de webhook suportado."
      : null
  ].filter(Boolean) as string[];
  let score = 25;

  if (input.plan.includesApiAccess) {
    score += 25;
  }

  if (input.monthlyRequestLimit > 0 && requestUsagePercent < 85) {
    score += 20;
  }

  if (input.hasSigningSecret) {
    score += 15;
  }

  if (allowedEvents.length > 0) {
    score += 15;
  }

  const finalScore = clampPercent(score - blockers.length * 8);

  return {
    tone: getTone(finalScore),
    score: finalScore,
    tier: input.plan.tier,
    apiEnabled,
    webhookEnabled,
    requestUsagePercent,
    remainingRequests,
    allowedEvents,
    blockers,
    safeguards: [
      "Usar chaves por tenant com revogacao independente.",
      "Assinar payloads de webhook com segredo por ambiente.",
      "Aplicar rate limit por plano antes de expor endpoints externos."
    ]
  };
}
