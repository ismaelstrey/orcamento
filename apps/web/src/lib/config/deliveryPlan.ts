import type { RoadmapSystemSummary } from "./roadmap";

export type DeliverySlicePriority = "p0" | "p1" | "p2";
export type DeliverySliceEffort = "s" | "m" | "l";
export type DeliverySliceImpact = "high" | "medium" | "low";
export type DeliverySliceStatus = "done" | "next" | "queued";

export interface DeliverySlice {
  id: string;
  title: string;
  area: string;
  priority: DeliverySlicePriority;
  effort: DeliverySliceEffort;
  impact: DeliverySliceImpact;
  status: DeliverySliceStatus;
  progressLift: number;
  acceptanceCriteria: string[];
}

export interface DeliveryRunwayBatch {
  label: string;
  description: string;
  slices: DeliverySlice[];
  expectedProgressLift: number;
}

export interface DeliveryPlanSummary {
  cycleLabel: string;
  completedThisCycle: DeliverySlice[];
  nextSlices: DeliverySlice[];
  queuedSlices: DeliverySlice[];
  runwayBatches: DeliveryRunwayBatch[];
  immediateSlices: number;
  completedProgressLift: number;
  expectedProgressLift: number;
  projectedMvpProgress: number;
  projectedOverallProgress: number;
  recommendation: string;
}

const completedThisCycle: DeliverySlice[] = [
  {
    id: "config-roadmap-page",
    title: "Pagina /config com roadmap, gates e smoke plan",
    area: "Governanca do produto",
    priority: "p0",
    effort: "m",
    impact: "high",
    status: "done",
    progressLift: 3,
    acceptanceCriteria: [
      "Percentual geral e MVP ficam visiveis na propria aplicacao.",
      "Gates e riscos aparecem com evidencias e proximos passos.",
      "Plano de smoke documenta os fluxos criticos que precisam de E2E."
    ]
  },
  {
    id: "quotes-navigation-cleanup",
    title: "Quotes com abas e modal roteado",
    area: "Experiencia comercial",
    priority: "p0",
    effort: "l",
    impact: "high",
    status: "done",
    progressLift: 4,
    acceptanceCriteria: [
      "Lista, importacao, assistente e novo orcamento ficam separados.",
      "Detalhe de orcamento abre sem quebrar o layout principal.",
      "URL preserva o modal aberto ao atualizar a pagina."
    ]
  },
  {
    id: "share-link-visual-states",
    title: "Estados visuais completos de share links",
    area: "Entrega publica",
    priority: "p0",
    effort: "s",
    impact: "high",
    status: "done",
    progressLift: 3,
    acceptanceCriteria: [
      "Ativo, expirado e revogado exibem diagnostico claro.",
      "Acoes indisponiveis ficam bloqueadas com motivo visivel.",
      "Copiar, abrir e revogar mantem feedback consistente por status."
    ]
  },
  {
    id: "release-readiness-console",
    title: "Console de prontidao para release em /config",
    area: "Governanca do produto",
    priority: "p0",
    effort: "m",
    impact: "high",
    status: "done",
    progressLift: 4,
    acceptanceCriteria: [
      "Score de release combina roadmap, gates, smoke plan e plano de entrega.",
      "Bloqueios, checklist e sinais de saude ficam visiveis na aplicacao.",
      "Ordem recomendada dos proximos slices e calculada por prioridade, impacto e esforco."
    ]
  },
  {
    id: "environment-diagnostics",
    title: "Diagnostico de ambiente e banco para desenvolvimento",
    area: "Operacao",
    priority: "p0",
    effort: "m",
    impact: "high",
    status: "done",
    progressLift: 4,
    acceptanceCriteria: [
      "Pagina /config mostra status de DATABASE_URL, DIRECT_URL e hardening Neon/Prisma.",
      "Falhas de configuracao indicam causa provavel e acao recomendada.",
      "Diagnostico mascara credenciais e nao expoe dados sensiveis."
    ]
  },
  {
    id: "authenticated-db-healthcheck",
    title: "Health check autenticado de banco e Prisma",
    area: "Operacao",
    priority: "p0",
    effort: "s",
    impact: "high",
    status: "done",
    progressLift: 3,
    acceptanceCriteria: [
      "Endpoint autenticado executa consulta segura e curta via Prisma.",
      "Resposta mostra latencia, status e mensagem operacional sem credenciais.",
      "Pagina /config consome o endpoint como verificacao runtime opcional."
    ]
  },
  {
    id: "dashboard-operational-kpis",
    title: "KPIs operacionais testaveis no dashboard",
    area: "Dashboard",
    priority: "p0",
    effort: "s",
    impact: "high",
    status: "done",
    progressLift: 3,
    acceptanceCriteria: [
      "Dashboard mostra pressao comercial, cobertura de distribuicao, relacionamento e IA.",
      "Indicadores ficam centralizados no workbench com testes unitarios.",
      "UI usa a leitura testada sem depender apenas de JSX hardcoded."
    ]
  },
  {
    id: "audit-investigation-summary",
    title: "Resumo de investigacao na auditoria",
    area: "Auditoria",
    priority: "p0",
    effort: "s",
    impact: "high",
    status: "done",
    progressLift: 3,
    acceptanceCriteria: [
      "Auditoria calcula score, eventos prioritarios e proximas acoes.",
      "Falhas de auth e eventos de compartilhamento recebem prioridade.",
      "Dashboard exibe o resumo antes dos filtros de auditoria."
    ]
  },
  {
    id: "pdf-template-regression",
    title: "Regressao segura do template PDF",
    area: "Entrega publica",
    priority: "p0",
    effort: "s",
    impact: "high",
    status: "done",
    progressLift: 2,
    acceptanceCriteria: [
      "Template renderiza totais, cliente, versao e metadados comerciais.",
      "Conteudo dinamico e escapado contra injecao HTML.",
      "Notas publicas opcionais nao criam secao vazia."
    ]
  },
  {
    id: "phase-1-operational-closure",
    title: "Fechamento operacional da Fase 1",
    area: "Governanca do produto",
    priority: "p0",
    effort: "s",
    impact: "high",
    status: "done",
    progressLift: 3,
    acceptanceCriteria: [
      "Roadmap marca todas as capacidades da Fase 1 como concluidas.",
      "Resumo testavel de conclusao da Fase 1 aparece na aplicacao.",
      "E2E e hardening de banco seguem separados como qualidade da Fase 2."
    ]
  },
  {
    id: "controlled-release-signoff",
    title: "Assinatura do release controlado",
    area: "Release readiness",
    priority: "p0",
    effort: "s",
    impact: "high",
    status: "done",
    progressLift: 2,
    acceptanceCriteria: [
      "Score de release chega a 100 quando Fase 1, checklist e gates criticos estao fechados.",
      "Itens de E2E, fixtures e gates parciais continuam visiveis como hardening de release amplo.",
      "Teste automatizado garante que a leitura de release controlado permanece estavel."
    ]
  },
  {
    id: "ai-provider-guardrails",
    title: "Guardrails do provider IA",
    area: "IA assistiva",
    priority: "p1",
    effort: "m",
    impact: "high",
    status: "done",
    progressLift: 4,
    acceptanceCriteria: [
      "Contrato calcula prontidao por chave, budget, latencia, auditoria e fallback.",
      "Uso externo fica bloqueado quando custo, chave ou auditoria nao estao seguros.",
      "Testes cobrem provider pronto e provider bloqueado."
    ]
  },
  {
    id: "pricing-manual-offers-contract",
    title: "Contrato de ofertas manuais e melhor preco",
    area: "Pricing intelligence",
    priority: "p1",
    effort: "m",
    impact: "high",
    status: "done",
    progressLift: 5,
    acceptanceCriteria: [
      "Ofertas manuais calculam economia sobre preco base.",
      "Melhor oferta por produto e cobertura do catalogo ficam testaveis.",
      "Resumo recomenda proxima acao antes da automacao de coleta."
    ]
  },
  {
    id: "watchlist-alert-contract",
    title: "Contrato de watchlist e alertas",
    area: "Monitoramento",
    priority: "p1",
    effort: "m",
    impact: "high",
    status: "done",
    progressLift: 4,
    acceptanceCriteria: [
      "Regras de queda de preco, estoque e follow-up geram alertas.",
      "Alertas possuem severidade e motivo operacional.",
      "Resumo mostra readiness e proximas acoes para workers reais."
    ]
  },
  {
    id: "commercial-packaging-readiness",
    title: "Readiness de empacotamento comercial",
    area: "Escala comercial",
    priority: "p1",
    effort: "s",
    impact: "medium",
    status: "done",
    progressLift: 3,
    acceptanceCriteria: [
      "Planos starter, professional e enterprise possuem limites testaveis.",
      "Acesso API fica reservado para tier avancado.",
      "Resumo aponta lacunas quando monetizacao ou compartilhamento faltam."
    ]
  },
  {
    id: "ai-draft-review-workbench",
    title: "Revisao assistida do draft de IA",
    area: "IA assistiva",
    priority: "p1",
    effort: "m",
    impact: "high",
    status: "done",
    progressLift: 5,
    acceptanceCriteria: [
      "Draft de IA recebe score, bloqueios e status de importacao.",
      "Itens aceitos, rejeitados, confianca e budget entram na decisao.",
      "Resumo sugere nota publica antes de criar o orcamento."
    ]
  },
  {
    id: "ai-alternatives-customer-summary",
    title: "Alternativas IA com resumo para cliente",
    area: "IA assistiva",
    priority: "p1",
    effort: "m",
    impact: "high",
    status: "done",
    progressLift: 5,
    acceptanceCriteria: [
      "Alternativas sao comparadas por confianca, preco, pros e contras.",
      "Opcao recomendada calcula economia frente a alternativa mais alta.",
      "Resumo comercial orienta a comunicacao com o cliente."
    ]
  }
];

const plannedSlices: Omit<DeliverySlice, "status">[] = [
  {
    id: "playwright-critical-flow",
    title: "E2E enxuto com Playwright para fluxo P0",
    area: "Qualidade",
    priority: "p0",
    effort: "m",
    impact: "high",
    progressLift: 5,
    acceptanceCriteria: [
      "Login, criacao de orcamento e modal roteado passam em navegador real.",
      "Link publico ativo e revogado sao validados em contexto anonimo.",
      "A pagina /config entra no smoke visual autenticado."
    ]
  },
  {
    id: "workbench-components",
    title: "Extrair componentes comuns dos workbenches",
    area: "Design system",
    priority: "p1",
    effort: "m",
    impact: "medium",
    progressLift: 2,
    acceptanceCriteria: [
      "Cards de insight, filtros e empty states usam uma base comum.",
      "Paginas reduzem repeticao visual e de classes.",
      "Testes continuam cobrindo as regras de apresentacao."
    ]
  },
  {
    id: "ai-provider-production-guardrails",
    title: "Provider IA real com limites e auditoria de custo",
    area: "IA assistiva",
    priority: "p1",
    effort: "l",
    impact: "high",
    progressLift: 6,
    acceptanceCriteria: [
      "Provider externo e configuravel por ambiente.",
      "Fallback local continua funcionando sem chave.",
      "Custo, erros e latencia entram na auditoria."
    ]
  },
  {
    id: "ai-review-ui-activation",
    title: "Ativar revisao e alternativas da IA na UI",
    area: "IA assistiva",
    priority: "p1",
    effort: "m",
    impact: "high",
    progressLift: 4,
    acceptanceCriteria: [
      "Aba Assistente IA exibe score de revisao do draft gerado.",
      "Usuario aprova itens antes de enviar para importacao JSON.",
      "Alternativas recomendadas podem virar nota publica ou revisao interna."
    ]
  },
  {
    id: "pricing-manual-offers",
    title: "Primeiro modelo de lojas e ofertas manuais",
    area: "Pricing intelligence",
    priority: "p2",
    effort: "l",
    impact: "medium",
    progressLift: 5,
    acceptanceCriteria: [
      "Prisma modela loja, oferta e preco observado.",
      "Produto pode receber ofertas importadas manualmente.",
      "Orcamento mostra referencia de melhor oferta disponivel."
    ]
  }
];

function clampProgressLift(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function sumProgressLift(slices: Pick<DeliverySlice, "progressLift">[]): number {
  return clampProgressLift(
    slices.reduce((sum, slice) => sum + slice.progressLift, 0)
  );
}

function buildRunwayBatches(
  nextSlices: DeliverySlice[],
  queuedSlices: DeliverySlice[]
): DeliveryRunwayBatch[] {
  return [
    {
      label: "Agora",
      description: "Trabalho recomendado para o proximo ciclo curto.",
      slices: nextSlices,
      expectedProgressLift: sumProgressLift(nextSlices)
    },
    {
      label: "Depois",
      description: "Fila que deve entrar quando os riscos P0 estiverem cobertos.",
      slices: queuedSlices,
      expectedProgressLift: sumProgressLift(queuedSlices)
    }
  ].filter((batch) => batch.slices.length > 0);
}

export function buildDeliveryPlanSummary(
  roadmap: Pick<
    RoadmapSystemSummary,
    "mvpProgress" | "overallProgress" | "nextRecommendedSlices"
  >
): DeliveryPlanSummary {
  const nextRecommendedTitles = new Set(
    roadmap.nextRecommendedSlices.map((slice) => slice.toLowerCase())
  );
  const enrichedPlannedSlices = plannedSlices.map((slice) => {
    const isDirectRoadmapRecommendation = Array.from(nextRecommendedTitles).some(
      (recommendedTitle) =>
        recommendedTitle.includes(slice.title.toLowerCase().slice(0, 18)) ||
        slice.title.toLowerCase().includes(recommendedTitle.slice(0, 18))
    );

    return {
      ...slice,
      status:
        slice.priority === "p0" || isDirectRoadmapRecommendation
          ? ("next" as const)
          : ("queued" as const)
    };
  });
  const nextSlices = enrichedPlannedSlices.filter(
    (slice) => slice.status === "next"
  );
  const queuedSlices = enrichedPlannedSlices.filter(
    (slice) => slice.status === "queued"
  );
  const expectedProgressLift = sumProgressLift(nextSlices);
  const completedProgressLift = sumProgressLift(completedThisCycle);
  const projectedMvpProgress = clampProgressLift(
    roadmap.mvpProgress + expectedProgressLift
  );
  const projectedOverallProgress = clampProgressLift(
    roadmap.overallProgress + Math.round(expectedProgressLift * 0.6)
  );

  return {
    cycleLabel: `MVP ${roadmap.mvpProgress}% / Produto ${roadmap.overallProgress}%`,
    completedThisCycle,
    nextSlices,
    queuedSlices,
    runwayBatches: buildRunwayBatches(nextSlices, queuedSlices),
    immediateSlices: nextSlices.length,
    completedProgressLift,
    expectedProgressLift,
    projectedMvpProgress,
    projectedOverallProgress,
    recommendation:
      nextSlices.length > 0
        ? "Priorize os slices P0 antes de abrir novas frentes grandes; eles aumentam confianca de release e reduzem retrabalho visual."
        : "O backlog imediato esta limpo; escolha o proximo slice pelo maior risco aberto no roadmap."
  };
}
