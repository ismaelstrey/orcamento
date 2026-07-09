import type { ShareLinkResponse } from "./schemas";

export type ShareLinkTone = "success" | "warning" | "danger" | "muted";

export interface ShareLinkViewModel {
  id: string;
  quoteVersionId: string;
  slug: string;
  url: string;
  status: ShareLinkResponse["status"];
  statusLabel: string;
  tone: ShareLinkTone;
  lifecycleLabel: string;
  expiresAtLabel: string;
  createdAtLabel: string;
  revokedAtLabel: string | null;
  canOpen: boolean;
  canCopy: boolean;
  canRevoke: boolean;
  actionHint: string;
}

export interface ShareLinkWorkbenchSummary {
  totalLinks: number;
  activeLinks: number;
  revokedLinks: number;
  expiredLinks: number;
  expiringSoonLinks: number;
  latestActiveLink: ShareLinkViewModel | null;
  riskTone: ShareLinkTone;
  headline: string;
  recommendations: string[];
}

export interface ShareLinkWorkbench {
  links: ShareLinkViewModel[];
  summary: ShareLinkWorkbenchSummary;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatRelativeDays(targetDate: Date, now: Date): string {
  const diffMs = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "expirado";
  }

  if (diffDays === 0) {
    return "expira hoje";
  }

  if (diffDays === 1) {
    return "expira amanha";
  }

  return `expira em ${diffDays} dias`;
}

export function getShareLinkStatusLabel(
  status: ShareLinkResponse["status"]
): string {
  if (status === "active") {
    return "Ativo";
  }

  if (status === "revoked") {
    return "Revogado";
  }

  return "Expirado";
}

export function buildShareLinkViewModel(
  shareLink: ShareLinkResponse,
  now = new Date()
): ShareLinkViewModel {
  const expiresAt = shareLink.expiresAt ? new Date(shareLink.expiresAt) : null;
  const isExpiringSoon =
    shareLink.status === "active" &&
    expiresAt !== null &&
    expiresAt.getTime() - now.getTime() <= 1000 * 60 * 60 * 24 * 3 &&
    expiresAt.getTime() >= now.getTime();
  const tone: ShareLinkTone =
    shareLink.status === "active"
      ? isExpiringSoon
        ? "warning"
        : "success"
      : shareLink.status === "expired"
        ? "warning"
        : "danger";

  return {
    id: shareLink.id,
    quoteVersionId: shareLink.quoteVersionId,
    slug: shareLink.slug,
    url: shareLink.url,
    status: shareLink.status,
    statusLabel: getShareLinkStatusLabel(shareLink.status),
    tone,
    lifecycleLabel:
      shareLink.status === "active"
        ? expiresAt
          ? formatRelativeDays(expiresAt, now)
          : "sem expiracao"
        : shareLink.status === "expired"
          ? "acesso encerrado"
          : "acesso revogado",
    expiresAtLabel: expiresAt ? formatDateTime(shareLink.expiresAt!) : "Sem expiracao",
    createdAtLabel: formatDateTime(shareLink.createdAt),
    revokedAtLabel: shareLink.revokedAt ? formatDateTime(shareLink.revokedAt) : null,
    canOpen: shareLink.status === "active",
    canCopy: shareLink.status === "active",
    canRevoke: shareLink.status === "active",
    actionHint:
      shareLink.status === "active"
        ? isExpiringSoon
          ? "Revise validade antes de reenviar ao cliente."
          : "Pode ser compartilhado com o cliente."
        : shareLink.status === "expired"
          ? "Crie um novo link para reabrir acesso publico."
          : "Link revogado; mantenha apenas para auditoria."
  };
}

function buildShareLinkRecommendations(input: {
  links: ShareLinkViewModel[];
  activeLinks: number;
  expiredLinks: number;
  revokedLinks: number;
  expiringSoonLinks: number;
}): string[] {
  const recommendations: string[] = [];

  if (input.links.length === 0) {
    recommendations.push(
      "Nenhum link publico foi criado; publique a versao atual apenas quando a proposta estiver pronta."
    );
  }

  if (input.activeLinks > 1) {
    recommendations.push(
      "Existem multiplos links ativos; mantenha somente os links que ainda fazem sentido comercial."
    );
  }

  if (input.expiringSoonLinks > 0) {
    recommendations.push(
      "Ha link perto do vencimento; confirme prazo antes de reenviar ao cliente."
    );
  }

  if (input.expiredLinks > 0 || input.revokedLinks > 0) {
    recommendations.push(
      "Links encerrados continuam visiveis para rastreabilidade e nao devem ser reutilizados."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Links publicos estao limpos e prontos para compartilhamento.");
  }

  return recommendations;
}

export function buildShareLinkWorkbench(
  shareLinks: ShareLinkResponse[],
  now = new Date()
): ShareLinkWorkbench {
  const links = shareLinks
    .slice()
    .sort(
      (leftLink, rightLink) =>
        new Date(rightLink.createdAt).getTime() -
        new Date(leftLink.createdAt).getTime()
    )
    .map((shareLink) => buildShareLinkViewModel(shareLink, now));
  const activeLinks = links.filter((link) => link.status === "active").length;
  const revokedLinks = links.filter((link) => link.status === "revoked").length;
  const expiredLinks = links.filter((link) => link.status === "expired").length;
  const expiringSoonLinks = links.filter(
    (link) => link.status === "active" && link.tone === "warning"
  ).length;
  const latestActiveLink = links.find((link) => link.status === "active") ?? null;
  const riskTone: ShareLinkTone =
    activeLinks === 0
      ? "muted"
      : activeLinks > 1 || expiringSoonLinks > 0
        ? "warning"
        : "success";

  return {
    links,
    summary: {
      totalLinks: links.length,
      activeLinks,
      revokedLinks,
      expiredLinks,
      expiringSoonLinks,
      latestActiveLink,
      riskTone,
      headline:
        activeLinks === 0
          ? "Nenhum acesso publico ativo"
          : activeLinks === 1
            ? "Um link publico ativo"
            : `${activeLinks} links publicos ativos`,
      recommendations: buildShareLinkRecommendations({
        links,
        activeLinks,
        revokedLinks,
        expiredLinks,
        expiringSoonLinks
      })
    }
  };
}
