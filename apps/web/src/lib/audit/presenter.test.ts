import { describe, expect, it } from "vitest";
import {
  formatAuditActionLabel,
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
});
