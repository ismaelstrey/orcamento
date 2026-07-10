import { describe, expect, it } from "vitest";
import { buildCommercialReadinessSummary, type CommercialPlan } from "./readiness";

const plans: CommercialPlan[] = [
  {
    tier: "starter",
    monthlyPriceCents: 9900,
    userLimit: 2,
    quoteLimit: 50,
    includesPublicSharing: true,
    includesApiAccess: false
  },
  {
    tier: "professional",
    monthlyPriceCents: 24900,
    userLimit: 8,
    quoteLimit: 300,
    includesPublicSharing: true,
    includesApiAccess: false
  },
  {
    tier: "enterprise",
    monthlyPriceCents: 79900,
    userLimit: 50,
    quoteLimit: 2000,
    includesPublicSharing: true,
    includesApiAccess: true
  }
];

describe("commercial/readiness", () => {
  it("classifica readiness comercial quando tiers e API estao definidos", () => {
    expect(buildCommercialReadinessSummary(plans)).toEqual({
      score: 100,
      hasPaidTier: true,
      hasApiTier: true,
      planCount: 3,
      publicSharingTiers: 3,
      apiAccessTiers: 1,
      recommendedTier: "professional",
      gaps: []
    });
  });

  it("lista lacunas quando o empacotamento comercial ainda esta incompleto", () => {
    const summary = buildCommercialReadinessSummary([
      {
        tier: "starter",
        monthlyPriceCents: 0,
        userLimit: 1,
        quoteLimit: 10,
        includesPublicSharing: false,
        includesApiAccess: false
      }
    ]);

    expect(summary.score).toBeLessThan(30);
    expect(summary.gaps).toEqual([
      "Definir pelo menos tres tiers comerciais.",
      "Adicionar plano pago para validar monetizacao.",
      "Associar compartilhamento publico a pelo menos um plano.",
      "Reservar acesso API para plano avancado."
    ]);
  });
});
