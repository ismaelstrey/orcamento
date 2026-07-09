import { describe, expect, it } from "vitest";
import { buildDeliveryPlanSummary } from "./deliveryPlan";
import { buildRoadmapSystemSummary } from "./roadmap";

describe("config/deliveryPlan", () => {
  it("gera fila de entrega com slices imediatos e concluidos", () => {
    const deliveryPlan = buildDeliveryPlanSummary(buildRoadmapSystemSummary());

    expect(deliveryPlan.completedThisCycle.length).toBeGreaterThanOrEqual(2);
    expect(deliveryPlan.nextSlices.length).toBeGreaterThanOrEqual(2);
    expect(deliveryPlan.queuedSlices.length).toBeGreaterThanOrEqual(1);
    expect(deliveryPlan.expectedProgressLift).toBeGreaterThan(0);
    expect(deliveryPlan.completedProgressLift).toBeGreaterThan(0);
    expect(deliveryPlan.projectedMvpProgress).toBeGreaterThanOrEqual(
      buildRoadmapSystemSummary().mvpProgress
    );
    expect(deliveryPlan.projectedOverallProgress).toBeGreaterThanOrEqual(
      buildRoadmapSystemSummary().overallProgress
    );
    expect(deliveryPlan.runwayBatches.length).toBeGreaterThanOrEqual(2);
    expect(deliveryPlan.cycleLabel).toContain("MVP");
  });

  it("prioriza slices p0 como proximos passos", () => {
    const deliveryPlan = buildDeliveryPlanSummary({
      mvpProgress: 80,
      overallProgress: 60,
      nextRecommendedSlices: []
    });

    expect(deliveryPlan.nextSlices.every((slice) => slice.priority === "p0")).toBe(
      true
    );
    expect(deliveryPlan.immediateSlices).toBe(deliveryPlan.nextSlices.length);
    expect(deliveryPlan.runwayBatches[0]).toMatchObject({
      label: "Agora",
      expectedProgressLift: deliveryPlan.expectedProgressLift
    });
  });
});
