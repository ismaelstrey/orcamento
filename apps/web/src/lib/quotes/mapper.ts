import type {
  Quote,
  QuoteItem,
  QuoteShareLink,
  QuoteVersion
} from "@prisma/client";

type QuoteVersionWithItems = QuoteVersion & {
  items: QuoteItem[];
};

type QuoteWithVersions = Quote & {
  versions: QuoteVersionWithItems[];
};

export function mapQuoteVersionResponse(version: QuoteVersionWithItems) {
  return {
    id: version.id,
    versionNumber: version.versionNumber,
    label: version.label,
    currency: version.currency,
    subtotalCents: version.subtotalCents,
    discountCents: version.discountCents,
    totalCents: version.totalCents,
    sourceType: version.sourceType,
    createdAt: version.createdAt.toISOString(),
    items: version.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productDescription: item.productDescription,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalPriceCents: item.totalPriceCents
    }))
  };
}

/**
 * Mapeia um orçamento com a versão mais recente usada como resumo atual.
 */
export function mapQuoteSummaryResponse(quote: QuoteWithVersions) {
  const currentVersion = [...quote.versions].sort(
    (leftVersion, rightVersion) =>
      rightVersion.versionNumber - leftVersion.versionNumber
  )[0];

  if (!currentVersion) {
    throw new Error("Quote sem versão associada.");
  }

  return {
    id: quote.id,
    customerId: quote.customerId,
    title: quote.title,
    status: quote.status,
    publicNotes: quote.publicNotes,
    internalNotes: quote.internalNotes,
    createdAt: quote.createdAt.toISOString(),
    updatedAt: quote.updatedAt.toISOString(),
    currentVersion: {
      id: currentVersion.id,
      versionNumber: currentVersion.versionNumber,
      subtotalCents: currentVersion.subtotalCents,
      discountCents: currentVersion.discountCents,
      totalCents: currentVersion.totalCents,
      currency: currentVersion.currency
    }
  };
}

/**
 * Retorna o orçamento completo com o histórico de versões carregado.
 */
export function mapQuoteDetailResponse(quote: QuoteWithVersions) {
  const orderedVersions = [...quote.versions].sort(
    (leftVersion, rightVersion) =>
      rightVersion.versionNumber - leftVersion.versionNumber
  );

  return {
    ...mapQuoteSummaryResponse(quote),
    versions: orderedVersions.map(mapQuoteVersionResponse)
  };
}

/**
 * Normaliza um share link para o contrato HTTP privado.
 */
export function mapShareLinkResponse(
  shareLink: QuoteShareLink,
  publicUrl: string
) {
  return {
    id: shareLink.id,
    quoteId: shareLink.quoteId,
    quoteVersionId: shareLink.quoteVersionId,
    slug: shareLink.slug,
    url: publicUrl,
    status: shareLink.status,
    expiresAt: shareLink.expiresAt?.toISOString() ?? null,
    revokedAt: shareLink.revokedAt?.toISOString() ?? null,
    createdAt: shareLink.createdAt.toISOString(),
    updatedAt: shareLink.updatedAt.toISOString()
  };
}
