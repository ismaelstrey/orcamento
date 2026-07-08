const auditActionLabels: Record<string, string> = {
  "ai.quote_draft.generate.success": "IA gerou draft de orçamento",
  "ai.quote_draft.generate.failure": "Falha ao gerar draft por IA",
  "auth.login.success": "Login realizado",
  "auth.login.failure": "Falha de login",
  "auth.logout.success": "Logout realizado",
  "quote.create": "Orçamento criado",
  "quote.import_json": "Orçamento importado por JSON",
  "quote.export_json": "Orçamento exportado em JSON",
  "quote.update": "Orçamento atualizado",
  "quote_pdf.generate": "PDF gerado",
  "quote_version.create": "Nova versão criada",
  "quote_share_link.create": "Link público criado",
  "quote_share_link.revoke": "Link público revogado"
};

const auditEntityLabels: Record<string, string> = {
  ai_quote_draft: "Assistente IA",
  auth: "Autenticação",
  quote: "Orçamento",
  quote_pdf: "PDF",
  quote_share_link: "Link público",
  quote_version: "Versão"
};

/**
 * Converte ações técnicas de auditoria em rótulos legíveis para a operação.
 */
export function formatAuditActionLabel(action: string): string {
  return (
    auditActionLabels[action] ??
    action
      .split(".")
      .map((part) => part.replace(/_/g, " "))
      .join(" / ")
  );
}

/**
 * Converte tipos técnicos de entidade auditada em categorias de leitura rápida.
 */
export function formatAuditEntityLabel(entityType: string): string {
  return auditEntityLabels[entityType] ?? entityType.replace(/_/g, " ");
}

/**
 * Classifica visualmente eventos recentes sem depender do texto exibido.
 */
export function getAuditActionTone(action: string): "info" | "success" | "warning" {
  if (action.endsWith(".success")) {
    return "success";
  }

  if (action.endsWith(".failure") || action.includes("revoke")) {
    return "warning";
  }

  return "info";
}

export function compactAuditPayloadSummary(
  payloadSummary: string[],
  visibleLimit = 6
): {
  visibleItems: string[];
  hiddenCount: number;
} {
  const normalizedLimit = Math.max(0, visibleLimit);

  return {
    visibleItems: payloadSummary.slice(0, normalizedLimit),
    hiddenCount: Math.max(payloadSummary.length - normalizedLimit, 0)
  };
}

function findPayloadSummaryValue(
  payloadSummary: string[],
  label: string
): string | null {
  const prefix = `${label}: `;
  const summaryItem = payloadSummary.find((item) => item.startsWith(prefix));

  return summaryItem ? summaryItem.slice(prefix.length) : null;
}

export function formatAuditEventInsight(input: {
  action: string;
  payloadSummary: string[];
}): string | null {
  if (input.action === "ai.quote_draft.generate.success") {
    const itemCount = findPayloadSummaryValue(
      input.payloadSummary,
      "Itens sugeridos"
    );
    const warningCount = findPayloadSummaryValue(input.payloadSummary, "Alertas");
    const confidenceAverage = findPayloadSummaryValue(
      input.payloadSummary,
      "Confianca media"
    );

    if (itemCount && warningCount && confidenceAverage) {
      return `${itemCount} item(ns), ${warningCount} alerta(s), ${confidenceAverage} de confianca media.`;
    }
  }

  if (input.action === "ai.quote_draft.generate.failure") {
    const errorCode = findPayloadSummaryValue(input.payloadSummary, "Erro");

    return errorCode
      ? `Falha controlada registrada: ${errorCode}.`
      : "Falha controlada registrada pelo assistente IA.";
  }

  if (input.action === "quote.import_json") {
    const warningCount = findPayloadSummaryValue(input.payloadSummary, "Alertas");
    const normalizedItemsCount = findPayloadSummaryValue(
      input.payloadSummary,
      "Itens normalizados"
    );

    if (normalizedItemsCount) {
      return `${normalizedItemsCount} item(ns) normalizado(s) para revisao${
        warningCount ? `, ${warningCount} alerta(s)` : ""
      }.`;
    }
  }

  if (
    input.action === "quote.create" &&
    input.payloadSummary.includes("Versão inicial registrada")
  ) {
    return "Orcamento criado com versao inicial registrada.";
  }

  if (input.action === "quote.export_json") {
    const versionNumber = findPayloadSummaryValue(input.payloadSummary, "Versao");

    return versionNumber
      ? `JSON exportado a partir da versao ${versionNumber}.`
      : "JSON do orcamento exportado.";
  }

  if (
    input.action === "quote_share_link.create" ||
    input.action === "quote_share_link.revoke"
  ) {
    const slug = findPayloadSummaryValue(input.payloadSummary, "Slug publico");

    if (slug) {
      return input.action === "quote_share_link.create"
        ? `Link publico ${slug} criado para compartilhamento.`
        : `Link publico ${slug} revogado.`;
    }
  }

  if (input.action === "quote_version.create") {
    const versionNumber = findPayloadSummaryValue(input.payloadSummary, "Versao");

    if (versionNumber) {
      return `Versao ${versionNumber} registrada para o orcamento.`;
    }
  }

  if (input.action === "quote_pdf.generate") {
    const versionNumber = findPayloadSummaryValue(input.payloadSummary, "Versao");

    return versionNumber
      ? `Documento gerado a partir da versao ${versionNumber}.`
      : "Documento comercial gerado.";
  }

  return null;
}
