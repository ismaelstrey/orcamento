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
});
