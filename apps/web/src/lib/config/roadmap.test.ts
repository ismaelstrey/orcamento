import { describe, expect, it } from "vitest";
import {
  buildRoadmapPhaseSummaries,
  buildRoadmapSystemSummary,
  calculateMvpProgress,
  calculateWeightedRoadmapProgress,
  getRoadmapTone,
  type RoadmapPhase
} from "./roadmap";

const fixturePhases: RoadmapPhase[] = [
  {
    id: "phase-0",
    label: "Base",
    description: "Base",
    weight: 1,
    capabilities: [
      {
        id: "a",
        label: "A",
        status: "done",
        progress: 100,
        evidence: "ok",
        nextStep: "next"
      }
    ]
  },
  {
    id: "phase-1",
    label: "MVP",
    description: "MVP",
    weight: 3,
    capabilities: [
      {
        id: "b",
        label: "B",
        status: "in_progress",
        progress: 50,
        evidence: "half",
        nextStep: "next"
      },
      {
        id: "c",
        label: "C",
        status: "planned",
        progress: 25,
        evidence: "quarter",
        nextStep: "next"
      }
    ]
  }
];

describe("config/roadmap", () => {
  it("calcula progresso ponderado por fase", () => {
    expect(calculateWeightedRoadmapProgress(fixturePhases)).toBe(54);
  });

  it("usa fases 0, 1 e 2 para leitura do MVP", () => {
    expect(calculateMvpProgress(fixturePhases)).toBe(54);
  });

  it("classifica tons por progresso", () => {
    expect(getRoadmapTone(90)).toBe("success");
    expect(getRoadmapTone(70)).toBe("warning");
    expect(getRoadmapTone(30)).toBe("muted");
    expect(getRoadmapTone(10)).toBe("danger");
  });

  it("resume fases com contagem de capacidades concluidas", () => {
    const summaries = buildRoadmapPhaseSummaries(fixturePhases);

    expect(summaries[0]).toMatchObject({
      progress: 100,
      completedCapabilities: 1,
      totalCapabilities: 1
    });
    expect(summaries[1]).toMatchObject({
      progress: 38,
      completedCapabilities: 0,
      totalCapabilities: 2
    });
  });

  it("gera resumo completo com percentuais estaveis do roadmap real", () => {
    const summary = buildRoadmapSystemSummary();

    expect(summary.overallProgress).toBeGreaterThanOrEqual(55);
    expect(summary.mvpProgress).toBeGreaterThanOrEqual(75);
    expect(summary.completedCapabilities).toBeGreaterThan(0);
    expect(summary.phaseSummaries.length).toBeGreaterThanOrEqual(6);
    expect(summary.nextRecommendedSlices.length).toBeGreaterThanOrEqual(3);
    expect(summary.releaseGates.progress).toBeGreaterThanOrEqual(65);
    expect(summary.releaseGates.totalScenarios).toBeGreaterThanOrEqual(10);
    expect(summary.smokePlan.readiness).toBeGreaterThanOrEqual(70);
    expect(summary.smokePlan.totalFlows).toBeGreaterThanOrEqual(6);
  });
});
