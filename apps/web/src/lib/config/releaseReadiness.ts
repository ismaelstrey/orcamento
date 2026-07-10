import type { DeliveryPlanSummary, DeliverySlice } from "./deliveryPlan";
import type { ReleaseGateSummary } from "./releaseGates";
import type { RoadmapPhaseSummary, RoadmapSystemSummary } from "./roadmap";
import type { SmokePlanSummary } from "./smokePlan";

export type ReleaseReadinessTone = "success" | "warning" | "danger";
export type ReleaseReadinessBlockerSeverity = "critical" | "high" | "medium";
export type ReleaseReadinessSignalStatus = "healthy" | "attention" | "blocked";

export interface ReleaseReadinessSignal {
  id: string;
  label: string;
  status: ReleaseReadinessSignalStatus;
  score: number;
  evidence: string;
  nextStep: string;
}

export interface ReleaseReadinessBlocker {
  id: string;
  label: string;
  severity: ReleaseReadinessBlockerSeverity;
  area: string;
  impact: string;
  resolution: string;
}

export interface ReleaseReadinessChecklistItem {
  id: string;
  label: string;
  done: boolean;
  ownerArea: string;
  evidence: string;
}

export interface ReleaseReadinessSummary {
  score: number;
  tone: ReleaseReadinessTone;
  headline: string;
  canShipMvp: boolean;
  signals: ReleaseReadinessSignal[];
  blockers: ReleaseReadinessBlocker[];
  checklist: ReleaseReadinessChecklistItem[];
  nextMilestone: string;
  recommendedExecutionOrder: DeliverySlice[];
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getTone(score: number): ReleaseReadinessTone {
  if (score >= 85) {
    return "success";
  }

  if (score >= 65) {
    return "warning";
  }

  return "danger";
}

function getSignalStatus(score: number): ReleaseReadinessSignalStatus {
  if (score >= 85) {
    return "healthy";
  }

  if (score >= 60) {
    return "attention";
  }

  return "blocked";
}

function scoreBoolean(value: boolean): number {
  return value ? 100 : 0;
}

function countDone(items: ReleaseReadinessChecklistItem[]): number {
  return items.filter((item) => item.done).length;
}

function buildSignals(input: {
  roadmap: RoadmapSystemSummary;
  deliveryPlan: DeliveryPlanSummary;
}): ReleaseReadinessSignal[] {
  const { roadmap, deliveryPlan } = input;
  const e2eToolingScore =
    roadmap.smokePlan.needsToolingFlows === 0
      ? 100
      : clampScore(100 - roadmap.smokePlan.needsToolingFlows * 25);
  const gateScore = roadmap.releaseGates.progress;
  const smokeScore = roadmap.smokePlan.readiness;
  const deliveryScore = clampScore(
    roadmap.mvpProgress + deliveryPlan.completedProgressLift * 0.35
  );
  const productScore = roadmap.overallProgress;

  return [
    {
      id: "mvp-scope",
      label: "Escopo MVP",
      status: getSignalStatus(deliveryScore),
      score: deliveryScore,
      evidence: `MVP em ${roadmap.mvpProgress}% com ${deliveryPlan.completedThisCycle.length} slices recentes concluidos.`,
      nextStep:
        "Fechar os slices P0 antes de abrir novas frentes grandes de IA ou pricing."
    },
    {
      id: "release-gates",
      label: "Gates de release",
      status: getSignalStatus(gateScore),
      score: gateScore,
      evidence: `${roadmap.releaseGates.coveredScenarios}/${roadmap.releaseGates.totalScenarios} cenarios possuem cobertura inicial.`,
      nextStep:
        "Promover os cenarios parciais para testes E2E e integracao com banco."
    },
    {
      id: "smoke-readiness",
      label: "Smoke plan",
      status: getSignalStatus(smokeScore),
      score: smokeScore,
      evidence: `${roadmap.smokePlan.readyFlows}/${roadmap.smokePlan.totalFlows} fluxos estao prontos para automacao.`,
      nextStep:
        "Adicionar fixtures para links publicos e conectar a ferramenta E2E."
    },
    {
      id: "e2e-tooling",
      label: "Ferramenta E2E",
      status: getSignalStatus(e2eToolingScore),
      score: e2eToolingScore,
      evidence:
        roadmap.smokePlan.needsToolingFlows === 0
          ? "Nenhum fluxo depende de ferramenta pendente."
          : `${roadmap.smokePlan.needsToolingFlows} fluxo(s) ainda dependem de ferramenta E2E.`,
      nextStep: "Instalar Playwright e registrar storage state autenticado."
    },
    {
      id: "product-depth",
      label: "Produto completo",
      status: getSignalStatus(productScore),
      score: productScore,
      evidence: `Produto completo em ${roadmap.overallProgress}%, ainda puxado por IA produtiva, pricing e automacao.`,
      nextStep:
        "Manter o foco no MVP antes de tratar billing, API externa e automacoes futuras."
    }
  ];
}

function buildChecklist(input: {
  roadmap: RoadmapSystemSummary;
  deliveryPlan: DeliveryPlanSummary;
}): ReleaseReadinessChecklistItem[] {
  const { roadmap, deliveryPlan } = input;
  const publicDeliveryGate = roadmap.releaseGates.groups
    .find((group) => group.id === "public-delivery")
    ?.progress ?? 0;

  return [
    {
      id: "mvp-progress",
      label: "MVP acima de 80%",
      done: roadmap.mvpProgress >= 80,
      ownerArea: "Produto",
      evidence: `MVP atual: ${roadmap.mvpProgress}%.`
    },
    {
      id: "no-missing-gates",
      label: "Sem gates criticos pendentes",
      done: roadmap.releaseGates.missingScenarios === 0,
      ownerArea: "Qualidade",
      evidence: `${roadmap.releaseGates.missingScenarios} gate(s) sem cobertura inicial.`
    },
    {
      id: "smoke-above-threshold",
      label: "Smoke plan acima de 70%",
      done: roadmap.smokePlan.readiness >= 70,
      ownerArea: "Qualidade",
      evidence: `Prontidao atual: ${roadmap.smokePlan.readiness}%.`
    },
    {
      id: "public-delivery-covered",
      label: "Entrega publica protegida",
      done: publicDeliveryGate >= 75,
      ownerArea: "Entrega publica",
      evidence: `Gate publico em ${publicDeliveryGate}%.`
    },
    {
      id: "next-batch-defined",
      label: "Proximo lote priorizado",
      done: deliveryPlan.nextSlices.length > 0,
      ownerArea: "Gestao",
      evidence: `${deliveryPlan.nextSlices.length} slice(s) no lote imediato.`
    },
    {
      id: "projection-visible",
      label: "Projecao de progresso visivel",
      done: deliveryPlan.projectedMvpProgress > roadmap.mvpProgress,
      ownerArea: "Governanca",
      evidence: `MVP projetado em ${deliveryPlan.projectedMvpProgress}%.`
    }
  ];
}

function buildBlockers(input: {
  roadmap: RoadmapSystemSummary;
  deliveryPlan: DeliveryPlanSummary;
  checklist: ReleaseReadinessChecklistItem[];
}): ReleaseReadinessBlocker[] {
  const { roadmap, deliveryPlan, checklist } = input;
  const blockers: ReleaseReadinessBlocker[] = [];

  if (roadmap.smokePlan.needsToolingFlows > 0) {
    blockers.push({
      id: "e2e-tooling",
      label: "E2E ainda nao automatizado",
      severity: "critical",
      area: "Qualidade",
      impact:
        "Fluxos de login, orcamento e link publico ainda dependem de validacao manual.",
      resolution: "Instalar Playwright e executar o fluxo P0 autenticado e publico."
    });
  }

  if (roadmap.smokePlan.needsDataFlows > 0) {
    blockers.push({
      id: "public-fixtures",
      label: "Fixtures publicas incompletas",
      severity: "high",
      area: "Entrega publica",
      impact:
        "Links ativos, expirados e revogados ainda nao estao protegidos por cenario automatizado com dados reais.",
      resolution:
        "Criar fixture de quote com versao congelada e tres estados de share link."
    });
  }

  if (roadmap.releaseGates.partialScenarios > 0) {
    blockers.push({
      id: "partial-gates",
      label: "Gates parciais antes do MVP publico",
      severity: "high",
      area: "Release",
      impact: `${roadmap.releaseGates.partialScenarios} cenario(s) ainda nao cobrem o fluxo completo.`,
      resolution:
        "Priorizar gates de criacao manual, versionamento, PDF e dashboard com integracao."
    });
  }

  if (deliveryPlan.nextSlices.length === 0) {
    blockers.push({
      id: "empty-next-batch",
      label: "Sem lote imediato definido",
      severity: "medium",
      area: "Gestao",
      impact: "A evolucao fica sem sequencia operacional clara para o proximo ciclo.",
      resolution: "Escolher o maior risco aberto no roadmap e promover para P0."
    });
  }

  const undoneChecklist = checklist.filter((item) => !item.done);

  if (undoneChecklist.length > 0 && blockers.length === 0) {
    blockers.push({
      id: "checklist-open",
      label: "Checklist de release ainda incompleto",
      severity: "medium",
      area: "Governanca",
      impact: `${undoneChecklist.length} item(ns) ainda precisam fechar antes do release.`,
      resolution: "Fechar os itens pendentes do checklist ou registrar uma excecao."
    });
  }

  return blockers;
}

function sortExecutionOrder(slices: DeliverySlice[]): DeliverySlice[] {
  const priorityWeight: Record<DeliverySlice["priority"], number> = {
    p0: 3,
    p1: 2,
    p2: 1
  };
  const impactWeight: Record<DeliverySlice["impact"], number> = {
    high: 3,
    medium: 2,
    low: 1
  };
  const effortWeight: Record<DeliverySlice["effort"], number> = {
    s: 3,
    m: 2,
    l: 1
  };

  return [...slices].sort((left, right) => {
    const leftScore =
      priorityWeight[left.priority] * 100 +
      impactWeight[left.impact] * 20 +
      effortWeight[left.effort] * 10 +
      left.progressLift;
    const rightScore =
      priorityWeight[right.priority] * 100 +
      impactWeight[right.impact] * 20 +
      effortWeight[right.effort] * 10 +
      right.progressLift;

    return rightScore - leftScore;
  });
}

function findWeakestPhase(phases: RoadmapPhaseSummary[]): RoadmapPhaseSummary | null {
  if (phases.length === 0) {
    return null;
  }

  return [...phases].sort((left, right) => left.progress - right.progress)[0] ?? null;
}

export function buildReleaseReadinessSummary(input: {
  roadmap: RoadmapSystemSummary;
  deliveryPlan: DeliveryPlanSummary;
}): ReleaseReadinessSummary {
  const { roadmap, deliveryPlan } = input;
  const signals = buildSignals(input);
  const checklist = buildChecklist(input);
  const blockers = buildBlockers({ roadmap, deliveryPlan, checklist });
  const checklistScore = clampScore((countDone(checklist) / checklist.length) * 100);
  const signalScore = clampScore(
    signals.reduce((sum, signal) => sum + signal.score, 0) / signals.length
  );
  const blockerPenalty = blockers.reduce((sum, blocker) => {
    if (blocker.severity === "critical") {
      return sum + 12;
    }

    if (blocker.severity === "high") {
      return sum + 7;
    }

    return sum + 4;
  }, 0);
  const score = clampScore(signalScore * 0.7 + checklistScore * 0.3 - blockerPenalty);
  const tone = getTone(score);
  const weakestPhase = findWeakestPhase(roadmap.phaseSummaries);
  const canShipMvp =
    score >= 85 &&
    blockers.every((blocker) => blocker.severity !== "critical") &&
    roadmap.releaseGates.missingScenarios === 0;

  return {
    score,
    tone,
    canShipMvp,
    signals,
    blockers,
    checklist,
    headline: canShipMvp
      ? "MVP pronto para release controlado com monitoramento ativo."
      : "MVP ainda precisa fechar E2E, fixtures publicas e gates parciais antes de release mais amplo.",
    nextMilestone: weakestPhase
      ? `Elevar ${weakestPhase.label} de ${weakestPhase.progress}% para pelo menos ${Math.min(
          weakestPhase.progress + 10,
          100
        )}%.`
      : "Manter roadmap atualizado a cada ciclo.",
    recommendedExecutionOrder: sortExecutionOrder([
      ...deliveryPlan.nextSlices,
      ...deliveryPlan.queuedSlices
    ]).slice(0, 5)
  };
}
