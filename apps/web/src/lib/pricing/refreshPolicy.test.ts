import { describe, expect, it } from "vitest";
import { buildPricingRefreshPolicySummary } from "./refreshPolicy";

describe("pricing/refreshPolicy", () => {
  it("prioriza ofertas expiradas e antigas para nova coleta", () => {
    const summary = buildPricingRefreshPolicySummary({
      now: new Date("2026-07-10T12:00:00.000Z"),
      maxAgeDays: 7,
      expireWarningDays: 2,
      offers: [
        {
          id: "expired",
          productId: "prod-1",
          storeId: "store-1",
          priceCents: 300000,
          currency: "BRL",
          source: "manual",
          observedAt: "2026-07-01T10:00:00.000Z",
          expiresAt: "2026-07-09T10:00:00.000Z"
        },
        {
          id: "old",
          productId: "prod-2",
          storeId: "store-1",
          priceCents: 90000,
          currency: "BRL",
          source: "imported",
          observedAt: "2026-07-01T10:00:00.000Z"
        },
        {
          id: "fresh",
          productId: "prod-3",
          storeId: "store-2",
          priceCents: 120000,
          currency: "BRL",
          source: "manual",
          observedAt: "2026-07-10T10:00:00.000Z",
          expiresAt: "2026-07-20T10:00:00.000Z"
        }
      ]
    });

    expect(summary).toMatchObject({
      freshnessPercent: 33,
      taskCount: 2,
      highPriorityCount: 1,
      nextRunLabel: "Executar coleta/importacao agora"
    });
    expect(summary.tasks[0]).toMatchObject({
      offerId: "expired",
      priority: "high"
    });
  });

  it("mantem base como atualizada quando nao ha tarefas", () => {
    const summary = buildPricingRefreshPolicySummary({
      now: new Date("2026-07-10T12:00:00.000Z"),
      maxAgeDays: 7,
      expireWarningDays: 2,
      offers: [
        {
          id: "fresh",
          productId: "prod-1",
          storeId: "store-1",
          priceCents: 300000,
          currency: "BRL",
          source: "manual",
          observedAt: "2026-07-10T10:00:00.000Z",
          expiresAt: "2026-07-20T10:00:00.000Z"
        }
      ]
    });

    expect(summary.taskCount).toBe(0);
    expect(summary.freshnessPercent).toBe(100);
    expect(summary.nextRunLabel).toBe("Base de ofertas atualizada");
  });
});
