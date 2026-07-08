import { describe, expect, it } from "vitest";
import { createLocalQuoteDraftProvider } from "./localProvider";

describe("ai/localProvider", () => {
  it("prioriza dica de catalogo por categoria quando o briefing nao cita o nome exato", async () => {
    const provider = createLocalQuoteDraftProvider();

    const result = await provider.generateQuoteDraft({
      customerId: "cus_1",
      userText: "Preciso de dois notebooks para diretoria comercial.",
      currency: "BRL",
      catalogHints: [
        {
          productId: "prd_desktop",
          name: "Computador compacto",
          category: "desktops"
        },
        {
          productId: "prd_mobile",
          name: "Latitude 5440",
          category: "notebooks"
        }
      ]
    });

    expect(result.draft.category).toBe("notebooks");
    expect(result.draft.items).toEqual([
      expect.objectContaining({
        model: "Latitude 5440",
        quantity: 2,
        confidence: 0.72
      })
    ]);
  });

  it("gera multiplos itens quando o briefing combina com mais de uma pista", async () => {
    const provider = createLocalQuoteDraftProvider();

    const result = await provider.generateQuoteDraft({
      customerId: "cus_1",
      userText: "Preciso de tres notebooks e monitores para equipe comercial.",
      currency: "BRL",
      catalogHints: [
        {
          productId: "prd_notebook",
          name: "Latitude 5440",
          category: "notebooks"
        },
        {
          productId: "prd_monitor",
          name: "Monitor 24 polegadas",
          category: "monitores"
        },
        {
          productId: "prd_mouse",
          name: "Mouse sem fio",
          category: "perifericos"
        }
      ]
    });

    expect(result.draft.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "notebooks",
          model: "Latitude 5440",
          quantity: 3
        }),
        expect.objectContaining({
          type: "monitores",
          model: "Monitor 24 polegadas",
          quantity: 3
        })
      ])
    );
    expect(result.draft.items).toHaveLength(2);
    expect(result.draft.warnings).toContain(
      "Mais de um item foi sugerido pelo provider local; revise quantidades e compatibilidade."
    );
  });
});
