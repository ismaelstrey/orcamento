import { describe, expect, it } from "vitest";
import { buildAiCostLedgerSummary } from "./costLedger";

describe("ai/costLedger", () => {
  it("libera provider de producao quando custo, auditoria e latencia estao seguros", () => {
    const summary = buildAiCostLedgerSummary({
      monthlyBudgetCents: 100000,
      maxAverageDurationMs: 5000,
      hasAuditSink: true,
      attempts: [
        {
          id: "att-1",
          provider: "external",
          status: "succeeded",
          estimatedCostCents: 1200,
          durationMs: 1300,
          createdAt: "2026-07-10T10:00:00.000Z"
        },
        {
          id: "att-2",
          provider: "external",
          status: "succeeded",
          estimatedCostCents: 900,
          durationMs: 1700,
          createdAt: "2026-07-10T11:00:00.000Z"
        }
      ]
    });

    expect(summary).toMatchObject({
      tone: "success",
      score: 100,
      attemptCount: 2,
      totalCostCents: 2100,
      budgetUsagePercent: 2,
      successRatePercent: 100,
      averageDurationMs: 1500,
      canUseProductionProvider: true,
      blockers: []
    });
  });

  it("bloqueia provider sem budget ou auditoria", () => {
    const summary = buildAiCostLedgerSummary({
      monthlyBudgetCents: 0,
      maxAverageDurationMs: 1000,
      hasAuditSink: false,
      attempts: [
        {
          id: "att-1",
          provider: "external",
          status: "failed",
          estimatedCostCents: 100,
          durationMs: 5000,
          createdAt: "2026-07-10T10:00:00.000Z"
        }
      ]
    });

    expect(summary.canUseProductionProvider).toBe(false);
    expect(summary.tone).toBe("danger");
    expect(summary.blockers).toEqual([
      "Definir budget mensal de IA.",
      "Budget mensal de IA foi consumido.",
      "Persistir auditoria de custo por tentativa.",
      "Latencia media excede o limite operacional."
    ]);
  });
});
