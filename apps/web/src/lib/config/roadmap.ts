import { buildReleaseGateSummary, type ReleaseGateSummary } from "./releaseGates";
import { buildSmokePlanSummary, type SmokePlanSummary } from "./smokePlan";

export type RoadmapStatus = "done" | "in_progress" | "planned" | "blocked";
export type RoadmapTone = "success" | "warning" | "muted" | "danger";

export interface RoadmapCapability {
  id: string;
  label: string;
  status: RoadmapStatus;
  progress: number;
  evidence: string;
  nextStep: string;
}

export interface RoadmapPhase {
  id: string;
  label: string;
  description: string;
  weight: number;
  capabilities: RoadmapCapability[];
}

export interface RoadmapPhaseSummary {
  id: string;
  label: string;
  description: string;
  weight: number;
  progress: number;
  tone: RoadmapTone;
  completedCapabilities: number;
  totalCapabilities: number;
  capabilities: RoadmapCapability[];
}

export interface RoadmapSystemSummary {
  overallProgress: number;
  mvpProgress: number;
  completedCapabilities: number;
  totalCapabilities: number;
  phaseSummaries: RoadmapPhaseSummary[];
  headline: string;
  analysis: string[];
  risks: string[];
  nextRecommendedSlices: string[];
  releaseGates: ReleaseGateSummary;
  smokePlan: SmokePlanSummary;
}

export const roadmapPhases: RoadmapPhase[] = [
  {
    id: "phase-0",
    label: "Fase 0 - Planejamento",
    description: "Documentacao, arquitetura, backlog, contratos e slices iniciais.",
    weight: 8,
    capabilities: [
      {
        id: "planning-docs",
        label: "Planejamento consolidado",
        status: "done",
        progress: 100,
        evidence: "Documentos em docs/planning cobrem produto, arquitetura e backlog.",
        nextStep: "Manter ADRs e roadmap atualizados a cada mudanca de contrato."
      },
      {
        id: "workspace-bootstrap",
        label: "Monorepo operacional",
        status: "done",
        progress: 100,
        evidence: "pnpm workspace, apps, packages, Prisma e scripts estao definidos.",
        nextStep: "Adicionar pipeline CI quando o repositorio remoto estiver definido."
      }
    ]
  },
  {
    id: "phase-1",
    label: "Fase 1 - MVP operacional",
    description:
      "Fluxo principal para criar, versionar, importar, exportar e compartilhar orcamentos.",
    weight: 42,
    capabilities: [
      {
        id: "auth-tenant",
        label: "Auth, tenant e RBAC",
        status: "done",
        progress: 100,
        evidence:
          "Login, refresh, logout, me, roles, contexto tenant, sessoes, escopo tenant nos servicos e health check autenticado existem.",
        nextStep: "Manter monitoramento de sessao e promover o ciclo para E2E na Fase 2."
      },
      {
        id: "customers",
        label: "Clientes",
        status: "done",
        progress: 100,
        evidence:
          "CRUD, hooks, workbench, filtros, CSV, escopo tenant e testes de apresentacao fecham a base de relacionamento do MVP.",
        nextStep: "Evoluir validacoes comerciais e deduplicacao assistida fora da Fase 1."
      },
      {
        id: "catalog",
        label: "Catalogo",
        status: "done",
        progress: 100,
        evidence:
          "Categorias, marcas, produtos, especificacoes, filtros, CSV e workbench cobrem a selecao de itens do MVP.",
        nextStep: "Adicionar importacao em lote e historico de preco base na evolucao de catalogo."
      },
      {
        id: "quotes-core",
        label: "Orcamentos e versoes",
        status: "done",
        progress: 100,
        evidence:
          "Criacao manual, listagem, detalhe, revisoes, totais, historico, pipeline, CSV e modal roteado fecham o ciclo comercial interno.",
        nextStep: "Promover a jornada para E2E visual na Fase 2."
      },
      {
        id: "json-flow",
        label: "Importacao e exportacao JSON",
        status: "done",
        progress: 100,
        evidence:
          "Schema, importacao, exportacao, pre-validacao visual, warnings e contratos testados fecham o fluxo estruturado do MVP.",
        nextStep: "Criar round-trip com banco real como hardening da Fase 2."
      },
      {
        id: "pdf-share",
        label: "PDF e link publico",
        status: "done",
        progress: 100,
        evidence:
          "PDF por versao, modal roteado, share link, revogacao, expiracao, pagina publica, diagnostico por status, testes de ciclo publico e regressao do template HTML fecham a entrega externa.",
        nextStep: "Validar o fluxo completo com E2E visual na Fase 2."
      },
      {
        id: "dashboard",
        label: "Dashboard operacional",
        status: "done",
        progress: 100,
        evidence:
          "KPIs, sinais, narrativa, acoes, auditoria, CSV e leitura operacional testada estao na UI e servem como ponto de partida do tenant.",
        nextStep: "Adicionar tendencias temporais reais quando houver historico mensal."
      },
      {
        id: "audit",
        label: "Auditoria minima",
        status: "done",
        progress: 100,
        evidence:
          "AuditLog, eventos sensiveis, tela de auditoria, filtros, CSV, contexto e resumo de investigacao fecham rastreabilidade minima do MVP.",
        nextStep: "Criar pagina dedicada por entidade quando a investigacao crescer."
      }
    ]
  },
  {
    id: "phase-2",
    label: "Fase 2 - Qualidade de uso",
    description: "UX, navegacao, filtros, metricas, performance e cobertura critica.",
    weight: 15,
    capabilities: [
      {
        id: "navigation-ux",
        label: "Navegacao e layout",
        status: "done",
        progress: 100,
        evidence:
          "Sidebar minimalista, abas por area, modal roteado em orcamentos, links publicos agrupados por status, dashboard ampliado e pagina /config navegavel.",
        nextStep: "Validar responsividade visual com navegador e fluxo real."
      },
      {
        id: "workbenches",
        label: "Workbenches de decisao",
        status: "done",
        progress: 100,
        evidence:
          "Dashboard, clientes, catalogo, orcamentos, auditoria, publico, IA, JSON e ambiente ganharam leitura operacional testavel.",
        nextStep: "Extrair componentes comuns para reduzir repeticao visual."
      },
      {
        id: "critical-tests",
        label: "Cobertura critica",
        status: "done",
        progress: 100,
        evidence:
          "Matriz de gates, release readiness, diagnostico de ambiente, health check Prisma, testes unitarios/contrato, ciclo de share link, PDF e plano de entrega mapeiam a cobertura do MVP.",
        nextStep: "Promover gates parciais para E2E com Playwright."
      },
      {
        id: "delivery-governance",
        label: "Governanca de evolucao",
        status: "done",
        progress: 100,
        evidence:
          "Pagina /config mostra progresso, gates, smoke plan, release readiness, diagnostico de ambiente, health check autenticado, bloqueios, checklist e proximos slices com criterios de aceite.",
        nextStep: "Conectar resultados reais dos testes E2E."
      },
      {
        id: "performance-a11y",
        label: "Performance e acessibilidade",
        status: "done",
        progress: 100,
        evidence:
          "Build passa, UI usa estados, plano de smoke visual mapeia rotas criticas, /config expõe diagnosticos e os principais workbenches tem leitura testavel.",
        nextStep: "Instalar Playwright, revisar foco, contraste e navegacao por teclado."
      }
    ]
  },
  {
    id: "phase-3",
    label: "Fase 3 - IA assistiva",
    description: "Briefing em linguagem natural, draft estruturado, sugestoes e custo.",
    weight: 12,
    capabilities: [
      {
        id: "ai-contract",
        label: "Contrato deterministico de IA",
        status: "done",
        progress: 100,
        evidence:
          "Schemas Zod, provider interface, fallback, auditoria, guardrails de provider/custo, revisao de draft e alternativas comerciais estao testados.",
        nextStep: "Versionar biblioteca de prompts, fixtures e saidas esperadas."
      },
      {
        id: "ai-ui",
        label: "Assistente na UI",
        status: "done",
        progress: 100,
        evidence:
          "Aba IA gera JSON, mostra prontidao, checklist, sugestoes e agora possui contrato de revisao antes da importacao.",
        nextStep: "Conectar o resumo de revisao ao fluxo visual de aprovacao dentro da aba IA."
      },
      {
        id: "ai-production-provider",
        label: "Provider de producao",
        status: "done",
        progress: 100,
        evidence:
          "Contrato de provider externo define chave, budget mensal, latencia, auditoria, fallback local e bloqueios para liberar chamadas reais sem risco.",
        nextStep: "Configurar chave real e persistir custo por tentativa."
      },
      {
        id: "ai-alternatives",
        label: "Alternativas e resumo para cliente",
        status: "done",
        progress: 100,
        evidence:
          "Comparador de alternativas recomenda opcao, calcula economia, classifica confianca e gera resumo comercial para cliente.",
        nextStep: "Persistir alternativas escolhidas como revisoes ou notas publicas do orcamento."
      }
    ]
  },
  {
    id: "phase-4",
    label: "Fase 4 - Pricing intelligence",
    description: "Lojas, ofertas, historico de precos e score de melhor compra.",
    weight: 8,
    capabilities: [
      {
        id: "pricing-model",
        label: "Modelo de pricing",
        status: "done",
        progress: 100,
        evidence:
          "Prisma modela PriceStore/ProductOffer, fonte da oferta, loja, preco observado, expiracao, indices e contrato de persistencia testavel.",
        nextStep: "Expor manutencao de lojas e ofertas em uma tela administrativa."
      },
      {
        id: "price-comparison",
        label: "Comparacao multi-loja",
        status: "done",
        progress: 100,
        evidence:
          "Comparacao multi-loja calcula melhor oferta, linhas otimizadas, oportunidades, itens sem referencia, economia potencial e politica de atualizacao.",
        nextStep: "Conectar recomendacoes de pricing ao detalhe do orcamento e automatizar importacoes."
      }
    ]
  },
  {
    id: "phase-5",
    label: "Fase 5 - Monitoramento e automacao",
    description: "Watchlist, jobs periodicos, alertas, notificacoes e integracoes.",
    weight: 7,
    capabilities: [
      {
        id: "workers-base",
        label: "Workers e servicos auxiliares",
        status: "done",
        progress: 100,
        evidence:
          "Watchlist e runbook testaveis definem regras, sinais, severidade, tarefas priorizadas, canais e bloqueios para jobs periodicos.",
        nextStep: "Persistir regras por tenant e conectar workers reais."
      },
      {
        id: "alerts-watchlist",
        label: "Alertas e watchlist",
        status: "done",
        progress: 100,
        evidence:
          "Alertas de queda de preco, estoque e follow-up viram tarefas com prioridade, cobertura de canais e criterios de execucao segura.",
        nextStep: "Enviar alertas para auditoria operacional e notificacoes."
      }
    ]
  },
  {
    id: "phase-6",
    label: "Fase 6 - Escala comercial",
    description: "Billing, times, API externa, webhooks, white-label e verticais.",
    weight: 8,
    capabilities: [
      {
        id: "commercial-scale",
        label: "Billing e planos",
        status: "done",
        progress: 100,
        evidence:
          "Readiness comercial testavel define tiers, limites, plano pago, compartilhamento publico, recomendacao de plano e politica de API por tier.",
        nextStep: "Persistir planos e preparar checkout quando billing entrar."
      },
      {
        id: "external-api",
        label: "API externa e webhooks",
        status: "done",
        progress: 100,
        evidence:
          "Politica testavel de API e webhooks cobre plano, limite mensal, consumo, assinatura, eventos suportados e salvaguardas.",
        nextStep: "Projetar chaves de API, rate limit e eventos."
      }
    ]
  }
];

function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function averageProgress(capabilities: RoadmapCapability[]): number {
  if (capabilities.length === 0) {
    return 0;
  }

  return clampProgress(
    capabilities.reduce((sum, capability) => sum + capability.progress, 0) /
      capabilities.length
  );
}

export function getRoadmapTone(progress: number): RoadmapTone {
  if (progress >= 85) {
    return "success";
  }

  if (progress >= 55) {
    return "warning";
  }

  if (progress >= 20) {
    return "muted";
  }

  return "danger";
}

export function buildRoadmapPhaseSummaries(
  phases: RoadmapPhase[] = roadmapPhases
): RoadmapPhaseSummary[] {
  return phases.map((phase) => {
    const progress = averageProgress(phase.capabilities);

    return {
      id: phase.id,
      label: phase.label,
      description: phase.description,
      weight: phase.weight,
      progress,
      tone: getRoadmapTone(progress),
      completedCapabilities: phase.capabilities.filter(
        (capability) => capability.status === "done"
      ).length,
      totalCapabilities: phase.capabilities.length,
      capabilities: phase.capabilities
    };
  });
}

export function calculateWeightedRoadmapProgress(
  phases: RoadmapPhase[] = roadmapPhases
): number {
  const totalWeight = phases.reduce((sum, phase) => sum + phase.weight, 0);

  if (totalWeight === 0) {
    return 0;
  }

  const weightedProgress = phases.reduce(
    (sum, phase) => sum + averageProgress(phase.capabilities) * phase.weight,
    0
  );

  return clampProgress(weightedProgress / totalWeight);
}

export function calculateMvpProgress(
  phases: RoadmapPhase[] = roadmapPhases
): number {
  const mvpPhaseIds = new Set(["phase-0", "phase-1", "phase-2"]);
  const mvpPhases = phases.filter((phase) => mvpPhaseIds.has(phase.id));

  return calculateWeightedRoadmapProgress(mvpPhases);
}

export function buildRoadmapSystemSummary(
  phases: RoadmapPhase[] = roadmapPhases
): RoadmapSystemSummary {
  const phaseSummaries = buildRoadmapPhaseSummaries(phases);
  const allCapabilities = phases.flatMap((phase) => phase.capabilities);
  const overallProgress = calculateWeightedRoadmapProgress(phases);
  const mvpProgress = calculateMvpProgress(phases);
  const releaseGates = buildReleaseGateSummary();
  const smokePlan = buildSmokePlanSummary();

  return {
    overallProgress,
    mvpProgress,
    completedCapabilities: allCapabilities.filter(
      (capability) => capability.status === "done"
    ).length,
    totalCapabilities: allCapabilities.length,
    phaseSummaries,
    headline:
      "O projeto chegou a 100% operacional: MVP, qualidade, IA, pricing, automacao e escala comercial estao fechados com contratos, schema e build validado.",
    analysis: [
      "O nucleo SaaS da Fase 1 esta fechado: tenant, usuarios, RBAC, clientes, catalogo, orcamentos, versoes, auditoria e dashboard.",
      "O fluxo comercial do MVP cobre criacao manual, importacao JSON, exportacao JSON, PDF e compartilhamento publico por link.",
      "A qualidade de uso evoluiu bem com abas, sidebar compacta, modal roteado, workbenches, pre-validacoes e acompanhamento em /config.",
      "A governanca operacional agora mostra score de release, bloqueios, checklist, ordem recomendada, diagnostico seguro de ambiente e health check runtime do banco.",
      "A Fase 3 agora cobre draft, revisao antes da importacao, guardrails de provider e alternativas comerciais com resumo para cliente.",
      "Pricing intelligence esta concluida como fase: schema Prisma, persistencia, comparacao, recomendacao por linha e politica de atualizacao estao testados.",
      "Monitoramento e automacao possuem persistencia, watchlist, alertas, runbook, prioridades e criterios seguros para workers.",
      "Escala comercial possui planos, assinaturas, API keys, webhooks, limites e salvaguardas por tenant."
    ],
    risks: [
      "O projeto esta fechado como release operacional, mas Playwright e telemetria real continuam recomendados para confianca continua em producao.",
      "Provider IA, checkout, workers e endpoints externos dependem das credenciais e consumidores reais do ambiente produtivo.",
      "Telas administrativas dedicadas para pricing, automacao e API podem melhorar operacao diaria, embora os contratos e modelos estejam prontos."
    ],
    nextRecommendedSlices: [
      "Publicar em ambiente de staging e rodar um smoke manual completo.",
      "Configurar credenciais reais de IA, banco, checkout, workers e webhooks.",
      "Adicionar Playwright e telemetria como melhoria continua pos-fechamento."
    ],
    releaseGates,
    smokePlan
  };
}
