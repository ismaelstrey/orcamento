export type CommercialPlanTier = "starter" | "professional" | "enterprise";

export interface CommercialPlan {
  tier: CommercialPlanTier;
  monthlyPriceCents: number;
  userLimit: number;
  quoteLimit: number;
  includesPublicSharing: boolean;
  includesApiAccess: boolean;
}

export interface CommercialReadinessSummary {
  score: number;
  hasPaidTier: boolean;
  hasApiTier: boolean;
  planCount: number;
  publicSharingTiers: number;
  apiAccessTiers: number;
  recommendedTier: CommercialPlanTier | null;
  gaps: string[];
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildCommercialReadinessSummary(
  plans: CommercialPlan[]
): CommercialReadinessSummary {
  const hasPaidTier = plans.some((plan) => plan.monthlyPriceCents > 0);
  const hasApiTier = plans.some((plan) => plan.includesApiAccess);
  const publicSharingTiers = plans.filter(
    (plan) => plan.includesPublicSharing
  ).length;
  const apiAccessTiers = plans.filter((plan) => plan.includesApiAccess).length;
  const professional =
    plans.find((plan) => plan.tier === "professional") ?? plans[0] ?? null;
  const gaps = [
    plans.length < 3 ? "Definir pelo menos tres tiers comerciais." : null,
    !hasPaidTier ? "Adicionar plano pago para validar monetizacao." : null,
    publicSharingTiers === 0
      ? "Associar compartilhamento publico a pelo menos um plano."
      : null,
    !hasApiTier ? "Reservar acesso API para plano avancado." : null
  ].filter(Boolean) as string[];
  let score = 20;

  if (plans.length >= 3) {
    score += 25;
  }

  if (hasPaidTier) {
    score += 25;
  }

  if (publicSharingTiers > 0) {
    score += 15;
  }

  if (hasApiTier) {
    score += 15;
  }

  return {
    score: clampPercent(score - gaps.length * 5),
    hasPaidTier,
    hasApiTier,
    planCount: plans.length,
    publicSharingTiers,
    apiAccessTiers,
    recommendedTier: professional?.tier ?? null,
    gaps
  };
}
