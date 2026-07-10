export interface ManualOffer {
  id: string;
  productId: string;
  storeName: string;
  priceCents: number;
  currency: string;
  observedAt: string;
  url?: string | null;
}

export interface PricingProductInput {
  id: string;
  name: string;
  basePriceCents: number;
  currency: string;
}

export interface PricingOfferViewModel {
  id: string;
  productName: string;
  storeName: string;
  priceLabel: string;
  savingLabel: string;
  savingPercent: number;
  isBestOffer: boolean;
  observedAt: string;
}

export interface PricingWorkbenchSummary {
  totalProducts: number;
  productsWithOffers: number;
  coveragePercent: number;
  bestOffer: PricingOfferViewModel | null;
  averageSavingPercent: number;
  recommendations: string[];
}

function formatCurrency(valueInCents: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency
  }).format(valueInCents / 100);
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildProductMap(products: PricingProductInput[]) {
  return new Map(products.map((product) => [product.id, product]));
}

export function buildPricingOfferViewModels(input: {
  products: PricingProductInput[];
  offers: ManualOffer[];
}): PricingOfferViewModel[] {
  const productMap = buildProductMap(input.products);
  const bestOfferByProduct = new Map<string, number>();

  for (const offer of input.offers) {
    const currentBest = bestOfferByProduct.get(offer.productId);

    if (currentBest === undefined || offer.priceCents < currentBest) {
      bestOfferByProduct.set(offer.productId, offer.priceCents);
    }
  }

  return input.offers
    .map((offer) => {
      const product = productMap.get(offer.productId);
      const basePriceCents = product?.basePriceCents ?? offer.priceCents;
      const savingCents = Math.max(0, basePriceCents - offer.priceCents);
      const savingPercent =
        basePriceCents > 0 ? clampPercent((savingCents / basePriceCents) * 100) : 0;

      return {
        id: offer.id,
        productName: product?.name ?? "Produto nao carregado",
        storeName: offer.storeName,
        priceLabel: formatCurrency(offer.priceCents, offer.currency),
        savingLabel:
          savingCents > 0
            ? `${formatCurrency(savingCents, offer.currency)} abaixo da base`
            : "Sem economia sobre a base",
        savingPercent,
        isBestOffer: bestOfferByProduct.get(offer.productId) === offer.priceCents,
        observedAt: offer.observedAt
      };
    })
    .sort((left, right) => right.savingPercent - left.savingPercent);
}

export function buildPricingWorkbenchSummary(input: {
  products: PricingProductInput[];
  offers: ManualOffer[];
}): PricingWorkbenchSummary {
  const viewModels = buildPricingOfferViewModels(input);
  const productIdsWithOffers = new Set(input.offers.map((offer) => offer.productId));
  const bestOffer = viewModels.find((offer) => offer.isBestOffer) ?? null;
  const averageSavingPercent =
    viewModels.length > 0
      ? clampPercent(
          viewModels.reduce((sum, offer) => sum + offer.savingPercent, 0) /
            viewModels.length
        )
      : 0;
  const coveragePercent =
    input.products.length > 0
      ? clampPercent((productIdsWithOffers.size / input.products.length) * 100)
      : 0;

  return {
    totalProducts: input.products.length,
    productsWithOffers: productIdsWithOffers.size,
    coveragePercent,
    bestOffer,
    averageSavingPercent,
    recommendations: [
      coveragePercent < 80
        ? "Adicionar ofertas manuais para os produtos mais usados em orcamentos."
        : "Cobertura de ofertas esta adequada para comparacao inicial.",
      averageSavingPercent > 0
        ? `Economia media detectada: ${averageSavingPercent}%.`
        : "Ainda nao ha economia detectada sobre preco base.",
      "Usar a melhor oferta como referencia comercial antes de automatizar coleta."
    ]
  };
}
