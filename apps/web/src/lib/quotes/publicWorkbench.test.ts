import { describe, expect, it } from "vitest";
import type { PublicQuoteShare } from "./schemas";
import {
  buildPublicQuoteActions,
  buildPublicQuoteChecklist,
  buildPublicQuoteItemViewModels,
  buildPublicQuoteMetrics,
  buildPublicQuoteNarrative,
  buildPublicQuotePrintSummary,
  buildPublicQuoteTrustNotes,
  buildPublicQuoteWorkbench,
  formatPublicQuoteCurrency,
  formatPublicQuoteDate,
  getPublicQuoteStatusLabel,
  getPublicQuoteStatusTone
} from "./publicWorkbench";

const activeShare: PublicQuoteShare = {
  slug: "q_public",
  status: "active",
  expiresAt: "2026-07-20T12:00:00.000Z",
  quote: {
    id: "quo_1",
    title: "Proposta notebooks comerciais",
    customerName: "Cliente Alpha",
    publicNotes: "Valores validos para compra em lote."
  },
  version: {
    id: "qv_1",
    versionNumber: 2,
    label: "Revisao final",
    currency: "BRL",
    subtotalCents: 3000000,
    discountCents: 300000,
    totalCents: 2700000,
    sourceType: "manual",
    createdAt: "2026-07-08T12:00:00.000Z",
    items: [
      {
        id: "item_a",
        productId: "prod_a",
        productName: "Notebook Pro",
        productDescription: "Equipamento corporativo",
        quantity: 3,
        unitPriceCents: 800000,
        totalPriceCents: 2400000
      },
      {
        id: "item_b",
        productId: null,
        productName: "Servico de implantacao",
        productDescription: null,
        quantity: 1,
        unitPriceCents: 300000,
        totalPriceCents: 300000
      }
    ]
  }
};

const revokedShare: PublicQuoteShare = {
  ...activeShare,
  status: "revoked",
  expiresAt: null,
  version: {
    ...activeShare.version,
    items: []
  }
};

describe("quotes/publicWorkbench", () => {
  it("formata moeda, data, label e tom de status", () => {
    expect(formatPublicQuoteCurrency(2700000, "BRL")).toContain("27.000,00");
    expect(formatPublicQuoteDate("2026-07-08T12:00:00.000Z")).toContain(
      "08/07/2026"
    );
    expect(getPublicQuoteStatusLabel("active")).toBe("Link ativo");
    expect(getPublicQuoteStatusLabel("expired")).toBe("Link expirado");
    expect(getPublicQuoteStatusLabel("revoked")).toBe("Link revogado");
    expect(getPublicQuoteStatusTone("active")).toBe("success");
    expect(getPublicQuoteStatusTone("expired")).toBe("warning");
    expect(getPublicQuoteStatusTone("revoked")).toBe("danger");
  });

  it("monta itens com participacao e insight", () => {
    expect(buildPublicQuoteItemViewModels(activeShare)).toEqual([
      {
        id: "item_a",
        productName: "Notebook Pro",
        description: "Equipamento corporativo",
        quantityLabel: "3 unidade(s)",
        unitPriceLabel: formatPublicQuoteCurrency(800000, "BRL"),
        totalPriceLabel: formatPublicQuoteCurrency(2400000, "BRL"),
        shareOfTotal: 2400000 / 2700000,
        shareLabel: "89% do total",
        insight: "Item concentra a maior parte do investimento."
      },
      {
        id: "item_b",
        productName: "Servico de implantacao",
        description: "Sem descricao adicional.",
        quantityLabel: "1 unidade(s)",
        unitPriceLabel: formatPublicQuoteCurrency(300000, "BRL"),
        totalPriceLabel: formatPublicQuoteCurrency(300000, "BRL"),
        shareOfTotal: 300000 / 2700000,
        shareLabel: "11% do total",
        insight: "Item complementar na composicao da proposta."
      }
    ]);
  });

  it("gera metricas publicas da proposta", () => {
    expect(buildPublicQuoteMetrics(activeShare)).toEqual([
      {
        key: "subtotal",
        label: "Subtotal",
        value: formatPublicQuoteCurrency(3000000, "BRL"),
        helper: "Soma original dos itens.",
        tone: "muted"
      },
      {
        key: "discount",
        label: "Desconto",
        value: formatPublicQuoteCurrency(300000, "BRL"),
        helper: "10% de desconto sobre o subtotal.",
        tone: "success"
      },
      {
        key: "total",
        label: "Total da proposta",
        value: formatPublicQuoteCurrency(2700000, "BRL"),
        helper: "Valor congelado nesta versao.",
        tone: "success"
      },
      {
        key: "average",
        label: "Media por unidade",
        value: formatPublicQuoteCurrency(675000, "BRL"),
        helper: "4 unidade(s) somadas.",
        tone: "muted"
      }
    ]);
  });

  it("monta narrativa ativa e indisponivel", () => {
    expect(buildPublicQuoteNarrative(activeShare)).toEqual({
      headline: "Proposta pronta para avaliacao",
      body: "Esta versao esta congelada para facilitar comparacao, aprovacao e impressao sem depender do workspace autenticado.",
      bullets: [
        "2 item(ns) compoem esta proposta.",
        "10% de desconto sobre o subtotal.",
        `Valido ate ${formatPublicQuoteDate(activeShare.expiresAt!)}.`
      ]
    });

    expect(buildPublicQuoteNarrative(revokedShare)).toEqual({
      headline: "Proposta indisponivel para decisao",
      body: "Este link nao esta ativo. Use-o apenas como referencia e solicite ao emissor uma nova versao compartilhada.",
      bullets: [
        "Link revogado pelo emissor.",
        "Valores permanecem visiveis apenas como snapshot historico.",
        "Novas negociacoes devem ocorrer por um link ativo."
      ]
    });
  });

  it("define acoes conforme disponibilidade do link", () => {
    expect(buildPublicQuoteActions(activeShare)).toEqual([
      {
        kind: "print",
        label: "Imprimir proposta",
        helper: "Gera uma copia limpa para arquivo ou assinatura.",
        tone: "muted",
        isEnabled: true
      },
      {
        kind: "copy",
        label: "Copiar link",
        helper: "Compartilhe o mesmo snapshot com outro decisor.",
        tone: "success",
        isEnabled: true
      },
      {
        kind: "contact",
        label: "Responder ao emissor",
        helper: "Use o canal comercial original para aprovar ou pedir ajuste.",
        tone: "muted",
        isEnabled: true
      }
    ]);

    expect(buildPublicQuoteActions(revokedShare)[1]).toMatchObject({
      kind: "copy",
      tone: "warning",
      isEnabled: false
    });
  });

  it("gera checklist de decisao para cliente", () => {
    expect(buildPublicQuoteChecklist(activeShare)).toEqual([
      {
        id: "status",
        label: "Link disponivel",
        description: "O link esta ativo para avaliacao.",
        isComplete: true,
        tone: "success"
      },
      {
        id: "items",
        label: "Itens conferidos",
        description: "2 item(ns) listados na proposta.",
        isComplete: true,
        tone: "success"
      },
      {
        id: "value",
        label: "Valor definido",
        description: `Total congelado em ${formatPublicQuoteCurrency(
          2700000,
          "BRL"
        )}.`,
        isComplete: true,
        tone: "success"
      },
      {
        id: "notes",
        label: "Observacoes",
        description: "Ha observacoes publicas para orientar a decisao.",
        isComplete: true,
        tone: "success"
      }
    ]);

    expect(buildPublicQuoteChecklist(revokedShare)).toEqual([
      expect.objectContaining({
        id: "status",
        isComplete: false,
        tone: "danger"
      }),
      expect.objectContaining({
        id: "items",
        isComplete: false,
        tone: "warning"
      }),
      expect.objectContaining({
        id: "value",
        isComplete: true,
        tone: "success"
      }),
      expect.objectContaining({
        id: "notes",
        isComplete: true,
        tone: "success"
      })
    ]);
  });

  it("gera resumo de impressao", () => {
    expect(buildPublicQuotePrintSummary(activeShare)).toEqual({
      title: "Resumo para impressao",
      lines: [
        "Cliente: Cliente Alpha",
        "Proposta: Proposta notebooks comerciais",
        "Versao: 2",
        "Status do link: Link ativo",
        "Itens: 2",
        "Unidades: 4",
        `Total: ${formatPublicQuoteCurrency(2700000, "BRL")}`,
        `Valido ate ${formatPublicQuoteDate(activeShare.expiresAt!)}.`
      ]
    });
  });

  it("gera notas de confianca do link publico", () => {
    expect(buildPublicQuoteTrustNotes(activeShare)).toEqual([
      {
        id: "snapshot",
        title: "Versao congelada",
        description:
          "Os valores exibidos pertencem exatamente a versao compartilhada neste link."
      },
      {
        id: "validity",
        title: "Validade do link",
        description: `Valido ate ${formatPublicQuoteDate(activeShare.expiresAt!)}.`
      },
      {
        id: "decision",
        title: "Canal de decisao",
        description:
          "Aprovacoes e ajustes devem ser confirmados pelo canal comercial original."
      }
    ]);
  });

  it("monta workbench completo da proposta publica", () => {
    expect(buildPublicQuoteWorkbench(activeShare)).toMatchObject({
      title: "Proposta notebooks comerciais",
      customerName: "Cliente Alpha",
      statusLabel: "Link ativo",
      statusTone: "success",
      versionLabel: "Versao 2 publicada",
      subtotalLabel: formatPublicQuoteCurrency(3000000, "BRL"),
      discountLabel: formatPublicQuoteCurrency(300000, "BRL"),
      totalLabel: formatPublicQuoteCurrency(2700000, "BRL"),
      itemCountLabel: "2 item(ns)",
      averageItemLabel: formatPublicQuoteCurrency(675000, "BRL"),
      discountImpactLabel: "10% de desconto sobre o subtotal.",
      itemViewModels: buildPublicQuoteItemViewModels(activeShare),
      narrative: buildPublicQuoteNarrative(activeShare),
      actions: buildPublicQuoteActions(activeShare),
      checklist: buildPublicQuoteChecklist(activeShare),
      printSummary: buildPublicQuotePrintSummary(activeShare),
      trustNotes: buildPublicQuoteTrustNotes(activeShare)
    });
  });
});
