import { describe, expect, it } from "vitest";
import {
  buildPricingOfferViewModels,
  buildPricingWorkbenchSummary,
  type ManualOffer,
  type PricingProductInput
} from "./workbench";

const products: PricingProductInput[] = [
  {
    id: "prd_1",
    name: "Notebook Pro",
    basePriceCents: 500000,
    currency: "BRL"
  },
  {
    id: "prd_2",
    name: "Monitor 27",
    basePriceCents: 180000,
    currency: "BRL"
  }
];

const offers: ManualOffer[] = [
  {
    id: "off_1",
    productId: "prd_1",
    storeName: "Loja A",
    priceCents: 460000,
    currency: "BRL",
    observedAt: "2026-07-10T10:00:00.000Z"
  },
  {
    id: "off_2",
    productId: "prd_1",
    storeName: "Loja B",
    priceCents: 430000,
    currency: "BRL",
    observedAt: "2026-07-10T11:00:00.000Z"
  }
];

describe("pricing/workbench", () => {
  it("marca melhor oferta e calcula economia sobre preco base", () => {
    const viewModels = buildPricingOfferViewModels({ products, offers });

    expect(viewModels[0]).toMatchObject({
      id: "off_2",
      productName: "Notebook Pro",
      storeName: "Loja B",
      savingPercent: 14,
      isBestOffer: true
    });
    expect(viewModels[0]?.savingLabel).toContain("abaixo da base");
  });

  it("resume cobertura e recomendacoes da base de ofertas", () => {
    const summary = buildPricingWorkbenchSummary({ products, offers });

    expect(summary).toMatchObject({
      totalProducts: 2,
      productsWithOffers: 1,
      coveragePercent: 50,
      averageSavingPercent: 11
    });
    expect(summary.bestOffer?.id).toBe("off_2");
    expect(summary.recommendations[0]).toContain("Adicionar ofertas manuais");
  });
});
