import type { QuoteVersionResponse } from "./schemas";

interface RenderQuotePdfTemplateInput {
  quoteId: string;
  quoteTitle: string;
  customerName: string;
  publicNotes: string | null;
  issuedAt: string;
  version: QuoteVersionResponse;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCurrency(valueInCents: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency
  }).format(valueInCents / 100);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

/**
 * Monta um HTML estável e imprimível para representar a versão congelada do orçamento.
 */
export function renderQuotePdfTemplate(
  input: RenderQuotePdfTemplateInput
): string {
  const rows = input.version.items
    .map((item) => {
      const description = item.productDescription
        ? `<div class="item-description">${escapeHtml(item.productDescription)}</div>`
        : "";

      return `
        <tr>
          <td>
            <div class="item-name">${escapeHtml(item.productName)}</div>
            ${description}
          </td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${formatCurrency(item.unitPriceCents, input.version.currency)}</td>
          <td class="text-right">${formatCurrency(item.totalPriceCents, input.version.currency)}</td>
        </tr>
      `;
    })
    .join("");

  const notesSection = input.publicNotes
    ? `
      <section class="notes">
        <h2>Observações</h2>
        <p>${escapeHtml(input.publicNotes)}</p>
      </section>
    `
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.quoteTitle)} - PDF comercial</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Arial, Helvetica, sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 32px;
        color: #0f172a;
        background: #f8fafc;
      }

      .document {
        max-width: 960px;
        margin: 0 auto;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 32px;
        box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
      }

      .header {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        padding-bottom: 24px;
        border-bottom: 1px solid #e2e8f0;
      }

      .title {
        margin: 0 0 8px;
        font-size: 28px;
        line-height: 1.2;
      }

      .subtitle {
        margin: 0;
        color: #475569;
        font-size: 14px;
      }

      .meta {
        min-width: 240px;
        display: grid;
        gap: 8px;
        font-size: 14px;
      }

      .meta-label {
        display: block;
        color: #64748b;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .section {
        margin-top: 24px;
      }

      .section h2 {
        margin: 0 0 12px;
        font-size: 18px;
      }

      .customer-box,
      .totals,
      .notes {
        padding: 20px;
        border-radius: 12px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 12px;
      }

      th,
      td {
        padding: 14px 12px;
        border-bottom: 1px solid #e2e8f0;
        vertical-align: top;
        text-align: left;
      }

      th {
        color: #475569;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .text-right {
        text-align: right;
        white-space: nowrap;
      }

      .item-name {
        font-weight: 600;
      }

      .item-description {
        margin-top: 6px;
        color: #475569;
        font-size: 13px;
      }

      .totals-grid {
        display: grid;
        gap: 10px;
      }

      .total-row {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        font-size: 15px;
      }

      .total-row.final {
        font-size: 18px;
        font-weight: 700;
        padding-top: 10px;
        border-top: 1px solid #cbd5e1;
      }

      .footer {
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
        color: #64748b;
        font-size: 12px;
      }

      @media print {
        body {
          background: #ffffff;
          padding: 0;
        }

        .document {
          max-width: none;
          border: none;
          border-radius: 0;
          box-shadow: none;
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <main class="document">
      <header class="header">
        <div>
          <h1 class="title">${escapeHtml(input.quoteTitle)}</h1>
          <p class="subtitle">Proposta comercial gerada a partir de uma versão congelada do orçamento.</p>
        </div>
        <div class="meta">
          <div>
            <span class="meta-label">Orçamento</span>
            <span>${escapeHtml(input.quoteId)}</span>
          </div>
          <div>
            <span class="meta-label">Versão</span>
            <span>${input.version.versionNumber}</span>
          </div>
          <div>
            <span class="meta-label">Quote Version Id</span>
            <span>${escapeHtml(input.version.id)}</span>
          </div>
          <div>
            <span class="meta-label">Emitido em</span>
            <span>${formatDateTime(input.issuedAt)}</span>
          </div>
        </div>
      </header>

      <section class="section">
        <h2>Cliente</h2>
        <div class="customer-box">${escapeHtml(input.customerName)}</div>
      </section>

      <section class="section">
        <h2>Itens</h2>
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th class="text-right">Qtd.</th>
              <th class="text-right">Valor unitário</th>
              <th class="text-right">Valor total</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </section>

      <section class="section">
        <h2>Resumo financeiro</h2>
        <div class="totals">
          <div class="totals-grid">
            <div class="total-row">
              <span>Subtotal</span>
              <span>${formatCurrency(input.version.subtotalCents, input.version.currency)}</span>
            </div>
            <div class="total-row">
              <span>Desconto</span>
              <span>${formatCurrency(input.version.discountCents, input.version.currency)}</span>
            </div>
            <div class="total-row final">
              <span>Total</span>
              <span>${formatCurrency(input.version.totalCents, input.version.currency)}</span>
            </div>
          </div>
        </div>
      </section>

      ${notesSection}

      <footer class="footer">
        Documento comercial derivado da versão ${input.version.versionNumber} do orçamento. Alterações futuras no orçamento não mudam este snapshot.
      </footer>
    </main>
  </body>
</html>`;
}
