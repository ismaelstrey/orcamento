import { describe, expect, it } from "vitest";
import { buildPhase1CompletionSummary } from "./phase1Completion";
import { buildRoadmapSystemSummary } from "./roadmap";

describe("config/phase1Completion", () => {
  it("marca a fase 1 como concluida quando o MVP operacional fecha criterios", () => {
    const roadmap = buildRoadmapSystemSummary();
    const summary = buildPhase1CompletionSummary(roadmap);

    expect(summary.phaseId).toBe("phase-1");
    expect(summary.progress).toBe(100);
    expect(summary.isComplete).toBe(true);
    expect(summary.headline).toContain("Fase 1 concluida");
    expect(summary.criteria.every((criterion) => criterion.status === "done")).toBe(
      true
    );
  });

  it("sinaliza atencao quando a fase 1 nao esta completamente fechada", () => {
    const roadmap = buildRoadmapSystemSummary();
    const partialRoadmap = {
      ...roadmap,
      phaseSummaries: roadmap.phaseSummaries.map((phase) =>
        phase.id === "phase-1"
          ? {
              ...phase,
              progress: 95,
              capabilities: phase.capabilities.map((capability, index) =>
                index === 0
                  ? {
                      ...capability,
                      progress: 96
                    }
                  : capability
              )
            }
          : phase
      )
    };

    const summary = buildPhase1CompletionSummary(partialRoadmap);

    expect(summary.isComplete).toBe(false);
    expect(summary.criteria.some((criterion) => criterion.status === "attention"))
      .toBe(true);
  });
});
