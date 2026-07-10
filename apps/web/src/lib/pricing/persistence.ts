import type { PricingProductInput } from "./workbench";

export type PersistedOfferSource = "manual" | "imported" | "crawler_future";
export type PricingPersistenceTone = "success" | "warning" | "danger";

export interface PersistedPriceStoreInput {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface PersistedProductOfferInput {
  id: string;
  productId: string;
  storeId: string;
  priceCents: number;
  currency: string;
  source: PersistedOfferSource;
  observedAt: string;
  expiresAt?: string | null;
}

export interface PricingPersistenceSummary {
  tone: PricingPersistenceTone;
  score: number;
  storeCount: number;
  activeStoreCount: number;
  offerCount: number;
  freshOfferCount: number;
  productsWithPersistedOffers: number;
  coveragePercent: number;
  blockers: string[];
  warnings: string[];
  nextActions: string[];
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getTone(score: number): PricingPersistenceTone {
  if (score >= 85) {
    return "success";
  }

  if (score >= 60) {
    return "warning";
  }

  return "danger";
}

function hasDuplicateSlugs(stores: PersistedPriceStoreInput[]): boolean {
  const slugs = new Set<string>();

  for (const store of stores) {
    if (slugs.has(store.slug)) {
      return true;
    }

    slugs.add(store.slug);
  }

  return false;
}

function isFreshOffer(offer: PersistedProductOfferInput, now: Date): boolean {
  if (!offer.expiresAt) {
    return true;
  }

  return new Date(offer.expiresAt).getTime() >= now.getTime();
}

export function buildPricingPersistenceSummary(input: {
  products: PricingProductInput[];
  stores: PersistedPriceStoreInput[];
  offers: PersistedProductOfferInput[];
  now?: Date;
}): PricingPersistenceSummary {
  const now = input.now ?? new Date();
  const productById = new Map(input.products.map((product) => [product.id, product]));
  const storeById = new Map(input.stores.map((store) => [store.id, store]));
  const freshOffers = input.offers.filter((offer) => isFreshOffer(offer, now));
  const productsWithPersistedOffers = new Set(
    freshOffers
      .filter((offer) => productById.has(offer.productId))
      .map((offer) => offer.productId)
  ).size;
  const coveragePercent =
    input.products.length > 0
      ? clampPercent((productsWithPersistedOffers / input.products.length) * 100)
      : 0;
  const activeStoreCount = input.stores.filter((store) => store.isActive).length;
  const unknownProductOffers = input.offers.filter(
    (offer) => !productById.has(offer.productId)
  ).length;
  const unknownStoreOffers = input.offers.filter(
    (offer) => !storeById.has(offer.storeId)
  ).length;
  const currencyMismatches = input.offers.filter((offer) => {
    const product = productById.get(offer.productId);

    return product && product.currency.toUpperCase() !== offer.currency.toUpperCase();
  }).length;
  const blockers = [
    input.stores.length === 0 ? "Cadastrar pelo menos uma loja de preco." : null,
    input.offers.length === 0 ? "Cadastrar pelo menos uma oferta de produto." : null,
    hasDuplicateSlugs(input.stores)
      ? "Slugs de loja precisam ser unicos por tenant."
      : null,
    unknownProductOffers > 0
      ? "Existem ofertas vinculadas a produtos inexistentes no tenant."
      : null,
    unknownStoreOffers > 0
      ? "Existem ofertas vinculadas a lojas inexistentes no tenant."
      : null
  ].filter(Boolean) as string[];
  const warnings = [
    activeStoreCount === 0 ? "Nenhuma loja ativa para novas comparacoes." : null,
    coveragePercent < 80
      ? "Cobertura de ofertas persistidas ainda abaixo de 80% do catalogo."
      : null,
    currencyMismatches > 0
      ? "Ha ofertas com moeda diferente do produto vinculado."
      : null,
    freshOffers.length < input.offers.length
      ? "Ofertas expiradas foram ignoradas na cobertura ativa."
      : null
  ].filter(Boolean) as string[];
  let score = 25;

  if (input.stores.length > 0 && activeStoreCount > 0) {
    score += 20;
  }

  if (freshOffers.length > 0) {
    score += 20;
  }

  score += Math.min(coveragePercent, 30);

  if (currencyMismatches === 0) {
    score += 5;
  }

  const finalScore = clampPercent(score - blockers.length * 12 - warnings.length * 3);

  return {
    tone: getTone(finalScore),
    score: finalScore,
    storeCount: input.stores.length,
    activeStoreCount,
    offerCount: input.offers.length,
    freshOfferCount: freshOffers.length,
    productsWithPersistedOffers,
    coveragePercent,
    blockers,
    warnings,
    nextActions: [
      "Usar PriceStore e ProductOffer como fonte oficial para recomendacoes.",
      "Ignorar ofertas expiradas no calculo de melhor compra.",
      "Auditar importacoes futuras antes de substituir ofertas manuais."
    ]
  };
}
