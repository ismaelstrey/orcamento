export type EnvironmentDiagnosticStatus = "ok" | "warning" | "error";

export interface DatabaseUrlDiagnostic {
  name: "DATABASE_URL" | "DIRECT_URL";
  configured: boolean;
  status: EnvironmentDiagnosticStatus;
  provider: "postgres" | "unknown";
  host: string;
  database: string;
  sslMode: string;
  connectionLimit: string;
  poolTimeout: string;
  connectTimeout: string;
  isNeon: boolean;
  isPooler: boolean;
  safeUrl: string;
  findings: string[];
  recommendedAction: string;
}

export interface EnvironmentDiagnosticSummary {
  status: EnvironmentDiagnosticStatus;
  headline: string;
  databaseUrls: DatabaseUrlDiagnostic[];
  checks: Array<{
    id: string;
    label: string;
    status: EnvironmentDiagnosticStatus;
    detail: string;
  }>;
  nextActions: string[];
}

function getStatusWeight(status: EnvironmentDiagnosticStatus): number {
  if (status === "error") {
    return 3;
  }

  if (status === "warning") {
    return 2;
  }

  return 1;
}

function pickWorstStatus(
  statuses: EnvironmentDiagnosticStatus[]
): EnvironmentDiagnosticStatus {
  return [...statuses].sort(
    (left, right) => getStatusWeight(right) - getStatusWeight(left)
  )[0] ?? "ok";
}

function redactUrl(rawUrl: string): string {
  return rawUrl.replace(/:\/\/([^:]+):([^@]+)@/, "://***:***@");
}

function getQueryValue(url: URL, key: string): string {
  return url.searchParams.get(key) ?? "";
}

function buildMissingDiagnostic(
  name: DatabaseUrlDiagnostic["name"]
): DatabaseUrlDiagnostic {
  return {
    name,
    configured: false,
    status: "error",
    provider: "unknown",
    host: "",
    database: "",
    sslMode: "",
    connectionLimit: "",
    poolTimeout: "",
    connectTimeout: "",
    isNeon: false,
    isPooler: false,
    safeUrl: "",
    findings: [`${name} nao esta configurada.`],
    recommendedAction: `Configure ${name} no .env antes de iniciar a aplicacao.`
  };
}

function buildInvalidDiagnostic(
  name: DatabaseUrlDiagnostic["name"],
  rawUrl: string
): DatabaseUrlDiagnostic {
  return {
    name,
    configured: true,
    status: "error",
    provider: "unknown",
    host: "",
    database: "",
    sslMode: "",
    connectionLimit: "",
    poolTimeout: "",
    connectTimeout: "",
    isNeon: false,
    isPooler: false,
    safeUrl: redactUrl(rawUrl),
    findings: [`${name} tem formato invalido para uma URL Postgres.`],
    recommendedAction:
      "Use uma URL iniciando com postgresql:// ou postgres:// e sem caracteres quebrados."
  };
}

export function analyzeDatabaseUrl(
  name: DatabaseUrlDiagnostic["name"],
  rawUrl?: string
): DatabaseUrlDiagnostic {
  if (!rawUrl) {
    return buildMissingDiagnostic(name);
  }

  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    return buildInvalidDiagnostic(name, rawUrl);
  }

  const provider =
    url.protocol === "postgresql:" || url.protocol === "postgres:"
      ? "postgres"
      : "unknown";
  const host = url.hostname;
  const database = url.pathname.replace(/^\//, "");
  const sslMode = getQueryValue(url, "sslmode");
  const connectionLimit = getQueryValue(url, "connection_limit");
  const poolTimeout = getQueryValue(url, "pool_timeout");
  const connectTimeout = getQueryValue(url, "connect_timeout");
  const isNeon = host.includes("neon.tech");
  const isPooler = host.includes("-pooler.");
  const findings: string[] = [];

  if (provider !== "postgres") {
    findings.push("Protocolo nao e Postgres.");
  }

  if (!database) {
    findings.push("Nome do banco nao aparece no caminho da URL.");
  }

  if (isNeon && sslMode !== "require") {
    findings.push("Neon deve usar sslmode=require.");
  }

  if (isNeon && url.port !== "5432") {
    findings.push("Defina a porta 5432 explicitamente para reduzir ambiguidade.");
  }

  if (isPooler && !connectionLimit) {
    findings.push("Pooler Neon funciona melhor com connection_limit definido.");
  }

  if (isNeon && !poolTimeout) {
    findings.push("Inclua pool_timeout para evitar falhas curtas do Prisma.");
  }

  if (isNeon && !connectTimeout) {
    findings.push("Inclua connect_timeout para diagnosticar lentidao de rede.");
  }

  if (!isNeon && host === "localhost") {
    findings.push("Ambiente esta apontando para Postgres local.");
  }

  const status =
    provider !== "postgres" || !database
      ? "error"
      : findings.length > 0
        ? "warning"
        : "ok";

  return {
    name,
    configured: true,
    status,
    provider,
    host,
    database,
    sslMode,
    connectionLimit,
    poolTimeout,
    connectTimeout,
    isNeon,
    isPooler,
    safeUrl: redactUrl(rawUrl),
    findings:
      findings.length > 0
        ? findings
        : ["Configuracao parece consistente para conexao Postgres."],
    recommendedAction:
      status === "ok"
        ? "Manter a URL atual e validar conectividade com um health check autenticado."
        : isNeon
          ? "Use porta 5432 explicita, sslmode=require, connection_limit=1, pool_timeout=30 e connect_timeout=30."
          : "Confirme se o Postgres local esta rodando ou troque a URL para o banco remoto ativo."
  };
}

export function buildEnvironmentDiagnosticSummary(
  env: Pick<NodeJS.ProcessEnv, "DATABASE_URL" | "DIRECT_URL">
): EnvironmentDiagnosticSummary {
  const databaseUrl = analyzeDatabaseUrl("DATABASE_URL", env.DATABASE_URL);
  const directUrl = analyzeDatabaseUrl("DIRECT_URL", env.DIRECT_URL);
  const databaseUrls = [databaseUrl, directUrl];
  const sameHost =
    databaseUrl.configured &&
    directUrl.configured &&
    databaseUrl.host === directUrl.host;
  const sameDatabase =
    databaseUrl.configured &&
    directUrl.configured &&
    databaseUrl.database === directUrl.database;
  const allConfigured = databaseUrls.every((item) => item.configured);
  const allPostgres = databaseUrls.every((item) => item.provider === "postgres");
  const checks = [
    {
      id: "configured",
      label: "Variaveis configuradas",
      status: allConfigured ? ("ok" as const) : ("error" as const),
      detail: allConfigured
        ? "DATABASE_URL e DIRECT_URL estao presentes."
        : "Uma ou mais URLs de banco nao foram encontradas."
    },
    {
      id: "postgres-protocol",
      label: "Protocolo Postgres",
      status: allPostgres ? ("ok" as const) : ("error" as const),
      detail: allPostgres
        ? "As URLs usam protocolo compativel com Prisma/Postgres."
        : "Ao menos uma URL nao usa postgresql:// ou postgres://."
    },
    {
      id: "same-target",
      label: "Destino consistente",
      status: sameHost && sameDatabase ? ("ok" as const) : ("warning" as const),
      detail:
        sameHost && sameDatabase
          ? "DATABASE_URL e DIRECT_URL apontam para o mesmo banco."
          : "As URLs parecem apontar para bancos ou hosts diferentes."
    },
    {
      id: "neon-hardening",
      label: "Parametros Neon/Prisma",
      status: databaseUrls.some(
        (item) =>
          item.isNeon &&
          (!item.connectionLimit || !item.poolTimeout || !item.connectTimeout)
      )
        ? "warning"
        : "ok",
      detail:
        "Para Neon, prefira porta explicita, SSL obrigatorio, limite de conexao e timeouts."
    }
  ];
  const status = pickWorstStatus([
    ...databaseUrls.map((item) => item.status),
    ...checks.map((check) => check.status)
  ]);
  const nextActions = [
    status === "ok"
      ? "Executar health check autenticado para validar consulta real via Prisma."
      : "Corrigir as URLs do .env e reiniciar o servidor Next para recarregar variaveis.",
    "Nao versionar credenciais reais; manter apenas .env.example no repositorio.",
    "Quando usar Neon pooler, manter connection_limit=1 em desenvolvimento para reduzir saturacao."
  ];

  return {
    status,
    headline:
      status === "ok"
        ? "Ambiente de banco parece bem configurado para o proximo ciclo."
        : "Ambiente de banco precisa de atencao antes de validar login e fluxos autenticados.",
    databaseUrls,
    checks,
    nextActions
  };
}
