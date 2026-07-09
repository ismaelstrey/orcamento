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
        progress: 92,
        evidence: "Login, refresh, logout, me, roles, contexto tenant e sessoes existem.",
        nextStep: "Expandir testes cross-tenant e regras finas por permissao."
      },
      {
        id: "customers",
        label: "Clientes",
        status: "done",
        progress: 90,
        evidence: "CRUD, hooks, workbench, filtros, CSV e testes de apresentacao.",
        nextStep: "Adicionar validacoes comerciais e deduplicacao assistida."
      },
      {
        id: "catalog",
        label: "Catalogo",
        status: "done",
        progress: 90,
        evidence: "Categorias, marcas, produtos, especificacoes, filtros e CSV.",
        nextStep: "Adicionar importacao em lote e historico de preco base."
      },
      {
        id: "quotes-core",
        label: "Orcamentos e versoes",
        status: "done",
        progress: 88,
        evidence: "Criacao manual, listagem, detalhe, revisoes, totais e historico.",
        nextStep: "Fechar testes financeiros de integridade e fluxos E2E."
      },
      {
        id: "json-flow",
        label: "Importacao e exportacao JSON",
        status: "done",
        progress: 88,
        evidence: "Schema, importacao, exportacao, pre-validacao visual e testes.",
        nextStep: "Criar round-trip automatizado exportar -> importar."
      },
      {
        id: "pdf-share",
        label: "PDF e link publico",
        status: "in_progress",
        progress: 84,
        evidence:
          "PDF por versao, modal roteado, share link, revogacao, pagina publica, diagnostico de links e testes de ciclo publico.",
        nextStep: "Melhorar layout do PDF e validar o fluxo completo com E2E."
      },
      {
        id: "dashboard",
        label: "Dashboard operacional",
        status: "in_progress",
        progress: 82,
        evidence: "KPIs, sinais, narrativa, acoes, auditoria e CSV estao na UI.",
        nextStep: "Adicionar tendencias temporais e metas por tenant."
      },
      {
        id: "audit",
        label: "Auditoria minima",
        status: "in_progress",
        progress: 78,
        evidence: "AuditLog, eventos sensiveis, tela de auditoria e filtros.",
        nextStep: "Cobrir eventos restantes e criar pagina de investigacao por entidade."
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
        status: "in_progress",
        progress: 78,
        evidence:
          "Sidebar minimalista, abas por area, modal roteado em orcamentos e pagina /config navegavel.",
        nextStep: "Validar responsividade visual com navegador e fluxo real."
      },
      {
        id: "workbenches",
        label: "Workbenches de decisao",
        status: "in_progress",
        progress: 72,
        evidence: "Dashboard, clientes, catalogo, orcamentos, publico, IA e JSON ganharam leitura operacional.",
        nextStep: "Padronizar componentes reutilizaveis para reduzir repeticao nas paginas."
      },
      {
        id: "critical-tests",
        label: "Cobertura critica",
        status: "in_progress",
        progress: 76,
        evidence:
          "Matriz de gates, testes unitarios/contrato, ciclo de share link e plano de entrega mapeiam a cobertura do MVP.",
        nextStep: "Promover gates parciais para E2E e integracao com banco."
      },
      {
        id: "delivery-governance",
        label: "Governanca de evolucao",
        status: "done",
        progress: 86,
        evidence:
          "Pagina /config mostra progresso, gates, smoke plan, riscos e proximos slices com criterios de aceite.",
        nextStep: "Atualizar o plano a cada ciclo e conectar resultados reais dos testes E2E."
      },
      {
        id: "performance-a11y",
        label: "Performance e acessibilidade",
        status: "planned",
        progress: 45,
        evidence:
          "Build passa, UI usa estados e plano de smoke visual mapeia rotas criticas.",
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
        progress: 86,
        evidence: "Schemas Zod, provider interface, fallback, auditoria e testes existem.",
        nextStep: "Versionar biblioteca de prompts e saidas esperadas."
      },
      {
        id: "ai-ui",
        label: "Assistente na UI",
        status: "in_progress",
        progress: 68,
        evidence: "Aba IA gera JSON, mostra prontidao, checklist e sugestoes.",
        nextStep: "Adicionar iteracao de revisao antes de enviar para importacao."
      },
      {
        id: "ai-production-provider",
        label: "Provider de producao",
        status: "planned",
        progress: 24,
        evidence: "Provider local permite desenvolvimento, mas falta provider externo configurado.",
        nextStep: "Escolher provider, configurar chave, limites, logs e custo."
      },
      {
        id: "ai-alternatives",
        label: "Alternativas e resumo para cliente",
        status: "planned",
        progress: 16,
        evidence: "Ainda nao ha comparacao de alternativas nem resumo comercial automatico.",
        nextStep: "Criar contrato para alternativas e notas publicas sugeridas."
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
        status: "planned",
        progress: 10,
        evidence: "Planejado nos docs, ainda sem entidades de loja/oferta no Prisma.",
        nextStep: "Modelar loja, oferta, preco observado e fonte."
      },
      {
        id: "price-comparison",
        label: "Comparacao multi-loja",
        status: "planned",
        progress: 6,
        evidence: "Ainda fora do MVP operacional.",
        nextStep: "Comecar com importacao manual de ofertas antes de automacao."
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
        status: "planned",
        progress: 12,
        evidence: "Pastas de workers existem, mas sem fluxo integrado ao produto.",
        nextStep: "Definir contratos para price-monitor e notifications."
      },
      {
        id: "alerts-watchlist",
        label: "Alertas e watchlist",
        status: "planned",
        progress: 4,
        evidence: "Nao implementado no MVP atual.",
        nextStep: "Criar watchlist por produto e regra simples de alerta."
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
        status: "planned",
        progress: 3,
        evidence: "Ainda explicitamente adiado no roadmap.",
        nextStep: "Definir planos apenas apos validacao do MVP."
      },
      {
        id: "external-api",
        label: "API externa e webhooks",
        status: "planned",
        progress: 4,
        evidence: "APIs internas existem, mas sem produto externo ou webhooks.",
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
      "O MVP esta avancado e ja demonstra o ciclo comercial principal, mas o produto completo ainda depende de IA produtiva, pricing intelligence e automacao.",
    analysis: [
      "O nucleo SaaS existe: tenant, usuarios, RBAC, clientes, catalogo, orcamentos, versoes, auditoria e dashboard.",
      "O fluxo comercial ja cobre criacao manual, importacao JSON, exportacao JSON, PDF e compartilhamento publico por link.",
      "A qualidade de uso evoluiu bem com abas, sidebar compacta, modal roteado, workbenches, pre-validacoes e acompanhamento em /config.",
      "A base de IA esta arquitetada e usavel em desenvolvimento, mas ainda falta provider externo, custos, limites e experiencias de revisao mais maduras."
    ],
    risks: [
      "A matriz de gates e o plano de smoke mostram cobertura inicial, mas ainda faltam testes E2E e integracao com banco para proteger regressao nos fluxos P0.",
      "PDF, link publico e expiracao/revogacao precisam de validacao visual e automatizada mais forte.",
      "Pricing intelligence, automacao, billing e API externa seguem planejados, nao operacionais."
    ],
    nextRecommendedSlices: [
      "Instalar Playwright e executar E2E enxuto: login, criar orcamento, versionar, gerar PDF e publicar link.",
      "Validar visualmente o painel de share links com estados ativo, expirado e revogado.",
      "Extrair componentes comuns dos workbenches para reduzir repeticao visual.",
      "Configurar provider IA real com limites, auditoria de custo e fallback controlado.",
      "Iniciar modelo de pricing intelligence com lojas e ofertas importadas manualmente."
    ],
    releaseGates,
    smokePlan
  };
}
