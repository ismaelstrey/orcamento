import { describe, expect, it } from "vitest";
import {
  buildDefaultProjectClosureSummary,
  buildProjectClosureSummary
} from "./projectClosure";

describe("config/projectClosure", () => {
  it("fecha o projeto quando todos os gates passam", () => {
    const summary = buildDefaultProjectClosureSummary();

    expect(summary).toMatchObject({
      tone: "success",
      score: 100,
      passedGates: 5,
      totalGates: 5,
      blockers: [],
      releaseLabel: "Projeto concluido para release operacional"
    });
  });

  it("mantem bloqueios visiveis quando um gate falha", () => {
    const summary = buildProjectClosureSummary([
      {
        id: "build",
        label: "Build",
        passed: true,
        evidence: "ok"
      },
      {
        id: "lint",
        label: "Lint",
        passed: false,
        evidence: "eslint falhou"
      }
    ]);

    expect(summary.tone).toBe("danger");
    expect(summary.score).toBe(50);
    expect(summary.blockers).toEqual(["Lint: eslint falhou"]);
  });
});
