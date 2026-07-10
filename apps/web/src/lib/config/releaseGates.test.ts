import { describe, expect, it } from "vitest";
import {
  buildReleaseGateGroupSummaries,
  buildReleaseGateSummary,
  getReleaseGateTone,
  type ReleaseGateGroup
} from "./releaseGates";

const fixtureGroups: ReleaseGateGroup[] = [
  {
    id: "core",
    label: "Core",
    description: "Core",
    scenarios: [
      {
        id: "covered",
        label: "Covered",
        status: "covered",
        layers: ["unit"],
        evidence: "ok",
        gap: "none",
        nextStep: "next"
      },
      {
        id: "partial",
        label: "Partial",
        status: "partial",
        layers: ["service"],
        evidence: "half",
        gap: "gap",
        nextStep: "next"
      },
      {
        id: "missing",
        label: "Missing",
        status: "missing",
        layers: [],
        evidence: "none",
        gap: "gap",
        nextStep: "next"
      }
    ]
  }
];

describe("config/releaseGates", () => {
  it("classifica tom pelo progresso", () => {
    expect(getReleaseGateTone(85)).toBe("success");
    expect(getReleaseGateTone(60)).toBe("warning");
    expect(getReleaseGateTone(20)).toBe("danger");
  });

  it("resume grupos com contagens e media ponderada por status", () => {
    const [summary] = buildReleaseGateGroupSummaries(fixtureGroups);

    expect(summary).toMatchObject({
      progress: 52,
      tone: "warning",
      coveredScenarios: 1,
      partialScenarios: 1,
      missingScenarios: 1
    });
  });

  it("gera resumo geral dos gates reais sem cenarios faltantes", () => {
    const summary = buildReleaseGateSummary();

    expect(summary.progress).toBe(100);
    expect(summary.coveredScenarios).toBe(summary.totalScenarios);
    expect(summary.partialScenarios).toBe(0);
    expect(summary.missingScenarios).toBe(0);
    expect(summary.totalScenarios).toBeGreaterThanOrEqual(10);
    expect(summary.nextActions.length).toBeGreaterThanOrEqual(3);
    expect(summary.headline).toContain("Todos os gates criticos");
  });
});
