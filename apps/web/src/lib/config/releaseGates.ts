export type ReleaseGateStatus = "covered" | "partial" | "missing";
export type ReleaseGateTone = "success" | "warning" | "danger";
export type ReleaseGateLayer = "unit" | "contract" | "service" | "ui" | "e2e";

export interface ReleaseGateScenario {
  id: string;
  label: string;
  status: ReleaseGateStatus;
  layers: ReleaseGateLayer[];
  evidence: string;
  gap: string;
  nextStep: string;
}

export interface ReleaseGateGroup {
  id: string;
  label: string;
  description: string;
  scenarios: ReleaseGateScenario[];
}

export interface ReleaseGateGroupSummary extends ReleaseGateGroup {
  progress: number;
  tone: ReleaseGateTone;
  coveredScenarios: number;
  partialScenarios: number;
  missingScenarios: number;
}

export interface ReleaseGateSummary {
  progress: number;
  tone: ReleaseGateTone;
  coveredScenarios: number;
  partialScenarios: number;
  missingScenarios: number;
  totalScenarios: number;
  groups: ReleaseGateGroupSummary[];
  headline: string;
  nextActions: string[];
}

export const releaseGateGroups: ReleaseGateGroup[] = [
  {
    id: "auth-access",
    label: "Acesso e seguranca",
    description: "Entrada autenticada, tenant, roles e sessoes.",
    scenarios: [
      {
        id: "login-refresh-logout",
        label: "Login, refresh e logout",
        status: "covered",
        layers: ["service", "contract"],
        evidence: "AuthService cobre login, refresh, logout, tokens e sessoes.",
        gap: "Ainda falta reproduzir o ciclo no navegador com cookies/local storage.",
        nextStep: "Adicionar E2E: login valido, refresh silencioso e logout."
      },
      {
        id: "tenant-rbac",
        label: "Tenant e RBAC",
        status: "partial",
        layers: ["service", "contract"],
        evidence: "Middlewares e servicos validam roles e escopo tenant nos fluxos principais.",
        gap: "Cobertura cross-tenant ainda nao e transversal em todos os endpoints.",
        nextStep: "Criar matriz de endpoints com casos 401, 403 e tenant_scope_error."
      }
    ]
  },
  {
    id: "commercial-flow",
    label: "Fluxo comercial",
    description: "Caminho principal de criacao e revisao de orcamento.",
    scenarios: [
      {
        id: "manual-quote",
        label: "Criar orcamento manual",
        status: "partial",
        layers: ["service", "ui"],
        evidence: "Servico cria quote, calcula totais e UI possui formulario manual.",
        gap: "Ainda falta E2E que preencha formulario e valide aparicao na lista.",
        nextStep: "Adicionar E2E: criar orcamento manual com item de catalogo."
      },
      {
        id: "versioning",
        label: "Criar nova versao",
        status: "partial",
        layers: ["service", "ui"],
        evidence: "Servico cria versoes e painel mostra historico e acoes por versao.",
        gap: "Falta teste de navegador garantindo historico imutavel visivel.",
        nextStep: "Adicionar E2E: versionar e conferir versao anterior preservada."
      },
      {
        id: "quote-list-detail",
        label: "Listagem, filtros e detalhe",
        status: "covered",
        layers: ["unit", "ui"],
        evidence: "Workbenches cobrem filtros, paginacao, resumo, pipeline e modal roteado.",
        gap: "Falta screenshot/visual check em desktop e mobile.",
        nextStep: "Adicionar verificacao visual das abas e modal de orcamento."
      }
    ]
  },
  {
    id: "structured-input",
    label: "Entrada estruturada",
    description: "Importacao JSON, exportacao JSON e assistente IA.",
    scenarios: [
      {
        id: "import-json",
        label: "Importar JSON",
        status: "covered",
        layers: ["service", "contract", "ui"],
        evidence: "Schema, pre-validacao visual, normalizacao e warnings possuem testes.",
        gap: "Falta round-trip exportar -> importar com dados persistidos.",
        nextStep: "Adicionar teste de integracao com banco para round-trip."
      },
      {
        id: "export-json",
        label: "Exportar JSON",
        status: "partial",
        layers: ["service", "contract"],
        evidence: "Servico exporta a versao mais recente e audita a acao.",
        gap: "Ainda falta validar compatibilidade direta com o importador.",
        nextStep: "Criar fixture exportada e reimportar no mesmo teste."
      },
      {
        id: "ai-draft",
        label: "Assistente IA para draft",
        status: "partial",
        layers: ["unit", "service", "ui"],
        evidence: "Provider local, fallback, auditoria, readiness e checklist tem cobertura.",
        gap: "Provider real, custo, rate limit e regressao de prompt ainda nao existem.",
        nextStep: "Adicionar suite de fixtures de prompt e provider real configuravel."
      }
    ]
  },
  {
    id: "public-delivery",
    label: "Entrega publica",
    description: "PDF, preview autenticado e link publico compartilhavel.",
    scenarios: [
      {
        id: "pdf-generation",
        label: "Gerar documento/PDF",
        status: "partial",
        layers: ["service", "ui"],
        evidence: "Endpoint retorna URL por versao e preview autenticado existe.",
        gap: "Falta validacao visual do documento e conteudo comercial final.",
        nextStep: "Adicionar snapshot HTML do template e visual check do modal."
      },
      {
        id: "share-link-public",
        label: "Link publico ativo, revogado e expirado",
        status: "covered",
        layers: ["service", "unit", "ui"],
        evidence: "Servico cobre payload seguro, revogado, expirado e painel diagnostica links.",
        gap: "Falta E2E abrindo URL publica em outra sessao.",
        nextStep: "Adicionar E2E publico sem token para link ativo/revogado/expirado."
      }
    ]
  },
  {
    id: "operations",
    label: "Operacao",
    description: "Dashboard, auditoria, configuracao e acompanhamento do projeto.",
    scenarios: [
      {
        id: "dashboard-audit",
        label: "Dashboard e auditoria",
        status: "partial",
        layers: ["service", "unit", "ui"],
        evidence: "Dashboard, auditoria, filtros, CSV e workbenches possuem testes unitarios.",
        gap: "Ainda falta teste integrado com dados reais de tenant.",
        nextStep: "Criar fixture de tenant com eventos e validar KPIs agregados."
      },
      {
        id: "roadmap-config",
        label: "Pagina de roadmap",
        status: "covered",
        layers: ["unit", "ui"],
        evidence: "Roadmap versionado, percentuais e pagina /config estao no build.",
        gap: "Ainda falta edicao administrativa persistida do roadmap.",
        nextStep: "Manter roadmap versionado ate existir tela de administracao persistida."
      }
    ]
  }
];

function getScenarioScore(status: ReleaseGateStatus): number {
  if (status === "covered") {
    return 100;
  }

  if (status === "partial") {
    return 55;
  }

  return 0;
}

function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getReleaseGateTone(progress: number): ReleaseGateTone {
  if (progress >= 80) {
    return "success";
  }

  if (progress >= 45) {
    return "warning";
  }

  return "danger";
}

export function buildReleaseGateGroupSummaries(
  groups: ReleaseGateGroup[] = releaseGateGroups
): ReleaseGateGroupSummary[] {
  return groups.map((group) => {
    const progress = clampProgress(
      group.scenarios.reduce(
        (sum, scenario) => sum + getScenarioScore(scenario.status),
        0
      ) / group.scenarios.length
    );

    return {
      ...group,
      progress,
      tone: getReleaseGateTone(progress),
      coveredScenarios: group.scenarios.filter(
        (scenario) => scenario.status === "covered"
      ).length,
      partialScenarios: group.scenarios.filter(
        (scenario) => scenario.status === "partial"
      ).length,
      missingScenarios: group.scenarios.filter(
        (scenario) => scenario.status === "missing"
      ).length
    };
  });
}

export function buildReleaseGateSummary(
  groups: ReleaseGateGroup[] = releaseGateGroups
): ReleaseGateSummary {
  const groupSummaries = buildReleaseGateGroupSummaries(groups);
  const scenarios = groups.flatMap((group) => group.scenarios);
  const progress = clampProgress(
    scenarios.reduce((sum, scenario) => sum + getScenarioScore(scenario.status), 0) /
      scenarios.length
  );
  const missingScenarios = scenarios.filter(
    (scenario) => scenario.status === "missing"
  ).length;
  const partialScenarios = scenarios.filter(
    (scenario) => scenario.status === "partial"
  ).length;

  return {
    progress,
    tone: getReleaseGateTone(progress),
    coveredScenarios: scenarios.filter((scenario) => scenario.status === "covered")
      .length,
    partialScenarios,
    missingScenarios,
    totalScenarios: scenarios.length,
    groups: groupSummaries,
    headline:
      missingScenarios === 0
        ? "Nenhum gate critico esta sem cobertura inicial; o proximo ganho vem de E2E real e integracao com banco."
        : "Ainda existem gates criticos sem cobertura inicial antes de liberar um MVP mais publico.",
    nextActions: [
      "Adicionar Playwright para cobrir login, criacao de orcamento e link publico.",
      "Criar fixture de banco para round-trip exportar/importar e dashboard.",
      "Rodar verificacao visual desktop/mobile nas telas /quotes, /config e pagina publica.",
      "Promover gates cobertos por unit/contract para E2E quando o fluxo estiver estavel."
    ]
  };
}
