export type AiProviderMode = "local" | "external";
export type AiProviderReadinessTone = "success" | "warning" | "danger";

export interface AiProviderGuardrailInput {
  mode: AiProviderMode;
  hasApiKey: boolean;
  monthlyBudgetCents: number;
  usedBudgetCents: number;
  maxLatencyMs: number;
  lastLatencyMs: number | null;
  fallbackEnabled: boolean;
  auditEnabled: boolean;
}

export interface AiProviderGuardrailSummary {
  score: number;
  tone: AiProviderReadinessTone;
  label: string;
  budgetUsagePercent: number;
  canUseExternalProvider: boolean;
  canFallbackSafely: boolean;
  blockers: string[];
  recommendations: string[];
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getTone(score: number): AiProviderReadinessTone {
  if (score >= 85) {
    return "success";
  }

  if (score >= 60) {
    return "warning";
  }

  return "danger";
}

export function buildAiProviderGuardrailSummary(
  input: AiProviderGuardrailInput
): AiProviderGuardrailSummary {
  const budgetUsagePercent =
    input.monthlyBudgetCents > 0
      ? clampPercent((input.usedBudgetCents / input.monthlyBudgetCents) * 100)
      : 100;
  const latencyHealthy =
    input.lastLatencyMs === null || input.lastLatencyMs <= input.maxLatencyMs;
  const canUseExternalProvider =
    input.mode === "external" &&
    input.hasApiKey &&
    input.monthlyBudgetCents > 0 &&
    budgetUsagePercent < 100 &&
    input.auditEnabled;
  const canFallbackSafely = input.fallbackEnabled && input.mode === "external";
  const blockers = [
    !input.hasApiKey && input.mode === "external"
      ? "Chave do provider externo ainda nao configurada."
      : null,
    input.monthlyBudgetCents <= 0
      ? "Orcamento mensal de IA precisa ser definido."
      : null,
    budgetUsagePercent >= 100 ? "Orcamento mensal de IA foi consumido." : null,
    !input.auditEnabled ? "Auditoria de custo e latencia precisa estar ativa." : null,
    !latencyHealthy ? "Ultima latencia excedeu o limite operacional." : null,
    !input.fallbackEnabled ? "Fallback local precisa permanecer disponivel." : null
  ].filter(Boolean) as string[];
  let score = 35;

  if (input.mode === "external") {
    score += 15;
  }

  if (input.hasApiKey) {
    score += 15;
  }

  if (input.monthlyBudgetCents > 0 && budgetUsagePercent < 90) {
    score += 15;
  }

  if (input.auditEnabled) {
    score += 10;
  }

  if (latencyHealthy) {
    score += 5;
  }

  if (input.fallbackEnabled) {
    score += 5;
  }

  const finalScore = clampPercent(score - blockers.length * 8);

  return {
    score: finalScore,
    tone: getTone(finalScore),
    label:
      finalScore >= 85
        ? "Provider pronto para operacao assistida"
        : "Provider ainda precisa de guardrails",
    budgetUsagePercent,
    canUseExternalProvider,
    canFallbackSafely,
    blockers,
    recommendations: [
      "Manter fallback local ativo para desenvolvimento e indisponibilidade externa.",
      "Auditar custo, latencia e erro por tentativa de geracao.",
      "Bloquear chamadas externas quando o limite mensal for atingido."
    ]
  };
}
