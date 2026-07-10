import { describe, expect, it } from "vitest";
import { buildCommercialGovernanceSummary } from "./governance";

const plans = [
  {
    id: "starter",
    tier: "starter" as const,
    code: "starter",
    monthlyPriceCents: 0,
    includesApiAccess: false
  },
  {
    id: "pro",
    tier: "professional" as const,
    code: "professional",
    monthlyPriceCents: 9900,
    includesApiAccess: false
  },
  {
    id: "enterprise",
    tier: "enterprise" as const,
    code: "enterprise",
    monthlyPriceCents: 39900,
    includesApiAccess: true
  }
];

describe("commercial/governance", () => {
  it("libera operacao comercial quando planos, assinatura, API e webhook existem", () => {
    const summary = buildCommercialGovernanceSummary({
      now: new Date("2026-07-10T12:00:00.000Z"),
      plans,
      subscriptions: [
        {
          id: "sub-1",
          planId: "enterprise",
          status: "active",
          currentPeriodEnd: "2026-08-10T12:00:00.000Z"
        }
      ],
      apiKeys: [
        {
          id: "key-1",
          name: "Integracao ERP",
          status: "active"
        }
      ],
      webhookEndpoints: [
        {
          id: "wh-1",
          isActive: true,
          events: ["quote.created"],
          hasSigningSecretHash: true
        }
      ]
    });

    expect(summary).toMatchObject({
      tone: "success",
      score: 100,
      planCount: 3,
      activeSubscriptionCount: 1,
      activeApiKeyCount: 1,
      activeWebhookCount: 1,
      canOperateCommercially: true,
      blockers: []
    });
  });

  it("bloqueia escala comercial sem assinatura ativa e API configurada", () => {
    const summary = buildCommercialGovernanceSummary({
      now: new Date("2026-07-10T12:00:00.000Z"),
      plans,
      subscriptions: [
        {
          id: "sub-1",
          planId: "missing",
          status: "active",
          currentPeriodEnd: "2026-08-10T12:00:00.000Z"
        }
      ],
      apiKeys: [],
      webhookEndpoints: []
    });

    expect(summary.canOperateCommercially).toBe(false);
    expect(summary.tone).toBe("danger");
    expect(summary.blockers).toEqual([
      "Persistir assinatura ativa do tenant.",
      "Criar chave API ativa para plano com acesso externo.",
      "Configurar webhook ativo com segredo e eventos.",
      "Existe assinatura apontando para plano inexistente."
    ]);
  });
});
