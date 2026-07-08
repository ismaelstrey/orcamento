import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthContext } from "@orcamento/auth";
import { createLocalQuoteDraftProvider } from "./localProvider";
import { generateAuditedQuoteDraftReview } from "./audit";

const mockAuthorizeRoles = vi.hoisted(() => vi.fn());
const mockLogAuditEvent = vi.hoisted(() => vi.fn());

vi.mock("@orcamento/auth", () => ({
  authorizeRoles: mockAuthorizeRoles
}));

vi.mock("@/lib/audit/service", () => ({
  logAuditEvent: mockLogAuditEvent
}));

const authContext: AuthContext = {
  userId: "usr_1",
  tenantId: "ten_1",
  sessionId: "ses_1",
  roles: ["owner"]
};

const request = {
  customerId: "cus_1",
  userText: "Preciso de tres notebooks corporativos para equipe comercial.",
  currency: "BRL",
  budgetMaxCents: 1200000,
  catalogHints: [
    {
      productId: "prd_1",
      name: "Notebook corporativo i5",
      category: "notebooks"
    }
  ]
};

describe("ai/audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("audita sucesso sem persistir briefing bruto", async () => {
    const review = await generateAuditedQuoteDraftReview({
      authContext,
      providers: [createLocalQuoteDraftProvider()],
      request
    });

    expect(mockAuthorizeRoles).toHaveBeenCalledWith(authContext, [
      "owner",
      "admin",
      "seller"
    ]);
    expect(review.provider).toBe("local-deterministic");
    expect(mockLogAuditEvent).toHaveBeenCalledWith({
      tenantId: "ten_1",
      actorUserId: "usr_1",
      action: "ai.quote_draft.generate.success",
      entityType: "ai_quote_draft",
      entityId: "ses_1",
      payloadJson: {
        customerId: "cus_1",
        userTextLength: request.userText.length,
        catalogHintsCount: 1,
        budgetMaxCents: 1200000,
        promptVersion: "quote-draft-v1",
        outputSchemaVersion: "ai.quote_draft.v1",
        provider: "local-deterministic",
        model: "local-deterministic-v1",
        totalTokens: expect.any(Number),
        estimatedCostCents: 0,
        durationMs: expect.any(Number),
        warningCount: 1,
        itemCount: 1,
        confidenceAverage: 0.72,
        confidenceMin: 0.72,
        fallbackAttemptsCount: 0
      }
    });
    expect(JSON.stringify(mockLogAuditEvent.mock.calls[0])).not.toContain(
      request.userText
    );
  });

  it("audita falha controlada de provider sem mascarar o erro original", async () => {
    await expect(
      generateAuditedQuoteDraftReview({
        authContext,
        providers: [],
        request
      })
    ).rejects.toMatchObject({
      code: "provider_error"
    });

    expect(mockLogAuditEvent).toHaveBeenCalledWith({
      tenantId: "ten_1",
      actorUserId: "usr_1",
      action: "ai.quote_draft.generate.failure",
      entityType: "ai_quote_draft",
      entityId: "ses_1",
      payloadJson: {
        customerId: "cus_1",
        userTextLength: request.userText.length,
        catalogHintsCount: 1,
        budgetMaxCents: 1200000,
        code: "provider_error"
      }
    });
  });

  it("bloqueia geração antes de chamar provider quando autorização falha", async () => {
    mockAuthorizeRoles.mockImplementationOnce(() => {
      throw new Error("sem permissao");
    });
    const provider = createLocalQuoteDraftProvider();
    const generateQuoteDraftSpy = vi.spyOn(provider, "generateQuoteDraft");

    await expect(
      generateAuditedQuoteDraftReview({
        authContext,
        providers: [provider],
        request
      })
    ).rejects.toThrow("sem permissao");

    expect(generateQuoteDraftSpy).not.toHaveBeenCalled();
    expect(mockLogAuditEvent).not.toHaveBeenCalled();
  });
});
