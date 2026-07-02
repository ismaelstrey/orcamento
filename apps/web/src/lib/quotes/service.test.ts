import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthContext } from "@orcamento/auth";

const mockAuthorizeRoles = vi.hoisted(() => vi.fn());
const mockLogAuditEvent = vi.hoisted(() => vi.fn());
const mockTransactionQuoteCreate = vi.hoisted(() => vi.fn());
const mockTransactionQuoteVersionCreate = vi.hoisted(() => vi.fn());
const mockPrisma = vi.hoisted(() => ({
  quote: {
    findFirst: vi.fn(),
    update: vi.fn()
  },
  quoteVersion: {
    create: vi.fn(),
    findFirst: vi.fn()
  },
  quoteShareLink: {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn()
  },
  customer: {
    findFirst: vi.fn()
  },
  product: {
    findMany: vi.fn(),
    findFirst: vi.fn()
  },
  $transaction: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma
}));

vi.mock("@/lib/audit/service", () => ({
  logAuditEvent: mockLogAuditEvent
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

import {
  exportQuoteToJson,
  getPublicQuoteBySlug,
  importQuoteFromJson
} from "./service";

const authContext: AuthContext = {
  userId: "usr_1",
  tenantId: "ten_1",
  sessionId: "ses_1",
  roles: ["owner"]
};

describe("quotes/service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback) =>
      callback({
        quote: {
          create: mockTransactionQuoteCreate
        },
        quoteVersion: {
          create: mockTransactionQuoteVersionCreate
        }
      })
    );
  });

  it("exporta a versão mais recente do orçamento e audita a ação", async () => {
    vi.mocked(mockPrisma.quote.findFirst).mockResolvedValue({
      id: "quo_1",
      tenantId: "ten_1",
      customerId: "cus_1",
      title: "Orçamento principal",
      status: "draft",
      publicNotes: null,
      internalNotes: "interno",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      versions: [
        {
          id: "qv_1",
          quoteId: "quo_1",
          versionNumber: 1,
          label: null,
          currency: "BRL",
          subtotalCents: 1000,
          discountCents: 0,
          totalCents: 1000,
          sourceType: "manual",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          items: []
        },
        {
          id: "qv_2",
          quoteId: "quo_1",
          versionNumber: 2,
          label: "Revisão final",
          currency: "BRL",
          subtotalCents: 1500,
          discountCents: 0,
          totalCents: 1500,
          sourceType: "manual",
          createdAt: new Date("2026-01-02T00:00:00.000Z"),
          items: [
            {
              id: "item_1",
              quoteVersionId: "qv_2",
              productId: "prd_1",
              productName: "Ryzen 7600",
              productDescription: null,
              quantity: 1,
              unitPriceCents: 1500,
              totalPriceCents: 1500,
              createdAt: new Date("2026-01-02T00:00:00.000Z")
            }
          ]
        }
      ]
    });

    const result = await exportQuoteToJson(authContext, "quo_1");

    expect(result).toEqual({
      schemaVersion: "1.0.0",
      quote: {
        id: "quo_1",
        title: "Orçamento principal"
      },
      version: {
        id: "qv_2",
        versionNumber: 2,
        currency: "BRL",
        totalCents: 1500
      },
      items: [
        {
          productName: "Ryzen 7600",
          quantity: 1,
          unitPriceCents: 1500
        }
      ]
    });
    expect(mockLogAuditEvent).toHaveBeenCalledWith({
      tenantId: "ten_1",
      actorUserId: "usr_1",
      action: "quote.export_json",
      entityType: "quote_version",
      entityId: "qv_2",
      payloadJson: {
        quoteId: "quo_1",
        versionNumber: 2
      }
    });
  });

  it("retorna payload público seguro para share link ativo", async () => {
    vi.mocked(mockPrisma.quoteShareLink.findUnique).mockResolvedValue({
      id: "sql_1",
      tenantId: "ten_1",
      quoteId: "quo_1",
      quoteVersionId: "qv_1",
      slug: "q_publico",
      status: "active",
      expiresAt: new Date("2099-01-15T00:00:00.000Z"),
      revokedAt: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      quote: {
        id: "quo_1",
        tenantId: "ten_1",
        customerId: "cus_1",
        title: "Orçamento público",
        status: "draft",
        publicNotes: "Válido por 7 dias",
        internalNotes: "não pode sair",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
        customer: {
          id: "cus_1",
          tenantId: "ten_1",
          name: "Cliente XPTO",
          email: null,
          phone: null,
          document: null,
          notes: null,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-02T00:00:00.000Z")
        }
      },
      quoteVersion: {
        id: "qv_1",
        quoteId: "quo_1",
        versionNumber: 1,
        label: null,
        currency: "BRL",
        subtotalCents: 2000,
        discountCents: 0,
        totalCents: 2000,
        sourceType: "manual",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        items: [
          {
            id: "item_1",
            quoteVersionId: "qv_1",
            productId: "prd_1",
            productName: "Produto público",
            productDescription: "Descrição pública",
            quantity: 1,
            unitPriceCents: 2000,
            totalPriceCents: 2000,
            createdAt: new Date("2026-01-01T00:00:00.000Z")
          }
        ]
      }
    });

    const result = await getPublicQuoteBySlug("q_publico");

    expect(result.quote).toEqual({
      id: "quo_1",
      title: "Orçamento público",
      customerName: "Cliente XPTO",
      publicNotes: "Válido por 7 dias"
    });
    expect(result.quote).not.toHaveProperty("internalNotes");
    expect(result.version.items).toHaveLength(1);
  });

  it("sincroniza expiração e bloqueia acesso a share link expirado", async () => {
    vi.mocked(mockPrisma.quoteShareLink.findUnique).mockResolvedValue({
      id: "sql_1",
      tenantId: "ten_1",
      quoteId: "quo_1",
      quoteVersionId: "qv_1",
      slug: "q_expirado",
      status: "active",
      expiresAt: new Date("2020-01-01T00:00:00.000Z"),
      revokedAt: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      quote: {
        id: "quo_1",
        tenantId: "ten_1",
        customerId: "cus_1",
        title: "Orçamento expirado",
        status: "draft",
        publicNotes: null,
        internalNotes: "interno",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
        customer: {
          id: "cus_1",
          tenantId: "ten_1",
          name: "Cliente XPTO",
          email: null,
          phone: null,
          document: null,
          notes: null,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-02T00:00:00.000Z")
        }
      },
      quoteVersion: {
        id: "qv_1",
        quoteId: "quo_1",
        versionNumber: 1,
        label: null,
        currency: "BRL",
        subtotalCents: 2000,
        discountCents: 0,
        totalCents: 2000,
        sourceType: "manual",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        items: []
      }
    });
    vi.mocked(mockPrisma.quoteShareLink.update).mockResolvedValue({
      id: "sql_1",
      tenantId: "ten_1",
      quoteId: "quo_1",
      quoteVersionId: "qv_1",
      slug: "q_expirado",
      status: "expired",
      expiresAt: new Date("2020-01-01T00:00:00.000Z"),
      revokedAt: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z")
    });

    await expect(getPublicQuoteBySlug("q_expirado")).rejects.toMatchObject({
      code: "share_link_expired",
      statusCode: 410
    });

    expect(mockPrisma.quoteShareLink.update).toHaveBeenCalledWith({
      where: {
        id: "sql_1"
      },
      data: {
        status: "expired"
      }
    });
  });

  it("importa JSON criando draft revisável com warning para item não mapeado", async () => {
    vi.mocked(mockPrisma.customer.findFirst).mockResolvedValue({
      id: "cus_1",
      tenantId: "ten_1"
    });
    vi.mocked(mockPrisma.product.findMany).mockResolvedValue([]);
    mockTransactionQuoteCreate.mockResolvedValue({
      id: "quo_1"
    });
    mockTransactionQuoteVersionCreate.mockResolvedValue({
      id: "qv_1"
    });

    const result = await importQuoteFromJson(authContext, {
      customerId: "cus_1",
      schemaVersion: "1.0.0",
      currency: "BRL",
      category: "Computador",
      usageContext: "Escritório",
      items: [
        {
          type: "cpu",
          model: "Modelo não catalogado",
          quantity: 1
        }
      ],
      notes: "Importado do configurador"
    });

    expect(result).toEqual({
      quoteId: "quo_1",
      versionId: "qv_1",
      warnings: [
        'Item "Modelo não catalogado" não encontrou produto compatível e foi importado como manual com valor zero.'
      ],
      normalizedItems: [
        {
          inputType: "cpu",
          inputModel: "Modelo não catalogado",
          resolvedName: "Modelo não catalogado",
          quantity: 1
        }
      ]
    });
    expect(mockTransactionQuoteCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: "ten_1",
        customerId: "cus_1",
        publicNotes: "Importado do configurador"
      })
    });
    expect(mockTransactionQuoteVersionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        quoteId: "quo_1",
        versionNumber: 1,
        sourceType: "import_json"
      })
    });
    expect(mockLogAuditEvent).toHaveBeenCalledWith({
      tenantId: "ten_1",
      actorUserId: "usr_1",
      action: "quote.import_json",
      entityType: "quote",
      entityId: "quo_1",
      payloadJson: {
        versionId: "qv_1",
        warningCount: 1,
        normalizedItemsCount: 1
      }
    });
  });
});
