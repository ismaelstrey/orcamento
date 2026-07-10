import { describe, expect, it } from "vitest";
import { buildPricingPersistenceSummary } from "./persistence";

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

describe("pricing/persistence", () => {
  it("aprova base persistida quando lojas, ofertas e cobertura estao coerentes", () => {
    const summary = buildPricingPersistenceSummary({
      products,
      now: new Date("2026-07-10T12:00:00.000Z"),
      stores: [
        {
          id: "store-1",
          name: "Distribuidor A",
          slug: "distribuidor-a",
          isActive: true
        },
        {
          id: "store-2",
          name: "Distribuidor B",
          slug: "distribuidor-b",
          isActive: true
        }
      ],
      offers: [
        {
          id: "offer-1",
          productId: "prod-1",
          storeId: "store-1",
          priceCents: 280000,
          currency: "BRL",
          source: "manual",
          observedAt: "2026-07-10T10:00:00.000Z",
          expiresAt: "2026-07-20T10:00:00.000Z"
        },
        {
          id: "offer-2",
          productId: "prod-2",
          storeId: "store-2",
          priceCents: 85000,
          currency: "BRL",
          source: "imported",
          observedAt: "2026-07-10T11:00:00.000Z"
        }
      ]
    });

    expect(summary).toMatchObject({
      tone: "success",
      score: 100,
      storeCount: 2,
      activeStoreCount: 2,
      offerCount: 2,
      freshOfferCount: 2,
      productsWithPersistedOffers: 2,
      coveragePercent: 100,
      blockers: [],
      warnings: []
    });
  });

  it("bloqueia base com loja duplicada e referencias quebradas", () => {
    const summary = buildPricingPersistenceSummary({
      products,
      now: new Date("2026-07-10T12:00:00.000Z"),
      stores: [
        {
          id: "store-1",
          name: "Loja A",
          slug: "loja",
          isActive: false
        },
        {
          id: "store-2",
          name: "Loja B",
          slug: "loja",
          isActive: false
        }
      ],
      offers: [
        {
          id: "offer-1",
          productId: "prod-x",
          storeId: "store-x",
          priceCents: 100000,
          currency: "USD",
          source: "manual",
          observedAt: "2026-07-01T10:00:00.000Z",
          expiresAt: "2026-07-02T10:00:00.000Z"
        }
      ]
    });

    expect(summary.tone).toBe("danger");
    expect(summary.blockers).toEqual([
      "Slugs de loja precisam ser unicos por tenant.",
      "Existem ofertas vinculadas a produtos inexistentes no tenant.",
      "Existem ofertas vinculadas a lojas inexistentes no tenant."
    ]);
    expect(summary.warnings).toEqual([
      "Nenhuma loja ativa para novas comparacoes.",
      "Cobertura de ofertas persistidas ainda abaixo de 80% do catalogo.",
      "Ofertas expiradas foram ignoradas na cobertura ativa."
    ]);
  });
});
