export type AiAttemptStatus = "succeeded" | "failed" | "fallback";
export type AiCostLedgerTone = "success" | "warning" | "danger";

export interface AiCostAttempt {
  id: string;
  provider: string;
  status: AiAttemptStatus;
  estimatedCostCents: number;
  durationMs: number;
  createdAt: string;
}

export interface AiCostLedgerSummary {
  tone: AiCostLedgerTone;
  score: number;
  attemptCount: number;
  totalCostCents: number;
  budgetUsagePercent: number;
  successRatePercent: number;
  fallbackCount: number;
  averageDurationMs: number;
  canUseProductionProvider: boolean;
  blockers: string[];
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getTone(score: number): AiCostLedgerTone {
  if (score >= 85) {
    return "success";
  }

  if (score >= 60) {
    return "warning";
  }

  return "danger";
}

export function buildAiCostLedgerSummary(input: {
  attempts: AiCostAttempt[];
  monthlyBudgetCents: number;
  maxAverageDurationMs: number;
  hasAuditSink: boolean;
}): AiCostLedgerSummary {
  const totalCostCents = input.attempts.reduce(
    (sum, attempt) => sum + attempt.estimatedCostCents,
    0
  );
  const budgetUsagePercent =
    input.monthlyBudgetCents > 0
      ? clampPercent((totalCostCents / input.monthlyBudgetCents) * 100)
      : 100;
  const succeeded = input.attempts.filter(
    (attempt) => attempt.status === "succeeded"
  ).length;
  const fallbackCount = input.attempts.filter(
    (attempt) => attempt.status === "fallback"
  ).length;
  const successRatePercent =
    input.attempts.length > 0
      ? clampPercent((succeeded / input.attempts.length) * 100)
      : 0;
  const averageDurationMs =
    input.attempts.length > 0
      ? Math.round(
          input.attempts.reduce((sum, attempt) => sum + attempt.durationMs, 0) /
            input.attempts.length
        )
      : 0;
  const blockers = [
    input.monthlyBudgetCents <= 0 ? "Definir budget mensal de IA." : null,
    budgetUsagePercent >= 100 ? "Budget mensal de IA foi consumido." : null,
    !input.hasAuditSink ? "Persistir auditoria de custo por tentativa." : null,
    averageDurationMs > input.maxAverageDurationMs
      ? "Latencia media excede o limite operacional."
      : null
  ].filter(Boolean) as string[];
  let score = 30;

  if (input.monthlyBudgetCents > 0 && budgetUsagePercent < 85) {
    score += 25;
  }

  if (input.hasAuditSink) {
    score += 20;
  }

  if (successRatePercent >= 80 || input.attempts.length === 0) {
    score += 15;
  }

  if (averageDurationMs <= input.maxAverageDurationMs) {
    score += 10;
  }

  const finalScore = clampPercent(score - blockers.length * 10);

  return {
    tone: getTone(finalScore),
    score: finalScore,
    attemptCount: input.attempts.length,
    totalCostCents,
    budgetUsagePercent,
    successRatePercent,
    fallbackCount,
    averageDurationMs,
    canUseProductionProvider: finalScore >= 85 && blockers.length === 0,
    blockers
  };
}
