import { describe, expect, it } from "vitest";
import { buildQuoteImportJsonWorkbench } from "./importWorkbench";

const validPayload = JSON.stringify({
  schemaVersion: "1.0",
  customerId: "cus_1",
  currency: "BRL",
  category: "notebooks",
  budgetMaxCents: 1200000,
  usageContext: "Equipe comercial",
  items: [
    {
      type: "notebook",
      model: "Notebook corporativo",
      quantity: 3
    }
  ]
});

describe("quotes/importWorkbench", () => {
  it("mantem estado vazio sem permitir importacao", () => {
    const workbench = buildQuoteImportJsonWorkbench({
      jsonText: "",
      isFromAi: false,
      customerCount: 2
    });

    expect(workbench.status).toBe("empty");
    expect(workbench.canSubmit).toBe(false);
    expect(workbench.preview.sourceLabel).toBe("Manual");
  });

  it("detecta sintaxe JSON invalida", () => {
    const workbench = buildQuoteImportJsonWorkbench({
      jsonText: "{invalid",
      isFromAi: false,
      customerCount: 2
    });

    expect(workbench.status).toBe("invalid_json");
    expect(workbench.tone).toBe("danger");
    expect(workbench.issues).toEqual([
      {
        path: "payload",
        message: "Corrija a sintaxe do JSON antes de importar."
      }
    ]);
  });

  it("mostra problemas de contrato quando JSON nao bate com schema", () => {
    const workbench = buildQuoteImportJsonWorkbench({
      jsonText: JSON.stringify({
        customerId: "",
        currency: "BRL",
        category: "notebooks",
        items: []
      }),
      isFromAi: true,
      customerCount: 2
    });

    expect(workbench.status).toBe("invalid_schema");
    expect(workbench.canSubmit).toBe(false);
    expect(workbench.preview.sourceLabel).toBe("Assistente IA");
    expect(workbench.issues.map((issue) => issue.path)).toEqual([
      "customerId",
      "schemaVersion",
      "items"
    ]);
  });

  it("resume payload valido para exibicao da aba", () => {
    const workbench = buildQuoteImportJsonWorkbench({
      jsonText: validPayload,
      isFromAi: true,
      customerCount: 4
    });

    expect(workbench.status).toBe("ready");
    expect(workbench.canSubmit).toBe(true);
    expect(workbench.preview).toEqual({
      customerId: "cus_1",
      category: "notebooks",
      currency: "BRL",
      budgetLabel: "R$ 12.000,00",
      itemCount: 1,
      itemSummary: "3x Notebook corporativo",
      sourceLabel: "Assistente IA"
    });
    expect(workbench.metrics.map((metric) => metric.label)).toEqual([
      "Tamanho",
      "Itens",
      "Avisos",
      "Clientes"
    ]);
  });
});
