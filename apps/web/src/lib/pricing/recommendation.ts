import type { ManualOffer, PricingProductInput } from "./workbench";

export type PricingRecommendationTone = "success" | "warning" | "danger";

export interface QuotePricingLineInput {
  productId: string;
  quantity: number;
  unitPriceCents: number;
  currency: string;
}

export interface QuotePricingLineRecommendation {
  productId: string;
  productName: string;
  quantity: number;
  currentUnitPriceCents: number;
  bestUnitPriceCents: number | null;
  savingCents: number;
  savingPercent: number;
  recommendedStoreName: string | null;
  status: "optimized" | "opportunity" | "missing_offer";
}

export interface QuotePricingRecommendationSummary {
  tone: PricingRecommendationTone;
  lineCount: number;
  optimizedLines: number;
  opportunityLines: number;
  missingOfferLines: number;
  totalCurrentCents: number;
  totalBestCents: number;
  potentialSavingCents: number;
  potentialSavingPercent: number;
  lines: QuotePricingLineRecommendation[];
  recommendations: string[];
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getTone(summary: Pick<QuotePricingRecommendationSummary, "lineCount" | "opportunityLines" | "missingOfferLines">): PricingRecommendationTone {
  if (summary.lineCount === 0 || summary.missingOfferLines === summary.lineCount) {
    return "danger";
  }

  if (summary.opportunityLines > 0 || summary.missingOfferLines > 0) {
    return "warning";
  }

  return "success";
}

function buildBestOfferMap(offers: ManualOffer[]): Map<string, ManualOffer> {
  const bestByProduct = new Map<string, ManualOffer>();

  for (const offer of offers) {
    const current = bestByProduct.get(offer.productId);

    if (!current || offer.priceCents < current.priceCents) {
      bestByProduct.set(offer.productId, offer);
    }
  }

  return bestByProduct;
}

export function buildQuotePricingRecommendation(input: {
  products: PricingProductInput[];
  offers: ManualOffer[];
  lines: QuotePricingLineInput[];
}): QuotePricingRecommendationSummary {
  const productById = new Map(input.products.map((product) => [product.id, product]));
  const bestOfferByProduct = buildBestOfferMap(input.offers);
  const lines = input.lines.map((line) => {
    const product = productById.get(line.productId);
    const bestOffer = bestOfferByProduct.get(line.productId) ?? null;
    const bestUnitPriceCents = bestOffer?.priceCents ?? null;
    const unitSavingCents =
      bestUnitPriceCents === null
        ? 0
        : Math.max(0, line.unitPriceCents - bestUnitPriceCents);
    const savingCents = unitSavingCents * line.quantity;
    const savingPercent =
      line.unitPriceCents > 0
        ? clampPercent((unitSavingCents / line.unitPriceCents) * 100)
        : 0;
    const status: QuotePricingLineRecommendation["status"] =
      bestUnitPriceCents === null
        ? "missing_offer"
        : savingCents > 0
          ? "opportunity"
          : "optimized";

    return {
      productId: line.productId,
      productName: product?.name ?? "Produto nao carregado",
      quantity: line.quantity,
      currentUnitPriceCents: line.unitPriceCents,
      bestUnitPriceCents,
      savingCents,
      savingPercent,
      recommendedStoreName: bestOffer?.storeName ?? null,
      status
    };
  });
  const totalCurrentCents = input.lines.reduce(
    (sum, line) => sum + line.unitPriceCents * line.quantity,
    0
  );
  const totalBestCents = lines.reduce((sum, line) => {
    const bestUnit =
      line.bestUnitPriceCents === null
        ? line.currentUnitPriceCents
        : Math.min(line.currentUnitPriceCents, line.bestUnitPriceCents);

    return sum + bestUnit * line.quantity;
  }, 0);
  const potentialSavingCents = Math.max(0, totalCurrentCents - totalBestCents);
  const potentialSavingPercent =
    totalCurrentCents > 0
      ? clampPercent((potentialSavingCents / totalCurrentCents) * 100)
      : 0;
  const optimizedLines = lines.filter((line) => line.status === "optimized").length;
  const opportunityLines = lines.filter(
    (line) => line.status === "opportunity"
  ).length;
  const missingOfferLines = lines.filter(
    (line) => line.status === "missing_offer"
  ).length;
  const tone = getTone({
    lineCount: lines.length,
    opportunityLines,
    missingOfferLines
  });

  return {
    tone,
    lineCount: lines.length,
    optimizedLines,
    opportunityLines,
    missingOfferLines,
    totalCurrentCents,
    totalBestCents,
    potentialSavingCents,
    potentialSavingPercent,
    lines,
    recommendations: [
      opportunityLines > 0
        ? "Revisar itens com oportunidade antes de enviar a proposta."
        : "Linhas com oferta conhecida ja estao otimizadas.",
      missingOfferLines > 0
        ? "Adicionar ofertas manuais para produtos sem referencia externa."
        : "Todas as linhas possuem referencia de oferta.",
      potentialSavingCents > 0
        ? `Economia potencial de ${potentialSavingPercent}% sobre o total atual.`
        : "Nenhuma economia adicional foi detectada."
    ]
  };
}
