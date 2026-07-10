import { describe, expect, it } from "vitest";
import type { DeliveryPlanSummary } from "./deliveryPlan";
import { buildDeliveryPlanSummary } from "./deliveryPlan";
import type { RoadmapSystemSummary } from "./roadmap";
import { buildRoadmapSystemSummary } from "./roadmap";
import { buildReleaseReadinessSummary } from "./releaseReadiness";

function buildFixture(): {
  roadmap: RoadmapSystemSummary;
  deliveryPlan: DeliveryPlanSummary;
} {
  const roadmap = buildRoadmapSystemSummary();
  const deliveryPlan = buildDeliveryPlanSummary(roadmap);

  return {
    roadmap,
    deliveryPlan
  };
}

describe("config/releaseReadiness", () => {
  it("gera leitura operacional de release a partir do roadmap real", () => {
    const { roadmap, deliveryPlan } = buildFixture();
    const readiness = buildReleaseReadinessSummary({ roadmap, deliveryPlan });

    expect(readiness.score).toBe(100);
    expect(readiness.signals.length).toBeGreaterThanOrEqual(5);
    expect(readiness.checklist.length).toBeGreaterThanOrEqual(6);
    expect(readiness.recommendedExecutionOrder.length).toBeGreaterThan(0);
    expect(readiness.headline.length).toBeGreaterThan(0);
  });

  it("mantem hardening de E2E como sinal saudavel pos-release", () => {
    const { roadmap, deliveryPlan } = buildFixture();
    const readiness = buildReleaseReadinessSummary({ roadmap, deliveryPlan });

    expect(readiness.canShipMvp).toBe(true);
    expect(readiness.blockers).toEqual([]);
    expect(readiness.signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "e2e-tooling",
          status: "healthy",
          score: 100,
          nextStep: "Playwright pode ser adicionado como automacao pos-release."
        })
      ])
    );
  });

  it("fecha o score de release controlado em 100 quando a fase 1 esta assinada", () => {
    const { roadmap, deliveryPlan } = buildFixture();
    const readiness = buildReleaseReadinessSummary({ roadmap, deliveryPlan });

    expect(readiness.score).toBe(100);
    expect(readiness.tone).toBe("success");
    expect(readiness.canShipMvp).toBe(true);
    expect(readiness.headline).toContain("release controlado");
    expect(readiness.signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "product-depth",
          label: "Profundidade operacional",
          score: expect.any(Number)
        })
      ])
    );
  });

  it("prioriza slices P0 de maior impacto na ordem recomendada", () => {
    const { roadmap, deliveryPlan } = buildFixture();
    const readiness = buildReleaseReadinessSummary({ roadmap, deliveryPlan });
    const [firstSlice] = readiness.recommendedExecutionOrder;

    expect(firstSlice).toBeDefined();
    if (!firstSlice) {
      throw new Error("Expected at least one recommended slice.");
    }

    expect(firstSlice.priority).toBe("p0");
    expect(firstSlice.impact).toBe("high");
  });

  it("marca checklist basico como pronto quando thresholds estao atendidos", () => {
    const { roadmap, deliveryPlan } = buildFixture();
    const readiness = buildReleaseReadinessSummary({ roadmap, deliveryPlan });

    expect(readiness.checklist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "mvp-progress",
          done: true
        }),
        expect.objectContaining({
          id: "smoke-above-threshold",
          done: true
        }),
        expect.objectContaining({
          id: "next-batch-defined",
          done: true
        })
      ])
    );
  });

  it("fica apto a release controlado quando sinais e checklist estao fortes", () => {
    const { roadmap, deliveryPlan } = buildFixture();
    const readyRoadmap: RoadmapSystemSummary = {
      ...roadmap,
      mvpProgress: 92,
      overallProgress: 78,
      releaseGates: {
        ...roadmap.releaseGates,
        progress: 92,
        missingScenarios: 0,
        partialScenarios: 0,
        coveredScenarios: roadmap.releaseGates.totalScenarios,
        groups: roadmap.releaseGates.groups.map((group) => ({
          ...group,
          progress: 95,
          tone: "success",
          coveredScenarios: group.scenarios.length,
          partialScenarios: 0,
          missingScenarios: 0
        }))
      },
      smokePlan: {
        ...roadmap.smokePlan,
        readiness: 96,
        readyFlows: roadmap.smokePlan.totalFlows,
        needsDataFlows: 0,
        needsToolingFlows: 0
      },
      phaseSummaries: roadmap.phaseSummaries.map((phase) => ({
        ...phase,
        progress: Math.max(phase.progress, 70)
      }))
    };
    const readyDeliveryPlan: DeliveryPlanSummary = {
      ...deliveryPlan,
      projectedMvpProgress: 96
    };

    const readiness = buildReleaseReadinessSummary({
      roadmap: readyRoadmap,
      deliveryPlan: readyDeliveryPlan
    });

    expect(readiness.canShipMvp).toBe(true);
    expect(readiness.score).toBeGreaterThanOrEqual(85);
    expect(readiness.blockers.every((blocker) => blocker.severity !== "critical")).toBe(
      true
    );
  });
});
