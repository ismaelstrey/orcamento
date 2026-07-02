import type { PrismaClient } from "@prisma/client";
import { createAuthController } from "./controllers/authController";
import { authModuleNotes } from "./docs/authModuleNotes";
import { authRoutes } from "./routes/authRoutes";
import type { AuthAuditLogger } from "./repositories/authRepository";
import { createPrismaAuthRepository } from "./repositories/prismaAuthRepository";
import { AuthService } from "./services/authService";
import { createNoopAuthAuditLogger } from "./services/noopAuthAuditLogger";

export function createAuthModulePlaceholder(): {
  name: string;
  routes: typeof authRoutes;
} {
  return {
    name: "auth-module",
    routes: authRoutes
  };
}

/**
 * Monta o módulo auth com repositório Prisma e logger de auditoria configurável.
 */
export function createAuthModule(input: {
  prisma: PrismaClient;
  auditLogger?: AuthAuditLogger;
}) {
  const repository = createPrismaAuthRepository(input.prisma);
  const auditLogger = input.auditLogger ?? createNoopAuthAuditLogger();
  const service = new AuthService(repository, auditLogger);
  const controller = createAuthController(service);

  return {
    name: "auth-module",
    routes: authRoutes,
    notes: authModuleNotes,
    repository,
    service,
    controller
  };
}
