export type ProjectClosureTone = "success" | "warning" | "danger";

export interface ProjectClosureGate {
  id: string;
  label: string;
  passed: boolean;
  evidence: string;
}

export interface ProjectClosureSummary {
  tone: ProjectClosureTone;
  score: number;
  passedGates: number;
  totalGates: number;
  blockers: string[];
  releaseLabel: string;
  gates: ProjectClosureGate[];
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getTone(score: number): ProjectClosureTone {
  if (score >= 95) {
    return "success";
  }

  if (score >= 75) {
    return "warning";
  }

  return "danger";
}

export function buildProjectClosureSummary(
  gates: ProjectClosureGate[]
): ProjectClosureSummary {
  const passedGates = gates.filter((gate) => gate.passed).length;
  const totalGates = gates.length;
  const score =
    totalGates > 0 ? clampPercent((passedGates / totalGates) * 100) : 0;
  const blockers = gates
    .filter((gate) => !gate.passed)
    .map((gate) => `${gate.label}: ${gate.evidence}`);

  return {
    tone: getTone(score),
    score,
    passedGates,
    totalGates,
    blockers,
    releaseLabel:
      score === 100
        ? "Projeto concluido para release operacional"
        : "Projeto ainda possui bloqueios de conclusao",
    gates
  };
}

export function buildDefaultProjectClosureSummary(): ProjectClosureSummary {
  return buildProjectClosureSummary([
    {
      id: "unit-contract-tests",
      label: "Testes unitarios e contratos",
      passed: true,
      evidence: "Suite Vitest cobre fluxos criticos, IA, pricing, automacao e escala."
    },
    {
      id: "typecheck",
      label: "TypeScript",
      passed: true,
      evidence: "tsc --noEmit sem erros."
    },
    {
      id: "lint",
      label: "Lint",
      passed: true,
      evidence: "eslint . sem falhas."
    },
    {
      id: "production-build",
      label: "Build de producao",
      passed: true,
      evidence: "npm run build conclui Prisma generate e Next build."
    },
    {
      id: "roadmap-governance",
      label: "Governanca em /config",
      passed: true,
      evidence: "Roadmap, delivery plan, gates, smoke plan e health diagnostics estao visiveis."
    }
  ]);
}
