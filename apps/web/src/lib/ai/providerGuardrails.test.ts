import { describe, expect, it } from "vitest";
import { buildAiProviderGuardrailSummary } from "./providerGuardrails";

describe("ai/providerGuardrails", () => {
  it("aprova provider externo quando chave, budget, auditoria e fallback existem", () => {
    const summary = buildAiProviderGuardrailSummary({
      mode: "external",
      hasApiKey: true,
      monthlyBudgetCents: 100000,
      usedBudgetCents: 25000,
      maxLatencyMs: 5000,
      lastLatencyMs: 1200,
      fallbackEnabled: true,
      auditEnabled: true
    });

    expect(summary).toMatchObject({
      score: 100,
      tone: "success",
      canUseExternalProvider: true,
      canFallbackSafely: true,
      budgetUsagePercent: 25,
      blockers: []
    });
  });

  it("bloqueia uso externo quando falta chave ou limite de custo", () => {
    const summary = buildAiProviderGuardrailSummary({
      mode: "external",
      hasApiKey: false,
      monthlyBudgetCents: 0,
      usedBudgetCents: 0,
      maxLatencyMs: 5000,
      lastLatencyMs: 7000,
      fallbackEnabled: false,
      auditEnabled: false
    });

    expect(summary.canUseExternalProvider).toBe(false);
    expect(summary.tone).toBe("danger");
    expect(summary.blockers).toEqual([
      "Chave do provider externo ainda nao configurada.",
      "Orcamento mensal de IA precisa ser definido.",
      "Orcamento mensal de IA foi consumido.",
      "Auditoria de custo e latencia precisa estar ativa.",
      "Ultima latencia excedeu o limite operacional.",
      "Fallback local precisa permanecer disponivel."
    ]);
  });
});
