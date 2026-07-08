import { describe, expect, it } from "vitest";
import {
  compactAuditPayloadSummary,
  formatAuditActionLabel,
  formatAuditEventInsight,
  formatAuditEntityLabel,
  getAuditActionTone
} from "./presenter";

describe("audit/presenter", () => {
  it("formata eventos de IA com linguagem operacional", () => {
    expect(formatAuditActionLabel("ai.quote_draft.generate.success")).toBe(
      "IA gerou draft de orçamento"
    );
    expect(formatAuditActionLabel("ai.quote_draft.generate.failure")).toBe(
      "Falha ao gerar draft por IA"
    );
    expect(formatAuditEntityLabel("ai_quote_draft")).toBe("Assistente IA");
  });

  it("mantem fallback legivel para eventos ainda nao mapeados", () => {
    expect(formatAuditActionLabel("custom_event.test_action")).toBe(
      "custom event / test action"
    );
    expect(formatAuditEntityLabel("custom_entity")).toBe("custom entity");
  });

  it("classifica tom visual sem depender do label", () => {
    expect(getAuditActionTone("ai.quote_draft.generate.success")).toBe("success");
    expect(getAuditActionTone("ai.quote_draft.generate.failure")).toBe("warning");
    expect(getAuditActionTone("quote.create")).toBe("info");
  });

  it("compacta detalhes de payload para leitura rapida", () => {
    expect(
      compactAuditPayloadSummary(
        ["Provider", "Prompt", "Schema", "Modelo", "Tokens", "Custo", "Duracao"],
        4
      )
    ).toEqual({
      visibleItems: ["Provider", "Prompt", "Schema", "Modelo"],
      hiddenCount: 3
    });
  });

  it("resume eventos operacionais com frase curta quando ha metadados suficientes", () => {
    expect(
      formatAuditEventInsight({
        action: "ai.quote_draft.generate.success",
        payloadSummary: [
          "Provider: local-deterministic",
          "Itens sugeridos: 2",
          "Confianca media: 76%",
          "Alertas: 1"
        ]
      })
    ).toBe("2 item(ns), 1 alerta(s), 76% de confianca media.");

    expect(
      formatAuditEventInsight({
        action: "ai.quote_draft.generate.failure",
        payloadSummary: ["Erro: provider_error"]
      })
    ).toBe("Falha controlada registrada: provider_error.");

    expect(
      formatAuditEventInsight({
        action: "quote.create",
        payloadSummary: ["Versão inicial registrada"]
      })
    ).toBe("Orcamento criado com versao inicial registrada.");

    expect(
      formatAuditEventInsight({
        action: "quote.export_json",
        payloadSummary: ["Orcamento: quo_1", "Versao: 2"]
      })
    ).toBe("JSON exportado a partir da versao 2.");

    expect(
      formatAuditEventInsight({
        action: "quote_share_link.create",
        payloadSummary: ["Slug publico: q_publico"]
      })
    ).toBe("Link publico q_publico criado para compartilhamento.");

    expect(
      formatAuditEventInsight({
        action: "quote_share_link.revoke",
        payloadSummary: ["Slug publico: q_publico"]
      })
    ).toBe("Link publico q_publico revogado.");

    expect(
      formatAuditEventInsight({
        action: "quote_version.create",
        payloadSummary: ["Versao: 3"]
      })
    ).toBe("Versao 3 registrada para o orcamento.");

    expect(
      formatAuditEventInsight({
        action: "quote_pdf.generate",
        payloadSummary: ["Versao: 2"]
      })
    ).toBe("Documento gerado a partir da versao 2.");
  });

  it("omite insight quando evento ainda nao tem regra de resumo", () => {
    expect(
      formatAuditEventInsight({
        action: "quote.update",
        payloadSummary: []
      })
    ).toBeNull();
  });
});
