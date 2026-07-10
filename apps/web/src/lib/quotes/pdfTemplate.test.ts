import { describe, expect, it } from "vitest";
import type { QuoteVersionResponse } from "./schemas";
import { renderQuotePdfTemplate } from "./pdfTemplate";

const version: QuoteVersionResponse = {
  id: "qv_1",
  versionNumber: 2,
  label: "Revisao final",
  currency: "BRL",
  subtotalCents: 260000,
  discountCents: 10000,
  totalCents: 250000,
  sourceType: "manual",
  createdAt: "2026-07-10T10:00:00.000Z",
  items: [
    {
      id: "item_1",
      productId: "prd_1",
      productName: "Notebook <script>",
      productDescription: "Uso executivo & garantia estendida",
      quantity: 2,
      unitPriceCents: 130000,
      totalPriceCents: 260000
    }
  ]
};

describe("quotes/pdfTemplate", () => {
  it("renderiza snapshot comercial com totais e metadados da versao", () => {
    const html = renderQuotePdfTemplate({
      quoteId: "quo_1",
      quoteTitle: "Proposta notebooks",
      customerName: "Cliente Alpha",
      publicNotes: "Validade de 7 dias.",
      issuedAt: "2026-07-10T11:00:00.000Z",
      version
    });

    expect(html).toContain("Proposta notebooks");
    expect(html).toContain("Cliente Alpha");
    expect(html).toContain("qv_1");
    expect(html).toContain("R$");
    expect(html).toContain("2.500,00");
    expect(html).toContain("Validade de 7 dias.");
    expect(html).toContain("Documento comercial derivado da vers");
  });

  it("escapa conteudo dinamico para reduzir risco de HTML injection", () => {
    const html = renderQuotePdfTemplate({
      quoteId: "quo_<unsafe>",
      quoteTitle: "Proposta <img />",
      customerName: "Cliente & Parceiro",
      publicNotes: "Aprovar \"sem atraso\"",
      issuedAt: "2026-07-10T11:00:00.000Z",
      version
    });

    expect(html).toContain("quo_&lt;unsafe&gt;");
    expect(html).toContain("Proposta &lt;img /&gt;");
    expect(html).toContain("Cliente &amp; Parceiro");
    expect(html).toContain("Notebook &lt;script&gt;");
    expect(html).toContain("Aprovar &quot;sem atraso&quot;");
    expect(html).not.toContain("<script>");
  });

  it("omite secao de observacoes quando nao ha notas publicas", () => {
    const html = renderQuotePdfTemplate({
      quoteId: "quo_1",
      quoteTitle: "Proposta sem notas",
      customerName: "Cliente Alpha",
      publicNotes: null,
      issuedAt: "2026-07-10T11:00:00.000Z",
      version
    });

    expect(html).not.toContain("<section class=\"notes\">");
  });
});
