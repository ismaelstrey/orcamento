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
