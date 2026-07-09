import { describe, expect, it } from "vitest";
import type { ShareLinkResponse } from "./schemas";
import {
  buildShareLinkViewModel,
  buildShareLinkWorkbench,
  getShareLinkStatusLabel
} from "./shareLinksWorkbench";

const now = new Date("2026-07-09T12:00:00.000Z");

function makeShareLink(input: Partial<ShareLinkResponse> & { id: string }): ShareLinkResponse {
  return {
    id: input.id,
    quoteId: input.quoteId ?? "quo_1",
    quoteVersionId: input.quoteVersionId ?? "qv_1",
    slug: input.slug ?? `q_${input.id}`,
    url: input.url ?? `http://localhost:3000/public/quotes/q_${input.id}`,
    status: input.status ?? "active",
    expiresAt: input.expiresAt ?? null,
    revokedAt: input.revokedAt ?? null,
    createdAt: input.createdAt ?? "2026-07-09T10:00:00.000Z",
    updatedAt: input.updatedAt ?? "2026-07-09T10:00:00.000Z"
  };
}

describe("quotes/shareLinksWorkbench", () => {
  it("traduz status para labels comerciais", () => {
    expect(getShareLinkStatusLabel("active")).toBe("Ativo");
    expect(getShareLinkStatusLabel("revoked")).toBe("Revogado");
    expect(getShareLinkStatusLabel("expired")).toBe("Expirado");
  });

  it("monta view model de link ativo sem expiracao", () => {
    const viewModel = buildShareLinkViewModel(makeShareLink({ id: "active" }), now);

    expect(viewModel).toMatchObject({
      statusLabel: "Ativo",
      tone: "success",
      lifecycleLabel: "sem expiracao",
      canOpen: true,
      canCopy: true,
      canRevoke: true,
      actionHint: "Pode ser compartilhado com o cliente."
    });
  });

  it("marca link ativo perto de expirar como atencao", () => {
    const viewModel = buildShareLinkViewModel(
      makeShareLink({
        id: "soon",
        expiresAt: "2026-07-10T12:00:00.000Z"
      }),
      now
    );

    expect(viewModel.tone).toBe("warning");
    expect(viewModel.lifecycleLabel).toBe("expira amanha");
    expect(viewModel.actionHint).toBe(
      "Revise validade antes de reenviar ao cliente."
    );
  });

  it("bloqueia acoes de links revogados e expirados na camada de apresentacao", () => {
    const revoked = buildShareLinkViewModel(
      makeShareLink({
        id: "revoked",
        status: "revoked",
        revokedAt: "2026-07-09T11:00:00.000Z"
      }),
      now
    );
    const expired = buildShareLinkViewModel(
      makeShareLink({
        id: "expired",
        status: "expired",
        expiresAt: "2026-07-01T11:00:00.000Z"
      }),
      now
    );

    expect(revoked.canOpen).toBe(false);
    expect(revoked.canCopy).toBe(false);
    expect(revoked.canRevoke).toBe(false);
    expect(revoked.revokedAtLabel).not.toBeNull();
    expect(revoked.disabledActionReason).toContain("revogado");
    expect(expired.canOpen).toBe(false);
    expect(expired.lifecycleLabel).toBe("acesso encerrado");
    expect(expired.disabledActionReason).toContain("expirado");
  });

  it("resume lista com recomendacoes de risco", () => {
    const workbench = buildShareLinkWorkbench(
      [
        makeShareLink({ id: "active-a" }),
        makeShareLink({
          id: "active-b",
          expiresAt: "2026-07-10T12:00:00.000Z"
        }),
        makeShareLink({ id: "revoked", status: "revoked" })
      ],
      now
    );

    expect(workbench.summary).toMatchObject({
      totalLinks: 3,
      activeLinks: 2,
      revokedLinks: 1,
      expiredLinks: 0,
      expiringSoonLinks: 1,
      riskTone: "warning",
      headline: "2 links publicos ativos"
    });
    expect(workbench.summary.recommendations).toEqual([
      "Existem multiplos links ativos; mantenha somente os links que ainda fazem sentido comercial.",
      "Ha link perto do vencimento; confirme prazo antes de reenviar ao cliente.",
      "Links encerrados continuam visiveis para rastreabilidade e nao devem ser reutilizados."
    ]);
    expect(workbench.statusGroups).toMatchObject([
      {
        id: "active",
        count: 2,
        tone: "warning"
      },
      {
        id: "expired",
        count: 0
      },
      {
        id: "revoked",
        count: 1,
        tone: "danger"
      }
    ]);
  });
});
