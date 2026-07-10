import { authorizeRoles, type AuthContext } from "@orcamento/auth";
import { prisma } from "@/lib/db/prisma";

export type DatabaseHealthStatus = "healthy" | "unhealthy";

export interface DatabaseHealthResponse {
  status: DatabaseHealthStatus;
  checkedAt: string;
  latencyMs: number;
  provider: "prisma";
  message: string;
}

function ensureConfigReadAccess(authContext: AuthContext): void {
  authorizeRoles(authContext, ["owner", "admin"]);
}

function getDatabaseHealthMessage(status: DatabaseHealthStatus): string {
  if (status === "healthy") {
    return "Prisma conseguiu executar uma consulta curta no banco.";
  }

  return "Prisma nao conseguiu concluir a consulta curta no banco.";
}

function getSafeFailureMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes("Can't reach database server") ||
    message.includes("Timed out fetching a new connection") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT")
  ) {
    return "Banco indisponivel ou lento para o Prisma neste ambiente.";
  }

  return "Falha ao validar o banco via Prisma.";
}

export async function getDatabaseHealth(
  authContext: AuthContext,
  now: () => Date = () => new Date()
): Promise<DatabaseHealthResponse> {
  ensureConfigReadAccess(authContext);

  const startedAt = performance.now();

  try {
    await prisma.$queryRaw`select 1 as ok`;
    const latencyMs = Math.max(0, Math.round(performance.now() - startedAt));

    return {
      status: "healthy",
      checkedAt: now().toISOString(),
      latencyMs,
      provider: "prisma",
      message: getDatabaseHealthMessage("healthy")
    };
  } catch (error: unknown) {
    const latencyMs = Math.max(0, Math.round(performance.now() - startedAt));

    return {
      status: "unhealthy",
      checkedAt: now().toISOString(),
      latencyMs,
      provider: "prisma",
      message: getSafeFailureMessage(error)
    };
  }
}
