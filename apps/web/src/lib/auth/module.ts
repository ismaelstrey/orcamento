import { createAuthModule } from "@orcamento/auth";
import { createPrismaAuthAuditLogger } from "../audit/authAuditLogger";
import { prisma } from "../db/prisma";

/**
 * Expõe uma instância única do módulo auth para as rotas HTTP.
 */
export const authModule = createAuthModule({
  prisma,
  auditLogger: createPrismaAuthAuditLogger()
});
