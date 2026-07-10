import type { AuditEventResponse } from "./schemas";
import {
  compactAuditPayloadSummary,
  formatAuditActionLabel,
  formatAuditEntityLabel,
  formatAuditEventInsight,
  getAuditActionTone
} from "./presenter";

export type AuditDomainFilter =
  | "all"
  | "ai"
  | "quotes"
  | "sharing"
  | "documents"
  | "auth"
  | "other";

export type AuditToneFilter = "all" | "success" | "warning" | "info";

export interface AuditWorkbenchFilters {
  domain: AuditDomainFilter;
  tone: AuditToneFilter;
  query: string;
}

export interface AuditEventViewModel {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actionLabel: string;
  entityLabel: string;
  actorLabel: string;
  domain: Exclude<AuditDomainFilter, "all">;
  tone: Exclude<AuditToneFilter, "all">;
  insight: string | null;
  contextHref: string | null;
  contextLabel: string | null;
  payloadSummary: string[];
  visiblePayloadSummary: string[];
  hiddenPayloadSummaryCount: number;
  createdAt: string;
  searchText: string;
}

export interface AuditWorkbenchSummary {
  totalEvents: number;
  visibleEvents: number;
  aiEvents: number;
  quoteEvents: number;
  sharingEvents: number;
  warningEvents: number;
  successEvents: number;
  lastEventAt: string | null;
}

export interface AuditTimelineGroup {
  key: string;
  label: string;
  events: AuditEventViewModel[];
}

export interface AuditInvestigationSummary {
  score: number;
  label: string;
  tone: Exclude<AuditToneFilter, "all">;
  priorityEvents: AuditEventViewModel[];
  nextActions: string[];
}

export const auditDomainOptions: Array<{
  value: AuditDomainFilter;
  label: string;
}> = [
  { value: "all", label: "Todos" },
  { value: "ai", label: "IA" },
  { value: "quotes", label: "Orcamentos" },
  { value: "sharing", label: "Links" },
  { value: "documents", label: "PDF" },
  { value: "auth", label: "Acesso" },
  { value: "other", label: "Outros" }
];

export const auditToneOptions: Array<{
  value: AuditToneFilter;
  label: string;
}> = [
  { value: "all", label: "Todos" },
  { value: "success", label: "Sucesso" },
  { value: "warning", label: "Atencao" },
  { value: "info", label: "Info" }
];

const defaultAuditWorkbenchFilters: AuditWorkbenchFilters = {
  domain: "all",
  tone: "all",
  query: ""
};

export function getDefaultAuditWorkbenchFilters(): AuditWorkbenchFilters {
  return { ...defaultAuditWorkbenchFilters };
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function classifyAuditDomain(
  event: Pick<AuditEventResponse, "action" | "entityType">
): Exclude<AuditDomainFilter, "all"> {
  if (
    event.action.startsWith("ai.") ||
    event.entityType === "ai_quote_draft"
  ) {
    return "ai";
  }

  if (event.entityType === "quote_share_link") {
    return "sharing";
  }

  if (event.entityType === "quote_pdf" || event.action === "quote_pdf.generate") {
    return "documents";
  }

  if (event.entityType === "auth" || event.action.startsWith("auth.")) {
    return "auth";
  }

  if (
    event.entityType === "quote" ||
    event.entityType === "quote_version" ||
    event.action.startsWith("quote.")
  ) {
    return "quotes";
  }

  return "other";
}

function buildActorLabel(event: AuditEventResponse): string {
  return (
    event.actorUserName ??
    event.actorUserEmail ??
    "Sistema ou usuario nao vinculado"
  );
}

function findPayloadSummaryValue(
  payloadSummary: string[],
  label: string
): string | null {
  const prefix = `${label}: `;
  const summaryItem = payloadSummary.find((item) => item.startsWith(prefix));

  return summaryItem ? summaryItem.slice(prefix.length) : null;
}

function buildAuditContextLink(input: {
  event: AuditEventResponse;
  domain: Exclude<AuditDomainFilter, "all">;
}): {
  href: string | null;
  label: string | null;
} {
  const quoteId =
    findPayloadSummaryValue(input.event.payloadSummary, "Orcamento") ??
    (input.event.entityType === "quote" ? input.event.entityId : null);
  const publicSlug = findPayloadSummaryValue(
    input.event.payloadSummary,
    "Slug publico"
  );

  if (quoteId) {
    return {
      href: `/quotes?quoteId=${encodeURIComponent(quoteId)}`,
      label: "Abrir orcamento"
    };
  }

  if (publicSlug && input.domain === "sharing") {
    return {
      href: `/public/quotes/${encodeURIComponent(publicSlug)}`,
      label: "Abrir link publico"
    };
  }

  return {
    href: null,
    label: null
  };
}

function buildAuditSearchText(input: {
  event: AuditEventResponse;
  actionLabel: string;
  entityLabel: string;
  actorLabel: string;
  domain: string;
  tone: string;
  insight: string | null;
}): string {
  return normalizeSearchText(
    [
      input.event.action,
      input.event.entityType,
      input.event.entityId,
      input.actionLabel,
      input.entityLabel,
      input.actorLabel,
      input.domain,
      input.tone,
      input.insight ?? "",
      ...input.event.payloadSummary
    ].join(" ")
  );
}

export function buildAuditEventViewModel(
  event: AuditEventResponse
): AuditEventViewModel {
  const compactPayload = compactAuditPayloadSummary(event.payloadSummary);
  const actionLabel = formatAuditActionLabel(event.action);
  const entityLabel = formatAuditEntityLabel(event.entityType);
  const actorLabel = buildActorLabel(event);
  const domain = classifyAuditDomain(event);
  const tone = getAuditActionTone(event.action);
  const contextLink = buildAuditContextLink({
    event,
    domain
  });
  const insight = formatAuditEventInsight({
    action: event.action,
    payloadSummary: event.payloadSummary
  });

  return {
    id: event.id,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    actionLabel,
    entityLabel,
    actorLabel,
    domain,
    tone,
    insight,
    contextHref: contextLink.href,
    contextLabel: contextLink.label,
    payloadSummary: event.payloadSummary,
    visiblePayloadSummary: compactPayload.visibleItems,
    hiddenPayloadSummaryCount: compactPayload.hiddenCount,
    createdAt: event.createdAt,
    searchText: buildAuditSearchText({
      event,
      actionLabel,
      entityLabel,
      actorLabel,
      domain,
      tone,
      insight
    })
  };
}

function formatTimelineGroupLabel(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium"
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function buildAuditTimelineGroups(
  events: AuditEventViewModel[]
): AuditTimelineGroup[] {
  const groups = new Map<string, AuditTimelineGroup>();

  events.forEach((event) => {
    const key = event.createdAt.slice(0, 10);
    const currentGroup = groups.get(key);

    if (currentGroup) {
      currentGroup.events.push(event);
      return;
    }

    groups.set(key, {
      key,
      label: formatTimelineGroupLabel(key),
      events: [event]
    });
  });

  return [...groups.values()];
}

export function buildAuditEventViewModels(
  events: AuditEventResponse[]
): AuditEventViewModel[] {
  return events.map(buildAuditEventViewModel);
}

export function filterAuditEventViewModels(
  events: AuditEventViewModel[],
  filters: AuditWorkbenchFilters
): AuditEventViewModel[] {
  const normalizedQuery = normalizeSearchText(filters.query);

  return events.filter((event) => {
    const matchesDomain =
      filters.domain === "all" || event.domain === filters.domain;
    const matchesTone = filters.tone === "all" || event.tone === filters.tone;
    const matchesQuery =
      !normalizedQuery || event.searchText.includes(normalizedQuery);

    return matchesDomain && matchesTone && matchesQuery;
  });
}

export function buildAuditWorkbenchSummary(input: {
  allEvents: AuditEventViewModel[];
  visibleEvents: AuditEventViewModel[];
}): AuditWorkbenchSummary {
  return {
    totalEvents: input.allEvents.length,
    visibleEvents: input.visibleEvents.length,
    aiEvents: input.allEvents.filter((event) => event.domain === "ai").length,
    quoteEvents: input.allEvents.filter((event) => event.domain === "quotes").length,
    sharingEvents: input.allEvents.filter((event) => event.domain === "sharing")
      .length,
    warningEvents: input.allEvents.filter((event) => event.tone === "warning")
      .length,
    successEvents: input.allEvents.filter((event) => event.tone === "success")
      .length,
    lastEventAt: input.allEvents[0]?.createdAt ?? null
  };
}

export function hasActiveAuditWorkbenchFilters(
  filters: AuditWorkbenchFilters
): boolean {
  return (
    filters.domain !== defaultAuditWorkbenchFilters.domain ||
    filters.tone !== defaultAuditWorkbenchFilters.tone ||
    filters.query.trim().length > 0
  );
}

export function buildAuditWorkbenchRecommendations(input: {
  summary: AuditWorkbenchSummary;
  filters: AuditWorkbenchFilters;
}): string[] {
  const recommendations: string[] = [];
  const hasFilters = hasActiveAuditWorkbenchFilters(input.filters);

  if (input.summary.warningEvents > 0) {
    recommendations.push(
      `${input.summary.warningEvents} evento(s) pedem revisao: falhas, revogacoes ou alertas operacionais.`
    );
  }

  if (input.summary.aiEvents === 0) {
    recommendations.push(
      "Nenhum evento de IA apareceu na janela recente; gere um draft para validar o assistente."
    );
  }

  if (input.summary.sharingEvents > 0) {
    recommendations.push(
      "Revise links publicos recentes para confirmar se ainda devem permanecer ativos."
    );
  }

  if (hasFilters && input.summary.visibleEvents === 0) {
    recommendations.push(
      "Os filtros atuais nao retornaram eventos; limpe a busca para ampliar a auditoria."
    );
  }

  if (!recommendations.length && input.summary.totalEvents > 0) {
    recommendations.push(
      "Auditoria recente sem sinais criticos; mantenha a revisao periodica ativa."
    );
  }

  return recommendations.slice(0, 3);
}

export function buildAuditInvestigationSummary(
  events: AuditEventViewModel[]
): AuditInvestigationSummary {
  const warningEvents = events.filter((event) => event.tone === "warning");
  const authWarnings = warningEvents.filter((event) => event.domain === "auth");
  const sharingWarnings = warningEvents.filter(
    (event) => event.domain === "sharing"
  );
  const documentEvents = events.filter((event) => event.domain === "documents");
  const score = Math.max(
    0,
    Math.min(
      100,
      100 -
        warningEvents.length * 12 -
        authWarnings.length * 8 -
        sharingWarnings.length * 5
    )
  );
  const priorityEvents = [
    ...authWarnings,
    ...sharingWarnings,
    ...warningEvents.filter(
      (event) => event.domain !== "auth" && event.domain !== "sharing"
    )
  ].slice(0, 5);
  const nextActions: string[] = [];

  if (authWarnings.length > 0) {
    nextActions.push("Revisar falhas de login e origem das tentativas recentes.");
  }

  if (sharingWarnings.length > 0) {
    nextActions.push("Confirmar se links revogados ou expirados nao seguem em uso.");
  }

  if (documentEvents.length === 0) {
    nextActions.push("Gerar um PDF de versao atual para registrar evento documental.");
  }

  if (!nextActions.length) {
    nextActions.push("Auditoria sem prioridade critica na janela recente.");
  }

  return {
    score,
    label:
      score >= 85
        ? "Auditoria saudavel"
        : score >= 60
          ? "Auditoria pede revisao"
          : "Auditoria critica",
    tone: score >= 85 ? "success" : score >= 60 ? "info" : "warning",
    priorityEvents,
    nextActions: nextActions.slice(0, 3)
  };
}

function escapeCsvValue(value: string): string {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
}

export function buildAuditCsvContent(events: AuditEventViewModel[]): string {
  const rows = [
    [
      "createdAt",
      "action",
      "entity",
      "actor",
      "domain",
      "tone",
      "insight",
      "payloadSummary"
    ],
    ...events.map((event) => [
      event.createdAt,
      event.actionLabel,
      event.entityLabel,
      event.actorLabel,
      event.domain,
      event.tone,
      event.insight ?? "",
      event.payloadSummary.join(" | ")
    ])
  ];

  return rows
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");
}
