import { describe, expect, it } from "vitest";
import { buildAutomationPersistenceSummary } from "./persistence";

describe("automation/persistence", () => {
  it("libera workers quando regras e execucoes persistidas estao coerentes", () => {
    const summary = buildAutomationPersistenceSummary({
      hasWorkerSecret: true,
      rules: [
        {
          id: "rule-1",
          type: "price_drop",
          targetId: "prod-1",
          enabled: true
        }
      ],
      runs: [
        {
          id: "run-1",
          ruleId: "rule-1",
          status: "succeeded",
          startedAt: "2026-07-10T10:00:00.000Z",
          finishedAt: "2026-07-10T10:00:01.000Z"
        }
      ]
    });

    expect(summary).toMatchObject({
      tone: "success",
      score: 100,
      ruleCount: 1,
      enabledRuleCount: 1,
      runCount: 1,
      successRatePercent: 100,
      canRunWorkers: true,
      blockers: []
    });
  });

  it("bloqueia workers quando faltam regras ativas e segredo", () => {
    const summary = buildAutomationPersistenceSummary({
      hasWorkerSecret: false,
      rules: [],
      runs: [
        {
          id: "run-1",
          ruleId: "missing",
          status: "failed",
          startedAt: "2026-07-10T10:00:00.000Z",
          errorMessage: "rule not found"
        }
      ]
    });

    expect(summary.canRunWorkers).toBe(false);
    expect(summary.tone).toBe("danger");
    expect(summary.blockers).toEqual([
      "Persistir pelo menos uma regra de watchlist.",
      "Ativar ao menos uma regra para workers.",
      "Configurar segredo de worker.",
      "Existem execucoes vinculadas a regras inexistentes."
    ]);
  });
});
