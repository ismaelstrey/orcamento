import { describe, expect, it } from "vitest";
import type { AuditEventResponse } from "./schemas";
import {
  auditDomainOptions,
  auditToneOptions,
  buildAuditEventViewModel,
  buildAuditEventViewModels,
  buildAuditCsvContent,
  buildAuditInvestigationSummary,
  buildAuditTimelineGroups,
  buildAuditWorkbenchSummary,
  buildAuditWorkbenchRecommendations,
  classifyAuditDomain,
  filterAuditEventViewModels,
  getDefaultAuditWorkbenchFilters,
  hasActiveAuditWorkbenchFilters
} from "./workbench";

function makeEvent(
  input: Partial<AuditEventResponse> & Pick<AuditEventResponse, "action">
): AuditEventResponse {
  return {
    id: input.id ?? `aud_${input.action}`,
    action: input.action,
    entityType: input.entityType ?? "quote",
    entityId: input.entityId ?? "ent_1",
    actorUserName: input.actorUserName ?? "Owner Bootstrap",
    actorUserEmail: input.actorUserEmail ?? "owner@example.com",
    payloadSummary: input.payloadSummary ?? [],
    createdAt: input.createdAt ?? "2026-07-08T10:00:00.000Z"
  };
}

const auditEvents = [
  makeEvent({
    id: "aud_ai",
    action: "ai.quote_draft.generate.success",
    entityType: "ai_quote_draft",
    entityId: "ses_1",
    payloadSummary: [
      "Provider: local-deterministic",
      "Itens sugeridos: 2",
      "Confianca media: 76%",
      "Alertas: 1"
    ]
  }),
  makeEvent({
    id: "aud_share",
    action: "quote_share_link.revoke",
    entityType: "quote_share_link",
    entityId: "shl_1",
    payloadSummary: [
      "Orcamento: quo_1",
      "Versao ID: qv_1",
      "Slug publico: q_publico"
    ],
    createdAt: "2026-07-08T09:00:00.000Z"
  }),
  makeEvent({
    id: "aud_pdf",
    action: "quote_pdf.generate",
    entityType: "quote_version",
    entityId: "qv_2",
    payloadSummary: ["Orcamento: quo_2", "Versao: 2"],
    createdAt: "2026-07-08T08:00:00.000Z"
  }),
  makeEvent({
    id: "aud_auth",
    action: "auth.login.failure",
    entityType: "auth",
    entityId: "ses_2",
    actorUserName: null,
    actorUserEmail: null,
    payloadSummary: [],
    createdAt: "2026-07-08T07:00:00.000Z"
  })
];

describe("audit/workbench", () => {
  it("mantem opcoes de filtro estaveis para a interface", () => {
    expect(auditDomainOptions.map((option) => option.value)).toEqual([
      "all",
      "ai",
      "quotes",
      "sharing",
      "documents",
      "auth",
      "other"
    ]);
    expect(auditToneOptions.map((option) => option.value)).toEqual([
      "all",
      "success",
      "warning",
      "info"
    ]);
  });

  it("classifica eventos por dominio operacional", () => {
    expect(
      classifyAuditDomain({
        action: "ai.quote_draft.generate.success",
        entityType: "ai_quote_draft"
      })
    ).toBe("ai");
    expect(
      classifyAuditDomain({
        action: "quote_share_link.create",
        entityType: "quote_share_link"
      })
    ).toBe("sharing");
    expect(
      classifyAuditDomain({
        action: "quote_pdf.generate",
        entityType: "quote_version"
      })
    ).toBe("documents");
    expect(
      classifyAuditDomain({
        action: "auth.login.success",
        entityType: "auth"
      })
    ).toBe("auth");
    expect(
      classifyAuditDomain({
        action: "quote.create",
        entityType: "quote"
      })
    ).toBe("quotes");
  });

  it("monta view model com labels, insight, chips compactados e texto pesquisavel", () => {
    const viewModel = buildAuditEventViewModel(auditEvents[0]!);

    expect(viewModel).toMatchObject({
      id: "aud_ai",
      actionLabel: "IA gerou draft de orçamento",
      entityLabel: "Assistente IA",
      actorLabel: "Owner Bootstrap",
      domain: "ai",
      tone: "success",
      insight: "2 item(ns), 1 alerta(s), 76% de confianca media.",
      contextHref: null,
      contextLabel: null,
      visiblePayloadSummary: [
        "Provider: local-deterministic",
        "Itens sugeridos: 2",
        "Confianca media: 76%",
        "Alertas: 1"
      ],
      hiddenPayloadSummaryCount: 0
    });
    expect(viewModel.searchText).toContain("assistente ia");
    expect(viewModel.searchText).toContain("local-deterministic");
  });

  it("cria link de contexto quando o evento aponta para orcamento ou link publico", () => {
    expect(
      buildAuditEventViewModel(
        makeEvent({
          action: "quote.export_json",
          entityType: "quote_version",
          payloadSummary: ["Orcamento: quo_1", "Versao: 2"]
        })
      )
    ).toMatchObject({
      contextHref: "/quotes?quoteId=quo_1",
      contextLabel: "Abrir orcamento"
    });

    expect(
      buildAuditEventViewModel(
        makeEvent({
          action: "quote_share_link.revoke",
          entityType: "quote_share_link",
          payloadSummary: ["Slug publico: q_publico"]
        })
      )
    ).toMatchObject({
      contextHref: "/public/quotes/q_publico",
      contextLabel: "Abrir link publico"
    });
  });

  it("filtra eventos por dominio, tom e busca normalizada", () => {
    const viewModels = buildAuditEventViewModels(auditEvents);

    expect(
      filterAuditEventViewModels(viewModels, {
        domain: "ai",
        tone: "all",
        query: ""
      }).map((event) => event.id)
    ).toEqual(["aud_ai"]);

    expect(
      filterAuditEventViewModels(viewModels, {
        domain: "all",
        tone: "warning",
        query: ""
      }).map((event) => event.id)
    ).toEqual(["aud_share", "aud_auth"]);

    expect(
      filterAuditEventViewModels(viewModels, {
        domain: "all",
        tone: "all",
        query: "publico"
      }).map((event) => event.id)
    ).toEqual(["aud_share"]);
  });

  it("resume volume total e volume visivel do workbench", () => {
    const viewModels = buildAuditEventViewModels(auditEvents);
    const visibleEvents = filterAuditEventViewModels(viewModels, {
      domain: "all",
      tone: "warning",
      query: ""
    });

    expect(
      buildAuditWorkbenchSummary({
        allEvents: viewModels,
        visibleEvents
      })
    ).toEqual({
      totalEvents: 4,
      visibleEvents: 2,
      aiEvents: 1,
      quoteEvents: 0,
      sharingEvents: 1,
      warningEvents: 2,
      successEvents: 1,
      lastEventAt: "2026-07-08T10:00:00.000Z"
    });
  });

  it("agrupa eventos filtrados por dia preservando a ordem recebida", () => {
    const viewModels = buildAuditEventViewModels([
      auditEvents[0]!,
      {
        ...auditEvents[1]!,
        createdAt: "2026-07-09T09:00:00.000Z"
      },
      {
        ...auditEvents[2]!,
        createdAt: "2026-07-09T08:00:00.000Z"
      }
    ]);

    expect(
      buildAuditTimelineGroups(viewModels).map((group) => ({
        key: group.key,
        eventIds: group.events.map((event) => event.id)
      }))
    ).toEqual([
      {
        key: "2026-07-08",
        eventIds: ["aud_ai"]
      },
      {
        key: "2026-07-09",
        eventIds: ["aud_share", "aud_pdf"]
      }
    ]);
  });

  it("gera recomendacoes operacionais a partir do resumo e filtros", () => {
    const viewModels = buildAuditEventViewModels(auditEvents);
    const visibleEvents = filterAuditEventViewModels(viewModels, {
      domain: "all",
      tone: "warning",
      query: ""
    });
    const summary = buildAuditWorkbenchSummary({
      allEvents: viewModels,
      visibleEvents
    });

    expect(
      buildAuditWorkbenchRecommendations({
        summary,
        filters: {
          domain: "all",
          tone: "warning",
          query: ""
        }
      })
    ).toEqual([
      "2 evento(s) pedem revisao: falhas, revogacoes ou alertas operacionais.",
      "Revise links publicos recentes para confirmar se ainda devem permanecer ativos."
    ]);
  });

  it("gera resumo de investigacao priorizando auth e compartilhamento", () => {
    const viewModels = buildAuditEventViewModels(auditEvents);
    const investigation = buildAuditInvestigationSummary(viewModels);

    expect(investigation).toMatchObject({
      score: 63,
      label: "Auditoria pede revisao",
      tone: "info",
      nextActions: [
        "Revisar falhas de login e origem das tentativas recentes.",
        "Confirmar se links revogados ou expirados nao seguem em uso."
      ]
    });
    expect(investigation.priorityEvents.map((event) => event.id)).toEqual([
      "aud_auth",
      "aud_share"
    ]);
  });

  it("detecta filtros ativos sem depender de identidade de objeto", () => {
    expect(hasActiveAuditWorkbenchFilters(getDefaultAuditWorkbenchFilters())).toBe(
      false
    );
    expect(
      hasActiveAuditWorkbenchFilters({
        ...getDefaultAuditWorkbenchFilters(),
        query: "  notebook  "
      })
    ).toBe(true);
  });

  it("exporta a visao filtrada da auditoria como CSV escapado", () => {
    const [event] = buildAuditEventViewModels([
      makeEvent({
        action: "quote_share_link.revoke",
        entityType: "quote_share_link",
        actorUserName: 'Owner "Bootstrap"',
        payloadSummary: [
          "Orcamento: quo_1",
          "Slug publico: q_publico",
          "Observacao: revisar, depois"
        ]
      })
    ]);

    expect(buildAuditCsvContent(event ? [event] : [])).toBe(
      [
        "createdAt,action,entity,actor,domain,tone,insight,payloadSummary",
        '2026-07-08T10:00:00.000Z,Link público revogado,Link público,"Owner ""Bootstrap""",sharing,warning,Link publico q_publico revogado.,"Orcamento: quo_1 | Slug publico: q_publico | Observacao: revisar, depois"'
      ].join("\n")
    );
  });
});
