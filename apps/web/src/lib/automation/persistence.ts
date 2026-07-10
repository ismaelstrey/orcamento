import type { WatchlistRuleType } from "./watchlist";

export type PersistedAutomationRunStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed";
export type AutomationPersistenceTone = "success" | "warning" | "danger";

export interface PersistedWatchlistRuleInput {
  id: string;
  type: WatchlistRuleType;
  targetId: string;
  enabled: boolean;
}

export interface PersistedAutomationRunInput {
  id: string;
  ruleId: string | null;
  status: PersistedAutomationRunStatus;
  startedAt: string;
  finishedAt?: string | null;
  errorMessage?: string | null;
}

export interface AutomationPersistenceSummary {
  tone: AutomationPersistenceTone;
  score: number;
  ruleCount: number;
  enabledRuleCount: number;
  runCount: number;
  successRatePercent: number;
  orphanRunCount: number;
  failedRunCount: number;
  canRunWorkers: boolean;
  blockers: string[];
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getTone(score: number): AutomationPersistenceTone {
  if (score >= 85) {
    return "success";
  }

  if (score >= 60) {
    return "warning";
  }

  return "danger";
}

export function buildAutomationPersistenceSummary(input: {
  rules: PersistedWatchlistRuleInput[];
  runs: PersistedAutomationRunInput[];
  hasWorkerSecret: boolean;
}): AutomationPersistenceSummary {
  const ruleIds = new Set(input.rules.map((rule) => rule.id));
  const enabledRuleCount = input.rules.filter((rule) => rule.enabled).length;
  const succeededRuns = input.runs.filter((run) => run.status === "succeeded").length;
  const failedRunCount = input.runs.filter((run) => run.status === "failed").length;
  const orphanRunCount = input.runs.filter(
    (run) => run.ruleId && !ruleIds.has(run.ruleId)
  ).length;
  const successRatePercent =
    input.runs.length > 0
      ? clampPercent((succeededRuns / input.runs.length) * 100)
      : 100;
  const blockers = [
    input.rules.length === 0 ? "Persistir pelo menos uma regra de watchlist." : null,
    enabledRuleCount === 0 ? "Ativar ao menos uma regra para workers." : null,
    !input.hasWorkerSecret ? "Configurar segredo de worker." : null,
    orphanRunCount > 0 ? "Existem execucoes vinculadas a regras inexistentes." : null
  ].filter(Boolean) as string[];
  let score = 25;

  if (input.rules.length > 0 && enabledRuleCount > 0) {
    score += 25;
  }

  if (input.hasWorkerSecret) {
    score += 25;
  }

  if (successRatePercent >= 80) {
    score += 15;
  }

  if (orphanRunCount === 0) {
    score += 10;
  }

  const finalScore = clampPercent(score - blockers.length * 10 - failedRunCount * 3);

  return {
    tone: getTone(finalScore),
    score: finalScore,
    ruleCount: input.rules.length,
    enabledRuleCount,
    runCount: input.runs.length,
    successRatePercent,
    orphanRunCount,
    failedRunCount,
    canRunWorkers: finalScore >= 85 && blockers.length === 0,
    blockers
  };
}
