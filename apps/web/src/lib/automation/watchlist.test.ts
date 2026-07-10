import { describe, expect, it } from "vitest";
import { buildWatchlistSummary, type WatchlistRule } from "./watchlist";

const rules: WatchlistRule[] = [
  {
    id: "r_price",
    type: "price_drop",
    targetId: "prd_1",
    label: "Notebook Pro abaixo da base",
    thresholdPercent: 10,
    enabled: true
  },
  {
    id: "r_stock",
    type: "stock_risk",
    targetId: "prd_2",
    label: "Monitor sem estoque",
    enabled: true
  },
  {
    id: "r_follow",
    type: "quote_follow_up",
    targetId: "quo_1",
    label: "Proposta sem retorno",
    maxAgeDays: 5,
    enabled: true
  }
];

describe("automation/watchlist", () => {
  it("gera alertas por queda de preco, estoque e follow-up", () => {
    const summary = buildWatchlistSummary({
      rules,
      signals: [
        { targetId: "prd_1", currentPercent: 14 },
        { targetId: "prd_2", available: false },
        { targetId: "quo_1", ageDays: 8 }
      ]
    });

    expect(summary).toMatchObject({
      totalRules: 3,
      enabledRules: 3,
      alertCount: 3,
      highSeverityCount: 1,
      automationReadiness: 100
    });
    expect(summary.alerts.map((alert) => alert.ruleId)).toEqual([
      "r_price",
      "r_stock",
      "r_follow"
    ]);
  });

  it("ignora regras desativadas e preserva acoes futuras", () => {
    const summary = buildWatchlistSummary({
      rules: [{ ...rules[0]!, enabled: false }],
      signals: [{ targetId: "prd_1", currentPercent: 30 }]
    });

    expect(summary.alertCount).toBe(0);
    expect(summary.automationReadiness).toBe(15);
    expect(summary.nextActions).toHaveLength(3);
  });
});
