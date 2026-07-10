import { describe, expect, it } from "vitest";
import { buildApiAccessPolicySummary } from "./apiAccess";
import type { CommercialPlan } from "./readiness";

const enterprisePlan: CommercialPlan = {
  tier: "enterprise",
  monthlyPriceCents: 39900,
  userLimit: 50,
  quoteLimit: 5000,
  includesPublicSharing: true,
  includesApiAccess: true
};

describe("commercial/apiAccess", () => {
  it("libera API e webhooks quando plano, limite e assinatura estao prontos", () => {
    const summary = buildApiAccessPolicySummary({
      plan: enterprisePlan,
      requestedEvents: ["quote.created", "quote.shared"],
      hasSigningSecret: true,
      monthlyRequestLimit: 10000,
      usedRequests: 2500
    });

    expect(summary).toMatchObject({
      tone: "success",
      score: 100,
      tier: "enterprise",
      apiEnabled: true,
      webhookEnabled: true,
      requestUsagePercent: 25,
      remainingRequests: 7500,
      blockers: []
    });
    expect(summary.allowedEvents).toEqual(["quote.created", "quote.shared"]);
  });

  it("bloqueia API quando plano nao inclui acesso ou limite foi consumido", () => {
    const summary = buildApiAccessPolicySummary({
      plan: {
        ...enterprisePlan,
        tier: "starter",
        includesApiAccess: false
      },
      requestedEvents: [],
      hasSigningSecret: false,
      monthlyRequestLimit: 100,
      usedRequests: 100
    });

    expect(summary.apiEnabled).toBe(false);
    expect(summary.webhookEnabled).toBe(false);
    expect(summary.tone).toBe("danger");
    expect(summary.blockers).toEqual([
      "Plano atual nao inclui acesso API.",
      "Limite mensal de API foi consumido.",
      "Definir segredo de assinatura para webhooks.",
      "Selecionar pelo menos um evento de webhook suportado."
    ]);
  });
});
