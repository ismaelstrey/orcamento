import type { CommercialPlanTier } from "./readiness";

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";
export type ExternalApiKeyStatus = "active" | "revoked";
export type CommercialGovernanceTone = "success" | "warning" | "danger";

export interface PersistedCommercialPlanInput {
  id: string;
  tier: CommercialPlanTier;
  code: string;
  monthlyPriceCents: number;
  includesApiAccess: boolean;
}

export interface TenantSubscriptionInput {
  id: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
}

export interface ExternalApiKeyInput {
  id: string;
  name: string;
  status: ExternalApiKeyStatus;
}

export interface WebhookEndpointInput {
  id: string;
  isActive: boolean;
  events: string[];
  hasSigningSecretHash: boolean;
}

export interface CommercialGovernanceSummary {
  tone: CommercialGovernanceTone;
  score: number;
  planCount: number;
  activeSubscriptionCount: number;
  activeApiKeyCount: number;
  activeWebhookCount: number;
  canOperateCommercially: boolean;
  blockers: string[];
  safeguards: string[];
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getTone(score: number): CommercialGovernanceTone {
  if (score >= 85) {
    return "success";
  }

  if (score >= 60) {
    return "warning";
  }

  return "danger";
}

export function buildCommercialGovernanceSummary(input: {
  plans: PersistedCommercialPlanInput[];
  subscriptions: TenantSubscriptionInput[];
  apiKeys: ExternalApiKeyInput[];
  webhookEndpoints: WebhookEndpointInput[];
  now?: Date;
}): CommercialGovernanceSummary {
  const now = input.now ?? new Date();
  const planIds = new Set(input.plans.map((plan) => plan.id));
  const activeSubscriptionCount = input.subscriptions.filter(
    (subscription) =>
      subscription.status === "active" &&
      planIds.has(subscription.planId) &&
      new Date(subscription.currentPeriodEnd).getTime() >= now.getTime()
  ).length;
  const activeApiKeyCount = input.apiKeys.filter(
    (apiKey) => apiKey.status === "active"
  ).length;
  const activeWebhookCount = input.webhookEndpoints.filter(
    (webhook) =>
      webhook.isActive && webhook.hasSigningSecretHash && webhook.events.length > 0
  ).length;
  const hasApiPlan = input.plans.some((plan) => plan.includesApiAccess);
  const hasPaidPlan = input.plans.some((plan) => plan.monthlyPriceCents > 0);
  const hasBrokenSubscription = input.subscriptions.some(
    (subscription) => !planIds.has(subscription.planId)
  );
  const blockers = [
    input.plans.length < 3 ? "Persistir tres tiers comerciais." : null,
    !hasPaidPlan ? "Persistir ao menos um plano pago." : null,
    activeSubscriptionCount === 0 ? "Persistir assinatura ativa do tenant." : null,
    hasApiPlan && activeApiKeyCount === 0
      ? "Criar chave API ativa para plano com acesso externo."
      : null,
    hasApiPlan && activeWebhookCount === 0
      ? "Configurar webhook ativo com segredo e eventos."
      : null,
    hasBrokenSubscription
      ? "Existe assinatura apontando para plano inexistente."
      : null
  ].filter(Boolean) as string[];
  let score = 20;

  if (input.plans.length >= 3) {
    score += 20;
  }

  if (hasPaidPlan) {
    score += 15;
  }

  if (activeSubscriptionCount > 0) {
    score += 20;
  }

  if (!hasApiPlan || activeApiKeyCount > 0) {
    score += 15;
  }

  if (!hasApiPlan || activeWebhookCount > 0) {
    score += 10;
  }

  const finalScore = clampPercent(score - blockers.length * 8);

  return {
    tone: getTone(finalScore),
    score: finalScore,
    planCount: input.plans.length,
    activeSubscriptionCount,
    activeApiKeyCount,
    activeWebhookCount,
    canOperateCommercially: finalScore >= 85 && blockers.length === 0,
    blockers,
    safeguards: [
      "Chaves API devem armazenar apenas hash revogavel.",
      "Webhooks exigem assinatura por endpoint.",
      "Assinaturas precisam respeitar periodo ativo e plano existente."
    ]
  };
}
