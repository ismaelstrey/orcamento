import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthContext } from "@orcamento/auth";

const mockAuthorizeRoles = vi.hoisted(() => vi.fn());
const mockPrisma = vi.hoisted(() => ({
  auditLog: {
    create: vi.fn(),
    findMany: vi.fn()
  }
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma
}));

vi.mock("@orcamento/auth", () => ({
  AuthError: class AuthError extends Error {
    public readonly code: string;
    public readonly statusCode: number;

    constructor(code: string, message: string, statusCode = 401) {
      super(message);
      this.name = "AuthError";
      this.code = code;
      this.statusCode = statusCode;
    }
  },
  authorizeRoles: mockAuthorizeRoles
}));

import { listRecentAuditEvents, logAuditEvent } from "./service";

const authContext: AuthContext = {
  userId: "usr_1",
  tenantId: "ten_1",
  sessionId: "ses_1",
  roles: ["owner"]
};

describe("audit/service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persiste evento minimo de auditoria com tenant e ator opcionais normalizados", async () => {
    vi.mocked(mockPrisma.auditLog.create).mockResolvedValue({
      id: "aud_1"
    });

    await logAuditEvent({
      action: "quote.create",
      entityType: "quote",
      entityId: "quo_1",
      payloadJson: {
        currentVersionId: "qv_1"
      }
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        tenantId: null,
        actorUserId: null,
        action: "quote.create",
        entityType: "quote",
        entityId: "quo_1",
        payloadJson: {
          currentVersionId: "qv_1"
        }
      }
    });
  });

  it("lista eventos recentes somente do tenant autenticado e exige papel administrativo", async () => {
    vi.mocked(mockPrisma.auditLog.findMany).mockResolvedValue([
      {
        id: "aud_1",
        action: "quote_share_link.create",
        entityType: "quote_share_link",
        entityId: "shl_1",
        payloadJson: {
          quoteId: "quo_1",
          quoteVersionId: "qv_1",
          slug: "q_publico"
        },
        createdAt: new Date("2026-07-08T10:00:00.000Z"),
        actorUser: {
          name: "Owner Bootstrap",
          email: "owner@example.com"
        }
      },
      {
        id: "aud_2",
        action: "auth.login.success",
        entityType: "auth",
        entityId: "ses_1",
        payloadJson: null,
        createdAt: new Date("2026-07-08T09:00:00.000Z"),
        actorUser: null
      },
      {
        id: "aud_3",
        action: "ai.quote_draft.generate.success",
        entityType: "ai_quote_draft",
        entityId: "ses_1",
        payloadJson: {
          provider: "local-deterministic",
          promptVersion: "quote-draft-v1",
          outputSchemaVersion: "ai.quote_draft.v1",
          model: "local-deterministic-v1",
          totalTokens: 120,
          estimatedCostCents: 0,
          durationMs: 15,
          itemCount: 2,
          confidenceAverage: 0.76,
          confidenceMin: 0.62,
          warningCount: 1,
          fallbackAttemptsCount: 0,
          userTextLength: 68
        },
        createdAt: new Date("2026-07-08T08:00:00.000Z"),
        actorUser: {
          name: "Owner Bootstrap",
          email: "owner@example.com"
        }
      }
    ]);

    const result = await listRecentAuditEvents(authContext);

    expect(mockAuthorizeRoles).toHaveBeenCalledWith(authContext, ["owner", "admin"]);
    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: "ten_1"
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 8,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        payloadJson: true,
        createdAt: true,
        actorUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    expect(result).toEqual({
      items: [
        {
          id: "aud_1",
          action: "quote_share_link.create",
          entityType: "quote_share_link",
          entityId: "shl_1",
          actorUserName: "Owner Bootstrap",
          actorUserEmail: "owner@example.com",
          payloadSummary: [
            "Orcamento: quo_1",
            "Versao ID: qv_1",
            "Slug publico: q_publico"
          ],
          createdAt: "2026-07-08T10:00:00.000Z"
        },
        {
          id: "aud_2",
          action: "auth.login.success",
          entityType: "auth",
          entityId: "ses_1",
          actorUserName: null,
          actorUserEmail: null,
          payloadSummary: [],
          createdAt: "2026-07-08T09:00:00.000Z"
        },
        {
          id: "aud_3",
          action: "ai.quote_draft.generate.success",
          entityType: "ai_quote_draft",
          entityId: "ses_1",
          actorUserName: "Owner Bootstrap",
          actorUserEmail: "owner@example.com",
          payloadSummary: [
            "Provider: local-deterministic",
            "Prompt: quote-draft-v1",
            "Schema: ai.quote_draft.v1",
            "Modelo: local-deterministic-v1",
            "Tokens: 120",
            "Custo estimado: 0 centavos",
            "Duração: 15ms",
            "Itens sugeridos: 2",
            "Confianca media: 76%",
            "Confianca minima: 62%",
            "Alertas: 1",
            "Fallbacks: 0"
          ],
          createdAt: "2026-07-08T08:00:00.000Z"
        }
      ]
    });
  });

  it("nao consulta eventos quando autorizacao falha", async () => {
    mockAuthorizeRoles.mockImplementationOnce(() => {
      throw new Error("sem permissao");
    });

    await expect(listRecentAuditEvents(authContext)).rejects.toThrow(
      "sem permissao"
    );
    expect(mockPrisma.auditLog.findMany).not.toHaveBeenCalled();
  });
});
