import type { WatchlistAlert, WatchlistAlertSeverity } from "./watchlist";

export type AutomationChannel = "audit" | "dashboard" | "email" | "webhook";
export type AutomationRunbookTone = "success" | "warning" | "danger";

export interface AutomationRunbookInput {
  alerts: WatchlistAlert[];
  enabledChannels: AutomationChannel[];
  hasWorkerSecret: boolean;
  hasWebhookUrl: boolean;
}

export interface AutomationTask {
  id: string;
  alertLabel: string;
  severity: WatchlistAlertSeverity;
  channels: AutomationChannel[];
  priority: number;
  action: string;
}

export interface AutomationRunbookSummary {
  tone: AutomationRunbookTone;
  score: number;
  taskCount: number;
  criticalTaskCount: number;
  channelCoverage: number;
  canRunScheduledJobs: boolean;
  tasks: AutomationTask[];
  blockers: string[];
  nextActions: string[];
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function severityPriority(severity: WatchlistAlertSeverity): number {
  if (severity === "high") {
    return 100;
  }

  if (severity === "medium") {
    return 70;
  }

  return 40;
}

function getTone(score: number): AutomationRunbookTone {
  if (score >= 85) {
    return "success";
  }

  if (score >= 60) {
    return "warning";
  }

  return "danger";
}

function buildChannels(input: AutomationRunbookInput): AutomationChannel[] {
  const channels = new Set<AutomationChannel>(["audit", "dashboard"]);

  for (const channel of input.enabledChannels) {
    channels.add(channel);
  }

  if (!input.hasWebhookUrl) {
    channels.delete("webhook");
  }

  return Array.from(channels);
}

export function buildAutomationRunbookSummary(
  input: AutomationRunbookInput
): AutomationRunbookSummary {
  const channels = buildChannels(input);
  const tasks = input.alerts
    .map((alert) => ({
      id: `${alert.ruleId}:${alert.targetId}`,
      alertLabel: alert.label,
      severity: alert.severity,
      channels,
      priority: severityPriority(alert.severity),
      action:
        alert.severity === "high"
          ? "Notificar responsavel e registrar evento critico."
          : "Registrar alerta e acompanhar no dashboard operacional."
    }))
    .sort((left, right) => right.priority - left.priority);
  const criticalTaskCount = tasks.filter((task) => task.severity === "high").length;
  const channelCoverage = clampPercent((channels.length / 4) * 100);
  const blockers = [
    !input.hasWorkerSecret
      ? "Definir segredo de worker antes de executar jobs agendados."
      : null,
    input.enabledChannels.includes("webhook") && !input.hasWebhookUrl
      ? "Webhook foi habilitado sem URL de destino."
      : null,
    input.alerts.length === 0
      ? "Nenhum alerta disponivel para validar automacao."
      : null
  ].filter(Boolean) as string[];
  let score = 35;

  if (input.hasWorkerSecret) {
    score += 25;
  }

  if (tasks.length > 0) {
    score += 20;
  }

  score += Math.min(channels.length, 4) * 6;

  if (criticalTaskCount > 0) {
    score += 5;
  }

  const finalScore = clampPercent(score - blockers.length * 12);

  return {
    tone: getTone(finalScore),
    score: finalScore,
    taskCount: tasks.length,
    criticalTaskCount,
    channelCoverage,
    canRunScheduledJobs: finalScore >= 85 && input.hasWorkerSecret,
    tasks,
    blockers,
    nextActions: [
      "Executar jobs com idempotencia por regra e alvo monitorado.",
      "Registrar alertas emitidos na auditoria operacional.",
      "Promover canais externos somente depois de dashboard e auditoria estaveis."
    ]
  };
}
