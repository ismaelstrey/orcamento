import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthContext } from "@orcamento/auth";

const mockAuthorizeRoles = vi.hoisted(() => vi.fn());
const mockPrisma = vi.hoisted(() => ({
  quote: {
    count: vi.fn(),
    findMany: vi.fn()
  },
  customer: {
    count: vi.fn()
  },
  quoteShareLink: {
    count: vi.fn()
  },
  auditLog: {
    count: vi.fn()
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

import { getDashboardSummary } from "./service";

const authContext: AuthContext = {
  userId: "usr_1",
  tenantId: "ten_1",
  sessionId: "ses_1",
  roles: ["seller"]
};

describe("dashboard/service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-08T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("monta resumo do tenant com métricas, ranking da versão atual e recentes", async () => {
    vi.mocked(mockPrisma.quote.count)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(3);
    vi.mocked(mockPrisma.customer.count).mockResolvedValue(5);
    vi.mocked(mockPrisma.quoteShareLink.count).mockResolvedValue(2);
    vi.mocked(mockPrisma.auditLog.count)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(1);
    vi.mocked(mockPrisma.quote.findMany)
      .mockResolvedValueOnce([
        {
          versions: [
            {
              versionNumber: 1,
              items: [
                {
                  productId: "prd_old",
                  productName: "Produto antigo",
                  quantity: 99
                }
              ]
            },
            {
              versionNumber: 2,
              items: [
                {
                  productId: "prd_a",
                  productName: "Notebook Pro",
                  quantity: 2
                },
                {
                  productId: null,
                  productName: "Servico de instalacao",
                  quantity: 1
                }
              ]
            }
          ]
        },
        {
          versions: [
            {
              versionNumber: 1,
              items: [
                {
                  productId: "prd_a",
                  productName: "Notebook Pro",
                  quantity: 3
                }
              ]
            }
          ]
        }
      ])
      .mockResolvedValueOnce([
        {
          id: "quo_2",
          title: "Renovacao notebooks",
          status: "published",
          updatedAt: new Date("2026-07-08T11:00:00.000Z"),
          customer: {
            name: "Cliente B"
          },
          versions: [
            {
              versionNumber: 1,
              totalCents: 100000,
              currency: "BRL"
            },
            {
              versionNumber: 3,
              totalCents: 180000,
              currency: "BRL"
            }
          ]
        },
        {
          id: "quo_sem_versao",
          title: "Rascunho inconsistente",
          status: "draft",
          updatedAt: new Date("2026-07-08T10:00:00.000Z"),
          customer: {
            name: "Cliente C"
          },
          versions: []
        }
      ]);

    const result = await getDashboardSummary(authContext);

    expect(mockAuthorizeRoles).toHaveBeenCalledWith(authContext, [
      "owner",
      "admin",
      "seller"
    ]);
    expect(mockPrisma.quote.count).toHaveBeenNthCalledWith(1, {
      where: {
        tenantId: "ten_1"
      }
    });
    expect(mockPrisma.quote.count).toHaveBeenNthCalledWith(2, {
      where: {
        tenantId: "ten_1",
        createdAt: {
          gte: new Date("2026-07-01T03:00:00.000Z")
        }
      }
    });
    expect(mockPrisma.customer.count).toHaveBeenCalledWith({
      where: {
        tenantId: "ten_1"
      }
    });
    expect(mockPrisma.quoteShareLink.count).toHaveBeenCalledWith({
      where: {
        tenantId: "ten_1",
        status: "active"
      }
    });
    expect(mockPrisma.auditLog.count).toHaveBeenNthCalledWith(1, {
      where: {
        tenantId: "ten_1",
        action: "ai.quote_draft.generate.success",
        createdAt: {
          gte: new Date("2026-07-01T03:00:00.000Z")
        }
      }
    });
    expect(mockPrisma.auditLog.count).toHaveBeenNthCalledWith(2, {
      where: {
        tenantId: "ten_1",
        action: "ai.quote_draft.generate.failure",
        createdAt: {
          gte: new Date("2026-07-01T03:00:00.000Z")
        }
      }
    });
    expect(mockPrisma.quote.findMany).toHaveBeenNthCalledWith(2, {
      where: {
        tenantId: "ten_1"
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        customer: {
          select: {
            name: true
          }
        },
        versions: {
          select: {
            versionNumber: true,
            totalCents: true,
            currency: true
          }
        }
      }
    });
    expect(result).toEqual({
      totalQuotes: 7,
      quotesThisMonth: 3,
      activeCustomers: 5,
      publishedLinks: 2,
      aiActivity: {
        draftsThisMonth: 4,
        failuresThisMonth: 1,
        totalAttemptsThisMonth: 5,
        successRate: 0.8
      },
      topProducts: [
        {
          productId: "prd_a",
          productName: "Notebook Pro",
          uses: 5
        },
        {
          productId: null,
          productName: "Servico de instalacao",
          uses: 1
        }
      ],
      recentQuotes: [
        {
          id: "quo_2",
          title: "Renovacao notebooks",
          customerName: "Cliente B",
          status: "published",
          versionNumber: 3,
          totalCents: 180000,
          currency: "BRL",
          updatedAt: "2026-07-08T11:00:00.000Z"
        }
      ]
    });
  });

  it("nao consulta o banco quando autorizacao falha", async () => {
    mockAuthorizeRoles.mockImplementationOnce(() => {
      throw new Error("sem permissao");
    });

    await expect(getDashboardSummary(authContext)).rejects.toThrow("sem permissao");
    expect(mockPrisma.quote.count).not.toHaveBeenCalled();
    expect(mockPrisma.quote.findMany).not.toHaveBeenCalled();
  });
});
