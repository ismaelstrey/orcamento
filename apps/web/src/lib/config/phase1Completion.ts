import type { RoadmapPhaseSummary, RoadmapSystemSummary } from "./roadmap";

export type Phase1CriterionStatus = "done" | "attention";

export interface Phase1CompletionCriterion {
  id: string;
  label: string;
  status: Phase1CriterionStatus;
  evidence: string;
}

export interface Phase1CompletionSummary {
  phaseId: string;
  phaseLabel: string;
  progress: number;
  isComplete: boolean;
  headline: string;
  criteria: Phase1CompletionCriterion[];
  nextQualityFocus: string[];
}

function findPhase1(
  roadmap: Pick<RoadmapSystemSummary, "phaseSummaries">
): RoadmapPhaseSummary | null {
  return (
    roadmap.phaseSummaries.find((phase) => phase.id === "phase-1") ?? null
  );
}

function getCriterionStatus(done: boolean): Phase1CriterionStatus {
  return done ? "done" : "attention";
}

export function buildPhase1CompletionSummary(
  roadmap: RoadmapSystemSummary
): Phase1CompletionSummary {
  const phase = findPhase1(roadmap);
  const progress = phase?.progress ?? 0;
  const allCapabilitiesDone = Boolean(
    phase &&
      phase.capabilities.length > 0 &&
      phase.capabilities.every(
        (capability) =>
          capability.status === "done" && capability.progress === 100
      )
  );
  const hasNoMissingReleaseGate = roadmap.releaseGates.missingScenarios === 0;
  const hasSmokePlan = roadmap.smokePlan.totalFlows >= 6;
  const hasPublicDeliverySignal = roadmap.releaseGates.groups.some(
    (group) => group.id === "public-delivery" && group.progress >= 75
  );
  const isComplete =
    progress === 100 &&
    allCapabilitiesDone &&
    hasNoMissingReleaseGate &&
    hasSmokePlan &&
    hasPublicDeliverySignal;

  return {
    phaseId: phase?.id ?? "phase-1",
    phaseLabel: phase?.label ?? "Fase 1 - MVP operacional",
    progress,
    isComplete,
    headline: isComplete
      ? "Fase 1 concluida: o ciclo operacional do MVP esta fechado e rastreavel."
      : "Fase 1 ainda precisa fechar criterios operacionais antes de ser marcada como concluida.",
    criteria: [
      {
        id: "capabilities",
        label: "Capacidades do MVP fechadas",
        status: getCriterionStatus(allCapabilitiesDone),
        evidence: phase
          ? `${phase.completedCapabilities}/${phase.totalCapabilities} capacidades concluidas com progresso ${phase.progress}%.`
          : "Fase 1 nao encontrada no roadmap."
      },
      {
        id: "release-gates",
        label: "Sem gate critico ausente",
        status: getCriterionStatus(hasNoMissingReleaseGate),
        evidence: `${roadmap.releaseGates.missingScenarios} gate(s) sem cobertura inicial.`
      },
      {
        id: "smoke-plan",
        label: "Smoke plan do MVP mapeado",
        status: getCriterionStatus(hasSmokePlan),
        evidence: `${roadmap.smokePlan.totalFlows} fluxo(s) critico(s) documentado(s).`
      },
      {
        id: "public-delivery",
        label: "Entrega publica dentro do MVP",
        status: getCriterionStatus(hasPublicDeliverySignal),
        evidence: hasPublicDeliverySignal
          ? "PDF, preview e link publico possuem sinais de cobertura no gate publico."
          : "Gate publico ainda abaixo do minimo operacional."
      }
    ],
    nextQualityFocus: [
      "Automatizar E2E dos fluxos P0 na Fase 2.",
      "Conectar fixtures reais de banco ao smoke plan.",
      "Continuar evolucao de IA, pricing e automacao fora do escopo da Fase 1."
    ]
  };
}
