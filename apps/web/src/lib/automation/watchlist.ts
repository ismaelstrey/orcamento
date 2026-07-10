export type WatchlistRuleType = "price_drop" | "stock_risk" | "quote_follow_up";
export type WatchlistAlertSeverity = "low" | "medium" | "high";

export interface WatchlistRule {
  id: string;
  type: WatchlistRuleType;
  targetId: string;
  label: string;
  thresholdPercent?: number;
  maxAgeDays?: number;
  enabled: boolean;
}

export interface WatchlistSignal {
  targetId: string;
  currentPercent?: number;
  ageDays?: number;
  available?: boolean;
}

export interface WatchlistAlert {
  ruleId: string;
  targetId: string;
  label: string;
  severity: WatchlistAlertSeverity;
  reason: string;
}

export interface WatchlistSummary {
  totalRules: number;
  enabledRules: number;
  alertCount: number;
  highSeverityCount: number;
  automationReadiness: number;
  alerts: WatchlistAlert[];
  nextActions: string[];
}

function getSeverity(rule: WatchlistRule): WatchlistAlertSeverity {
  if (rule.type === "stock_risk") {
    return "high";
  }

  if (rule.type === "quote_follow_up") {
    return "medium";
  }

  return "low";
}

function shouldTrigger(rule: WatchlistRule, signal: WatchlistSignal): boolean {
  if (!rule.enabled) {
    return false;
  }

  if (rule.type === "price_drop") {
    return (
      signal.currentPercent !== undefined &&
      rule.thresholdPercent !== undefined &&
      signal.currentPercent >= rule.thresholdPercent
    );
  }

  if (rule.type === "stock_risk") {
    return signal.available === false;
  }

  return (
    signal.ageDays !== undefined &&
    rule.maxAgeDays !== undefined &&
    signal.ageDays >= rule.maxAgeDays
  );
}

function buildReason(rule: WatchlistRule, signal: WatchlistSignal): string {
  if (rule.type === "price_drop") {
    return `Queda de preco chegou a ${signal.currentPercent ?? 0}%.`;
  }

  if (rule.type === "stock_risk") {
    return "Item monitorado ficou indisponivel.";
  }

  return `Orcamento sem follow-up ha ${signal.ageDays ?? 0} dia(s).`;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildWatchlistSummary(input: {
  rules: WatchlistRule[];
  signals: WatchlistSignal[];
}): WatchlistSummary {
  const signalMap = new Map(input.signals.map((signal) => [signal.targetId, signal]));
  const alerts = input.rules.flatMap((rule) => {
    const signal = signalMap.get(rule.targetId);

    if (!signal || !shouldTrigger(rule, signal)) {
      return [];
    }

    return [
      {
        ruleId: rule.id,
        targetId: rule.targetId,
        label: rule.label,
        severity: getSeverity(rule),
        reason: buildReason(rule, signal)
      }
    ];
  });
  const enabledRules = input.rules.filter((rule) => rule.enabled).length;
  const automationReadiness =
    input.rules.length === 0
      ? 0
      : clampPercent((enabledRules / input.rules.length) * 70 + (alerts.length > 0 ? 30 : 15));

  return {
    totalRules: input.rules.length,
    enabledRules,
    alertCount: alerts.length,
    highSeverityCount: alerts.filter((alert) => alert.severity === "high").length,
    automationReadiness,
    alerts,
    nextActions: [
      "Persistir regras por tenant antes de ativar jobs periodicos.",
      "Enviar alertas criticos para auditoria operacional.",
      "Conectar watchlist a ofertas e propostas mais recentes."
    ]
  };
}
