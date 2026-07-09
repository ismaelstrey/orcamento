import type { PublicQuoteShare } from "./schemas";

export type PublicQuoteStatusTone = "success" | "warning" | "danger" | "muted";
export type PublicQuoteActionKind = "print" | "copy" | "contact";

export interface PublicQuoteMetric {
  key: string;
  label: string;
  value: string;
  helper: string;
  tone: PublicQuoteStatusTone;
}

export interface PublicQuoteItemViewModel {
  id: string;
  productName: string;
  description: string;
  quantityLabel: string;
  unitPriceLabel: string;
  totalPriceLabel: string;
  shareOfTotal: number;
  shareLabel: string;
  insight: string;
}

export interface PublicQuoteNarrative {
  headline: string;
  body: string;
  bullets: string[];
}

export interface PublicQuoteAction {
  kind: PublicQuoteActionKind;
  label: string;
  helper: string;
  tone: PublicQuoteStatusTone;
  isEnabled: boolean;
}

export interface PublicQuoteChecklistItem {
  id: string;
  label: string;
  description: string;
  isComplete: boolean;
  tone: PublicQuoteStatusTone;
}

export interface PublicQuotePrintSummary {
  title: string;
  lines: string[];
}

export interface PublicQuoteTrustNote {
  id: string;
  title: string;
  description: string;
}

export interface PublicQuoteWorkbench {
  title: string;
  customerName: string;
  statusLabel: string;
  statusTone: PublicQuoteStatusTone;
  versionLabel: string;
  generatedAtLabel: string;
  expirationLabel: string;
  subtotalLabel: string;
  discountLabel: string;
  totalLabel: string;
  itemCountLabel: string;
  averageItemLabel: string;
  discountImpactLabel: string;
  metrics: PublicQuoteMetric[];
  itemViewModels: PublicQuoteItemViewModel[];
  narrative: PublicQuoteNarrative;
  actions: PublicQuoteAction[];
  checklist: PublicQuoteChecklistItem[];
  printSummary: PublicQuotePrintSummary;
  trustNotes: PublicQuoteTrustNote[];
  footerNote: string;
}

export function formatPublicQuoteCurrency(
  valueInCents: number,
  currency: string
): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency
  }).format(valueInCents / 100);
}

export function formatPublicQuoteDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function getPublicQuoteStatusLabel(
  status: PublicQuoteShare["status"]
): string {
  if (status === "active") {
    return "Link ativo";
  }

  if (status === "expired") {
    return "Link expirado";
  }

  return "Link revogado";
}

export function getPublicQuoteStatusTone(
  status: PublicQuoteShare["status"]
): PublicQuoteStatusTone {
  if (status === "active") {
    return "success";
  }

  if (status === "expired") {
    return "warning";
  }

  return "danger";
}

function buildExpirationLabel(quoteShare: PublicQuoteShare): string {
  if (quoteShare.status === "revoked") {
    return "Link revogado pelo emissor.";
  }

  if (quoteShare.expiresAt) {
    return `Valido ate ${formatPublicQuoteDate(quoteShare.expiresAt)}.`;
  }

  return "Sem vencimento programado.";
}

function buildDiscountImpactLabel(quoteShare: PublicQuoteShare): string {
  if (quoteShare.version.discountCents <= 0) {
    return "Sem desconto aplicado.";
  }

  const percentage =
    quoteShare.version.subtotalCents > 0
      ? Math.round(
          (quoteShare.version.discountCents / quoteShare.version.subtotalCents) *
            100
        )
      : 0;

  return `${percentage}% de desconto sobre o subtotal.`;
}

function buildItemInsight(input: {
  itemTotalCents: number;
  quoteTotalCents: number;
  quantity: number;
}): string {
  if (input.quoteTotalCents <= 0) {
    return "Item sem participacao percentual porque a proposta esta zerada.";
  }

  const share = input.itemTotalCents / input.quoteTotalCents;

  if (share >= 0.5) {
    return "Item concentra a maior parte do investimento.";
  }

  if (input.quantity > 1) {
    return "Item com volume relevante para negociacao.";
  }

  return "Item complementar na composicao da proposta.";
}

export function buildPublicQuoteItemViewModels(
  quoteShare: PublicQuoteShare
): PublicQuoteItemViewModel[] {
  const quoteTotalCents = quoteShare.version.totalCents;

  return quoteShare.version.items.map((item) => {
    const shareOfTotal =
      quoteTotalCents > 0 ? item.totalPriceCents / quoteTotalCents : 0;

    return {
      id: item.id,
      productName: item.productName,
      description: item.productDescription ?? "Sem descricao adicional.",
      quantityLabel: `${item.quantity} unidade(s)`,
      unitPriceLabel: formatPublicQuoteCurrency(
        item.unitPriceCents,
        quoteShare.version.currency
      ),
      totalPriceLabel: formatPublicQuoteCurrency(
        item.totalPriceCents,
        quoteShare.version.currency
      ),
      shareOfTotal,
      shareLabel: `${Math.round(shareOfTotal * 100)}% do total`,
      insight: buildItemInsight({
        itemTotalCents: item.totalPriceCents,
        quoteTotalCents,
        quantity: item.quantity
      })
    };
  });
}

export function buildPublicQuoteMetrics(
  quoteShare: PublicQuoteShare
): PublicQuoteMetric[] {
  const itemQuantity = quoteShare.version.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const averageItemCents =
    itemQuantity > 0 ? Math.round(quoteShare.version.totalCents / itemQuantity) : 0;

  return [
    {
      key: "subtotal",
      label: "Subtotal",
      value: formatPublicQuoteCurrency(
        quoteShare.version.subtotalCents,
        quoteShare.version.currency
      ),
      helper: "Soma original dos itens.",
      tone: "muted"
    },
    {
      key: "discount",
      label: "Desconto",
      value: formatPublicQuoteCurrency(
        quoteShare.version.discountCents,
        quoteShare.version.currency
      ),
      helper: buildDiscountImpactLabel(quoteShare),
      tone: quoteShare.version.discountCents > 0 ? "success" : "muted"
    },
    {
      key: "total",
      label: "Total da proposta",
      value: formatPublicQuoteCurrency(
        quoteShare.version.totalCents,
        quoteShare.version.currency
      ),
      helper: "Valor congelado nesta versao.",
      tone: "success"
    },
    {
      key: "average",
      label: "Media por unidade",
      value: formatPublicQuoteCurrency(averageItemCents, quoteShare.version.currency),
      helper: `${itemQuantity} unidade(s) somadas.`,
      tone: "muted"
    }
  ];
}

export function buildPublicQuoteNarrative(
  quoteShare: PublicQuoteShare
): PublicQuoteNarrative {
  if (quoteShare.status !== "active") {
    return {
      headline: "Proposta indisponivel para decisao",
      body: "Este link nao esta ativo. Use-o apenas como referencia e solicite ao emissor uma nova versao compartilhada.",
      bullets: [
        buildExpirationLabel(quoteShare),
        "Valores permanecem visiveis apenas como snapshot historico.",
        "Novas negociacoes devem ocorrer por um link ativo."
      ]
    };
  }

  if (!quoteShare.version.items.length) {
    return {
      headline: "Proposta ativa sem itens",
      body: "O link esta ativo, mas a versao compartilhada nao possui itens publicos para avaliacao.",
      bullets: [
        "Solicite uma versao revisada com composicao comercial.",
        buildExpirationLabel(quoteShare),
        "Confira observacoes publicas antes de aprovar."
      ]
    };
  }

  return {
    headline: "Proposta pronta para avaliacao",
    body: "Esta versao esta congelada para facilitar comparacao, aprovacao e impressao sem depender do workspace autenticado.",
    bullets: [
      `${quoteShare.version.items.length} item(ns) compoem esta proposta.`,
      buildDiscountImpactLabel(quoteShare),
      buildExpirationLabel(quoteShare)
    ]
  };
}

export function buildPublicQuoteActions(
  quoteShare: PublicQuoteShare
): PublicQuoteAction[] {
  const isActive = quoteShare.status === "active";

  return [
    {
      kind: "print",
      label: "Imprimir proposta",
      helper: "Gera uma copia limpa para arquivo ou assinatura.",
      tone: "muted",
      isEnabled: Boolean(quoteShare.version.items.length)
    },
    {
      kind: "copy",
      label: "Copiar link",
      helper: "Compartilhe o mesmo snapshot com outro decisor.",
      tone: isActive ? "success" : "warning",
      isEnabled: isActive
    },
    {
      kind: "contact",
      label: "Responder ao emissor",
      helper: "Use o canal comercial original para aprovar ou pedir ajuste.",
      tone: "muted",
      isEnabled: true
    }
  ];
}

export function buildPublicQuoteChecklist(
  quoteShare: PublicQuoteShare
): PublicQuoteChecklistItem[] {
  const hasItems = quoteShare.version.items.length > 0;
  const hasTotal = quoteShare.version.totalCents > 0;
  const hasPublicNotes = Boolean(quoteShare.quote.publicNotes?.trim());
  const isActive = quoteShare.status === "active";

  return [
    {
      id: "status",
      label: "Link disponivel",
      description: isActive
        ? "O link esta ativo para avaliacao."
        : "Solicite um novo link ativo antes de aprovar.",
      isComplete: isActive,
      tone: isActive ? "success" : "danger"
    },
    {
      id: "items",
      label: "Itens conferidos",
      description: hasItems
        ? `${quoteShare.version.items.length} item(ns) listados na proposta.`
        : "A proposta nao possui itens publicos.",
      isComplete: hasItems,
      tone: hasItems ? "success" : "warning"
    },
    {
      id: "value",
      label: "Valor definido",
      description: hasTotal
        ? `Total congelado em ${formatPublicQuoteCurrency(
            quoteShare.version.totalCents,
            quoteShare.version.currency
          )}.`
        : "O total esta zerado e precisa de revisao.",
      isComplete: hasTotal,
      tone: hasTotal ? "success" : "warning"
    },
    {
      id: "notes",
      label: "Observacoes",
      description: hasPublicNotes
        ? "Ha observacoes publicas para orientar a decisao."
        : "Sem observacoes publicas adicionais.",
      isComplete: hasPublicNotes,
      tone: hasPublicNotes ? "success" : "muted"
    }
  ];
}

export function buildPublicQuotePrintSummary(
  quoteShare: PublicQuoteShare
): PublicQuotePrintSummary {
  const quantity = quoteShare.version.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return {
    title: "Resumo para impressao",
    lines: [
      `Cliente: ${quoteShare.quote.customerName}`,
      `Proposta: ${quoteShare.quote.title}`,
      `Versao: ${quoteShare.version.versionNumber}`,
      `Status do link: ${getPublicQuoteStatusLabel(quoteShare.status)}`,
      `Itens: ${quoteShare.version.items.length}`,
      `Unidades: ${quantity}`,
      `Total: ${formatPublicQuoteCurrency(
        quoteShare.version.totalCents,
        quoteShare.version.currency
      )}`,
      buildExpirationLabel(quoteShare)
    ]
  };
}

export function buildPublicQuoteTrustNotes(
  quoteShare: PublicQuoteShare
): PublicQuoteTrustNote[] {
  return [
    {
      id: "snapshot",
      title: "Versao congelada",
      description:
        "Os valores exibidos pertencem exatamente a versao compartilhada neste link."
    },
    {
      id: "validity",
      title: "Validade do link",
      description: buildExpirationLabel(quoteShare)
    },
    {
      id: "decision",
      title: "Canal de decisao",
      description:
        "Aprovacoes e ajustes devem ser confirmados pelo canal comercial original."
    }
  ];
}

export function buildPublicQuoteWorkbench(
  quoteShare: PublicQuoteShare
): PublicQuoteWorkbench {
  const itemQuantity = quoteShare.version.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const averageItemCents =
    itemQuantity > 0 ? Math.round(quoteShare.version.totalCents / itemQuantity) : 0;

  return {
    title: quoteShare.quote.title,
    customerName: quoteShare.quote.customerName,
    statusLabel: getPublicQuoteStatusLabel(quoteShare.status),
    statusTone: getPublicQuoteStatusTone(quoteShare.status),
    versionLabel: `Versao ${quoteShare.version.versionNumber} publicada`,
    generatedAtLabel: `Gerado em ${formatPublicQuoteDate(
      quoteShare.version.createdAt
    )}`,
    expirationLabel: buildExpirationLabel(quoteShare),
    subtotalLabel: formatPublicQuoteCurrency(
      quoteShare.version.subtotalCents,
      quoteShare.version.currency
    ),
    discountLabel: formatPublicQuoteCurrency(
      quoteShare.version.discountCents,
      quoteShare.version.currency
    ),
    totalLabel: formatPublicQuoteCurrency(
      quoteShare.version.totalCents,
      quoteShare.version.currency
    ),
    itemCountLabel: `${quoteShare.version.items.length} item(ns)`,
    averageItemLabel: formatPublicQuoteCurrency(
      averageItemCents,
      quoteShare.version.currency
    ),
    discountImpactLabel: buildDiscountImpactLabel(quoteShare),
    metrics: buildPublicQuoteMetrics(quoteShare),
    itemViewModels: buildPublicQuoteItemViewModels(quoteShare),
    narrative: buildPublicQuoteNarrative(quoteShare),
    actions: buildPublicQuoteActions(quoteShare),
    checklist: buildPublicQuoteChecklist(quoteShare),
    printSummary: buildPublicQuotePrintSummary(quoteShare),
    trustNotes: buildPublicQuoteTrustNotes(quoteShare),
    footerNote:
      "Documento derivado de uma versao congelada. Alteracoes futuras no orcamento nao modificam este snapshot."
  };
}
