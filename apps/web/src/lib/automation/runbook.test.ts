import { describe, expect, it } from "vitest";
import { buildAutomationRunbookSummary } from "./runbook";

describe("automation/runbook", () => {
  it("monta tarefas priorizadas com canais internos e externos seguros", () => {
    const summary = buildAutomationRunbookSummary({
      hasWorkerSecret: true,
      hasWebhookUrl: true,
      enabledChannels: ["email", "webhook"],
      alerts: [
        {
          ruleId: "follow",
          targetId: "quote-1",
          label: "Follow-up de proposta",
          severity: "medium",
          reason: "Orcamento sem retorno ha 7 dias."
        },
        {
          ruleId: "stock",
          targetId: "prod-1",
          label: "Estoque indisponivel",
          severity: "high",
          reason: "Produto ficou indisponivel."
        }
      ]
    });

    expect(summary).toMatchObject({
      tone: "success",
      score: 100,
      taskCount: 2,
      criticalTaskCount: 1,
      channelCoverage: 100,
      canRunScheduledJobs: true,
      blockers: []
    });
    expect(summary.tasks[0]).toMatchObject({
      id: "stock:prod-1",
      priority: 100,
      channels: ["audit", "dashboard", "email", "webhook"]
    });
  });

  it("bloqueia execucao agendada sem segredo e sem URL de webhook", () => {
    const summary = buildAutomationRunbookSummary({
      hasWorkerSecret: false,
      hasWebhookUrl: false,
      enabledChannels: ["webhook"],
      alerts: []
    });

    expect(summary.tone).toBe("danger");
    expect(summary.canRunScheduledJobs).toBe(false);
    expect(summary.blockers).toEqual([
      "Definir segredo de worker antes de executar jobs agendados.",
      "Webhook foi habilitado sem URL de destino.",
      "Nenhum alerta disponivel para validar automacao."
    ]);
    expect(summary.channelCoverage).toBe(50);
  });
});
