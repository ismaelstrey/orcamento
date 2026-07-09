import { describe, expect, it } from "vitest";
import {
  buildSmokePlanSummary,
  type SmokePlanFlow,
  type SmokePlanStatus
} from "./smokePlan";

const flow = (status: SmokePlanStatus): SmokePlanFlow => ({
  id: status,
  label: status,
  priority: "p0",
  status,
  route: "/",
  objective: "Objective",
  automationTarget: "Target",
  steps: [
    {
      label: "Step",
      expected: "Expected"
    }
  ]
});

describe("config/smokePlan", () => {
  it("calcula prontidao media por status", () => {
    const summary = buildSmokePlanSummary([
      flow("ready"),
      flow("needs_data"),
      flow("needs_tooling")
    ]);

    expect(summary.readiness).toBe(65);
    expect(summary.readyFlows).toBe(1);
    expect(summary.needsDataFlows).toBe(1);
    expect(summary.needsToolingFlows).toBe(1);
  });

  it("mantem plano real com fluxos P0 e criterios de aceite", () => {
    const summary = buildSmokePlanSummary();

    expect(summary.readiness).toBeGreaterThanOrEqual(70);
    expect(summary.totalFlows).toBeGreaterThanOrEqual(6);
    expect(summary.flows.some((flowItem) => flowItem.priority === "p0")).toBe(true);
    expect(
      summary.flows.every(
        (flowItem) =>
          flowItem.route.length > 0 &&
          flowItem.objective.length > 0 &&
          flowItem.steps.length >= 3
      )
    ).toBe(true);
  });
});
