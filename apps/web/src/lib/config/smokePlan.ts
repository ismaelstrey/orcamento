export type SmokePlanPriority = "p0" | "p1";
export type SmokePlanStatus = "ready" | "needs_data" | "needs_tooling";

export interface SmokePlanStep {
  label: string;
  expected: string;
}

export interface SmokePlanFlow {
  id: string;
  label: string;
  priority: SmokePlanPriority;
  status: SmokePlanStatus;
  route: string;
  objective: string;
  steps: SmokePlanStep[];
  automationTarget: string;
}

export interface SmokePlanSummary {
  readiness: number;
  readyFlows: number;
  needsDataFlows: number;
  needsToolingFlows: number;
  totalFlows: number;
  flows: SmokePlanFlow[];
  headline: string;
}

export const smokePlanFlows: SmokePlanFlow[] = [
  {
    id: "auth-session",
    label: "Login e sessao",
    priority: "p0",
    status: "needs_tooling",
    route: "/login",
    objective: "Garantir entrada, sessao ativa, refresh e saida sem quebrar tenant.",
    automationTarget: "Playwright com storage state autenticado.",
    steps: [
      {
        label: "Entrar com usuario owner do tenant bootstrap",
        expected: "Redireciona para /dashboard com shell autenticado."
      },
      {
        label: "Atualizar a pagina autenticada",
        expected: "Sessao permanece ativa e dados do tenant continuam visiveis."
      },
      {
        label: "Sair pela sidebar",
        expected: "Sessao e removida e usuario volta para /login."
      }
    ]
  },
  {
    id: "quote-create",
    label: "Criar orcamento manual",
    priority: "p0",
    status: "ready",
    route: "/quotes",
    objective: "Validar aba Novo orcamento, layout do campo quantidade e entrada na lista.",
    automationTarget: "E2E preenchendo cliente, produto, quantidade e validando card criado.",
    steps: [
      {
        label: "Abrir aba Novo orcamento",
        expected: "Formulario ocupa a largura sem overflow no campo quantidade."
      },
      {
        label: "Selecionar cliente, produto e quantidade",
        expected: "Valores ficam legiveis em desktop e mobile."
      },
      {
        label: "Criar orcamento",
        expected: "Novo draft aparece na aba Lista de orcamentos."
      }
    ]
  },
  {
    id: "quote-modal",
    label: "Modal roteado de orcamento",
    priority: "p0",
    status: "ready",
    route: "/quotes",
    objective: "Garantir que detalhe abre em modal sem quebrar o layout e preserva URL.",
    automationTarget: "E2E abrindo item, recarregando a URL e fechando modal.",
    steps: [
      {
        label: "Clicar em um orcamento da lista",
        expected: "Detalhe abre centralizado em modal, sem painel lateral quebrando a pagina."
      },
      {
        label: "Atualizar navegador com modal aberto",
        expected: "Modal continua aberto para o mesmo orcamento."
      },
      {
        label: "Fechar modal",
        expected: "Usuario retorna para /quotes mantendo a lista navegavel."
      }
    ]
  },
  {
    id: "json-import",
    label: "Importar JSON",
    priority: "p1",
    status: "ready",
    route: "/quotes",
    objective: "Validar pre-checagem, warnings e criacao de draft revisavel.",
    automationTarget: "Teste de integracao exportar -> importar usando fixture versionada.",
    steps: [
      {
        label: "Abrir aba Importar JSON e colar payload valido",
        expected: "Preview mostra prontidao, totais e cliente."
      },
      {
        label: "Colar payload com campos opcionais faltando",
        expected: "Warnings aparecem sem bloquear importacao valida."
      },
      {
        label: "Importar draft",
        expected: "Orcamento importado aparece na lista com status draft."
      }
    ]
  },
  {
    id: "public-share",
    label: "Link publico",
    priority: "p0",
    status: "needs_data",
    route: "/public/quotes/[slug]",
    objective: "Conferir acesso publico, expiracao e revogacao em uma sessao sem login.",
    automationTarget:
      "E2E com contexto anonimo, fixtures de links ativo/revogado/expirado e checagem dos bloqueios na UI.",
    steps: [
      {
        label: "Criar link ativo em um orcamento",
        expected: "Painel mostra URL, status ativo, diagnostico e acoes habilitadas."
      },
      {
        label: "Abrir link em contexto anonimo",
        expected: "Documento publico carrega sem exigir login."
      },
      {
        label: "Revogar ou expirar link",
        expected:
          "URL publica deixa de exibir o orcamento e painel mostra acoes bloqueadas com motivo."
      }
    ]
  },
  {
    id: "config-roadmap",
    label: "Roadmap, ambiente e gates",
    priority: "p1",
    status: "ready",
    route: "/config",
    objective:
      "Garantir que percentuais, release readiness, diagnostico de ambiente, health check e proximos slices continuam visiveis.",
    automationTarget:
      "Smoke visual da pagina /config apos build e health check autenticado com mock de rede.",
    steps: [
      {
        label: "Abrir /config autenticado",
        expected:
          "Cards de projeto, MVP, release readiness, ambiente e gates renderizam sem erro."
      },
      {
        label: "Percorrer gates, ambiente e roadmap",
        expected:
          "Todas as fases, URLs mascaradas, checks e acoes recomendadas aparecem."
      },
      {
        label: "Executar health check runtime",
        expected:
          "Card mostra status, latencia e mensagem operacional sem expor credenciais."
      }
    ]
  }
];

function getSmokeFlowScore(status: SmokePlanStatus): number {
  if (status === "ready") {
    return 100;
  }

  if (status === "needs_data") {
    return 60;
  }

  return 35;
}

function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildSmokePlanSummary(
  flows: SmokePlanFlow[] = smokePlanFlows
): SmokePlanSummary {
  const readyFlows = flows.filter((flow) => flow.status === "ready").length;
  const needsDataFlows = flows.filter((flow) => flow.status === "needs_data").length;
  const needsToolingFlows = flows.filter(
    (flow) => flow.status === "needs_tooling"
  ).length;
  const readiness =
    flows.length === 0
      ? 0
      : clampProgress(
          flows.reduce((sum, flow) => sum + getSmokeFlowScore(flow.status), 0) /
            flows.length
        );

  return {
    readiness,
    readyFlows,
    needsDataFlows,
    needsToolingFlows,
    totalFlows: flows.length,
    flows,
    headline:
      needsToolingFlows > 0
        ? "O plano de smoke esta mapeado; falta conectar a ferramenta E2E para automatizar os fluxos P0."
        : "Os fluxos de smoke estao prontos para execucao recorrente."
  };
}
