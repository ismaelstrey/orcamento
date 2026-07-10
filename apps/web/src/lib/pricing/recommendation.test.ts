import { describe, expect, it } from "vitest";
import { buildQuotePricingRecommendation } from "./recommendation";

const products = [
  {
    id: "prod-1",
    name: "Notebook corporativo",
    basePriceCents: 300000,
    currency: "BRL"
  },
  {
    id: "prod-2",
    name: "Monitor 24",
    basePriceCents: 90000,
    currency: "BRL"
  }
];

describe("pricing/recommendation", () => {
  it("detecta economia potencial por linha do orcamento", () => {
    const summary = buildQuotePricingRecommendation({
      products,
      offers: [
        {
          id: "offer-1",
          productId: "prod-1",
          storeName: "Loja A",
          priceCents: 280000,
          currency: "BRL",
          observedAt: "2026-07-10"
        },
        {
          id: "offer-2",
          productId: "prod-1",
          storeName: "Loja B",
          priceCents: 260000,
          currency: "BRL",
          observedAt: "2026-07-10"
        },
        {
          id: "offer-3",
          productId: "prod-2",
          storeName: "Loja C",
          priceCents: 95000,
          currency: "BRL",
          observedAt: "2026-07-10"
        }
      ],
      lines: [
        {
          productId: "prod-1",
          quantity: 2,
          unitPriceCents: 300000,
          currency: "BRL"
        },
        {
          productId: "prod-2",
          quantity: 1,
          unitPriceCents: 90000,
          currency: "BRL"
        }
      ]
    });

    expect(summary).toMatchObject({
      tone: "warning",
      lineCount: 2,
      optimizedLines: 1,
      opportunityLines: 1,
      missingOfferLines: 0,
      totalCurrentCents: 690000,
      totalBestCents: 610000,
      potentialSavingCents: 80000,
      potentialSavingPercent: 12
    });
    expect(summary.lines[0]).toMatchObject({
      productName: "Notebook corporativo",
      savingCents: 80000,
      recommendedStoreName: "Loja B",
      status: "opportunity"
    });
  });

  it("marca perigo quando nenhuma linha tem oferta de referencia", () => {
    const summary = buildQuotePricingRecommendation({
      products,
      offers: [],
      lines: [
        {
          productId: "prod-1",
          quantity: 1,
          unitPriceCents: 300000,
          currency: "BRL"
        }
      ]
    });

    expect(summary.tone).toBe("danger");
    expect(summary.missingOfferLines).toBe(1);
    expect(summary.recommendations).toContain(
      "Adicionar ofertas manuais para produtos sem referencia externa."
    );
  });
});
