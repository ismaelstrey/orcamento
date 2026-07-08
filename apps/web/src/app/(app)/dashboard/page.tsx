"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/components/auth/authProvider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/emptyState";
import { FeedbackBanner } from "@/components/ui/feedbackBanner";
import { PageHeader } from "@/components/ui/pageHeader";
import { StatCard } from "@/components/ui/statCard";
import { Surface } from "@/components/ui/surface";
import { useAudit } from "@/hooks/useAudit";
import { useDashboard } from "@/hooks/useDashboard";
import {
  auditDomainOptions,
  auditToneOptions,
  buildAuditCsvContent,
  buildAuditEventViewModels,
  buildAuditTimelineGroups,
  buildAuditWorkbenchSummary,
  buildAuditWorkbenchRecommendations,
  filterAuditEventViewModels,
  getDefaultAuditWorkbenchFilters,
  hasActiveAuditWorkbenchFilters,
  type AuditDomainFilter,
  type AuditToneFilter
} from "@/lib/audit/workbench";
import { classNames } from "@/lib/utils/classNames";

const metricCards = [
  {
    key: "totalQuotes",
    label: "Orçamentos totais",
    description: "Volume geral de orçamentos registrados no tenant."
  },
  {
    key: "quotesThisMonth",
    label: "Orçamentos no mês",
    description: "Iniciativas comerciais abertas no ciclo atual."
  },
  {
    key: "activeCustomers",
    label: "Clientes ativos",
    description: "Clientes disponíveis para montar novos orçamentos."
  },
  {
    key: "publishedLinks",
    label: "Links publicados",
    description: "Compartilhamentos públicos atualmente ativos."
  }
] as const;

const nextActions = [
  "Criar novo orçamento manual",
  "Importar JSON para draft revisável",
  "Gerar PDF da versão atual",
  "Publicar ou revogar link compartilhado"
];

/**
 * Formata contagens do dashboard para leitura rápida na interface.
 */
function formatMetric(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatCurrency(valueInCents: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency
  }).format(valueInCents / 100);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatStatus(value: "draft" | "published" | "archived"): string {
  if (value === "draft") {
    return "Draft";
  }

  if (value === "published") {
    return "Publicado";
  }

  return "Arquivado";
}

export default function DashboardPage() {
  const { accessToken, roles } = useAuthContext();
  const [auditFilters, setAuditFilters] = useState(getDefaultAuditWorkbenchFilters);
  const { summary, isLoading, error, loadDashboardSummary } =
    useDashboard(accessToken);
  const {
    events: auditEvents,
    isLoading: isLoadingAudit,
    error: auditError,
    loadRecentAuditEvents
  } = useAudit(accessToken);
  const canReadAudit = roles.some((role) => role === "owner" || role === "admin");
  const auditEventViewModels = useMemo(
    () => buildAuditEventViewModels(auditEvents),
    [auditEvents]
  );
  const filteredAuditEvents = useMemo(
    () => filterAuditEventViewModels(auditEventViewModels, auditFilters),
    [auditEventViewModels, auditFilters]
  );
  const auditWorkbenchSummary = useMemo(
    () =>
      buildAuditWorkbenchSummary({
        allEvents: auditEventViewModels,
        visibleEvents: filteredAuditEvents
      }),
    [auditEventViewModels, filteredAuditEvents]
  );
  const auditTimelineGroups = useMemo(
    () => buildAuditTimelineGroups(filteredAuditEvents),
    [filteredAuditEvents]
  );
  const auditRecommendations = useMemo(
    () =>
      buildAuditWorkbenchRecommendations({
        summary: auditWorkbenchSummary,
        filters: auditFilters
      }),
    [auditFilters, auditWorkbenchSummary]
  );
  const hasAuditFilters = hasActiveAuditWorkbenchFilters(auditFilters);

  function handleDownloadAuditCsv(): void {
    const csvContent = buildAuditCsvContent(filteredAuditEvents);
    const csvBlob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8"
    });
    const csvUrl = URL.createObjectURL(csvBlob);
    const downloadLink = document.createElement("a");

    downloadLink.href = csvUrl;
    downloadLink.download = "auditoria-recente.csv";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(csvUrl);
  }

  useEffect(() => {
    void loadDashboardSummary();
  }, [loadDashboardSummary]);

  useEffect(() => {
    if (!canReadAudit) {
      return;
    }

    void loadRecentAuditEvents();
  }, [canReadAudit, loadRecentAuditEvents]);

  return (
    <div className="grid gap-5">
      <PageHeader
        eyebrow="Dashboard"
        title="Visão operacional do tenant"
        description="Acompanhe o resumo da operação, identifique gargalos comerciais e use este painel como ponto de partida para clientes, catálogo e orçamentos."
        summary={
          <Surface as="div" variant="subtle" className="h-full p-5">
            <span className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--accent-strong)]/80">
              Situação
            </span>
            <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
              {isLoading
                ? "Sincronizando indicadores..."
                : "Resumo carregado do endpoint /api/v1/dashboard/summary"}
            </p>
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => void loadDashboardSummary()}
            >
              Atualizar resumo
            </Button>
          </Surface>
        }
      />

      {error ? (
        <FeedbackBanner
          title="Falha ao carregar"
          description={error}
          variant="error"
          action={
            <Button variant="secondary" onClick={() => void loadDashboardSummary()}>
              Tentar novamente
            </Button>
          }
        />
      ) : null}

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <section className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {metricCards.map((card) => (
              <StatCard
                key={card.key}
                label={card.label}
                value={isLoading || !summary ? "..." : formatMetric(summary[card.key])}
                description={card.description}
              />
            ))}
          </div>

          <Surface as="article" variant="default" className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--accent-strong)]/80">
                  Produtos mais usados
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground-strong)]">
                  Ranking da versão atual dos orçamentos
                </h2>
              </div>
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-1 text-xs text-[var(--muted)]">
                Top 5
              </span>
            </div>

            {isLoading ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-28 rounded-[1.4rem] border border-[var(--border)] bg-[var(--surface-secondary)]"
                  />
                ))}
              </div>
            ) : summary?.topProducts.length ? (
              <div className="mt-6 grid gap-3">
                {summary.topProducts.map((product, index) => (
                  <Surface
                    key={`${product.productId ?? product.productName}-${index}`}
                    as="article"
                    variant="subtle"
                    hoverable
                    className="p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <p className="text-base font-medium text-[var(--foreground-strong)]">
                          {product.productName}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                          {product.productId
                            ? `Produto vinculado ao catálogo: ${product.productId}`
                            : "Item manual sem vínculo com catálogo"}
                        </p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-2xl font-semibold text-[var(--accent)]">
                          {formatMetric(product.uses)}
                        </p>
                        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                          usos
                        </p>
                      </div>
                    </div>
                  </Surface>
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="Ainda não existem produtos suficientes para montar o ranking."
                  description="Crie orçamentos e versões para popular o dashboard com dados reais de uso."
                />
              </div>
            )}
          </Surface>

          <Surface as="article" variant="default" className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--accent-strong)]/80">
                  Orçamentos recentes
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground-strong)]">
                  Últimas movimentações comerciais
                </h2>
              </div>
              <Link
                href="/quotes"
                className="rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
              >
                Ver todos
              </Link>
            </div>

            {isLoading ? (
              <div className="mt-6 grid gap-3">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-24 rounded-[1.4rem] border border-[var(--border)] bg-[var(--surface-secondary)]"
                  />
                ))}
              </div>
            ) : summary?.recentQuotes.length ? (
              <div className="mt-6 grid gap-3">
                {summary.recentQuotes.map((quote) => (
                  <Link
                    key={quote.id}
                    href={`/quotes?quoteId=${quote.id}`}
                    className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--surface-secondary)] p-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--surface-secondary)]/80"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-base font-medium text-[var(--foreground-strong)]">
                          {quote.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                          {quote.customerName} | versão {quote.versionNumber} |{" "}
                          {formatDate(quote.updatedAt)}
                        </p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-base font-semibold text-[var(--accent)]">
                          {formatCurrency(quote.totalCents, quote.currency)}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                          {formatStatus(quote.status)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="Nenhum orçamento recente ainda."
                  description="Crie ou importe um orçamento para acompanhar as movimentações por aqui."
                />
              </div>
            )}
          </Surface>
        </section>

        <aside className="grid gap-5">
          <Surface as="article" variant="default" className="p-6">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--accent-strong)]/80">
              Próximas ações
            </p>
            <div className="mt-5 grid gap-3">
              {nextActions.map((action) => (
                <Surface
                  key={action}
                  as="div"
                  variant="subtle"
                  className="rounded-[1.3rem] p-4 text-sm leading-7 text-[var(--foreground)]"
                >
                  {action}
                </Surface>
              ))}
            </div>
          </Surface>

          <Surface as="article" variant="default" className="p-6">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--accent-strong)]/80">
              Leitura rápida
            </p>
            <div className="mt-5 grid gap-4">
              <Surface as="div" variant="subtle" className="rounded-[1.4rem] p-4">
                <p className="text-sm text-[var(--muted)]">Pressão comercial do mês</p>
                <p className="mt-2 text-xl font-semibold text-[var(--foreground-strong)]">
                  {summary
                    ? `${formatMetric(summary.quotesThisMonth)} orçamento(s) iniciado(s)`
                    : "Carregando..."}
                </p>
              </Surface>
              <Surface as="div" variant="subtle" className="rounded-[1.4rem] p-4">
                <p className="text-sm text-[var(--muted)]">Capacidade de distribuição</p>
                <p className="mt-2 text-xl font-semibold text-[var(--foreground-strong)]">
                  {summary
                    ? `${formatMetric(summary.publishedLinks)} link(s) público(s) ativo(s)`
                    : "Carregando..."}
                </p>
              </Surface>
              <Surface as="div" variant="subtle" className="rounded-[1.4rem] p-4">
                <p className="text-sm text-[var(--muted)]">Base de relacionamento</p>
                <p className="mt-2 text-xl font-semibold text-[var(--foreground-strong)]">
                  {summary
                    ? `${formatMetric(summary.activeCustomers)} cliente(s) disponível(is)`
                    : "Carregando..."}
                </p>
              </Surface>
              <Surface as="div" variant="subtle" className="rounded-[1.4rem] p-4">
                <p className="text-sm text-[var(--muted)]">Atividade do assistente IA</p>
                <p className="mt-2 text-xl font-semibold text-[var(--foreground-strong)]">
                  {summary
                    ? summary.aiActivity.totalAttemptsThisMonth > 0
                      ? `${formatMetric(summary.aiActivity.draftsThisMonth)} draft(s) no mes`
                      : "Sem tentativas no mes"
                    : "Carregando..."}
                </p>
                {summary ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {summary.aiActivity.totalAttemptsThisMonth > 0
                      ? `${formatMetric(summary.aiActivity.totalAttemptsThisMonth)} tentativa(s) | ${Math.round(
                          summary.aiActivity.successRate * 100
                        )}% sucesso`
                      : "Use o assistente em Orcamentos para iniciar medicoes."}
                  </p>
                ) : null}
                {summary?.aiActivity.failuresThisMonth ? (
                  <p className="mt-2 text-sm text-amber-200">
                    {formatMetric(summary.aiActivity.failuresThisMonth)} falha(s)
                    registrada(s)
                  </p>
                ) : null}
              </Surface>
            </div>
          </Surface>

          {canReadAudit ? (
            <Surface as="article" variant="default" className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--accent-strong)]/80">
                    Auditoria recente
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                    Ultimos eventos sensiveis registrados no tenant.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => void loadRecentAuditEvents()}
                  disabled={isLoadingAudit}
                >
                  Atualizar
                </Button>
              </div>

              {auditError ? (
                <div className="mt-4 rounded-[1.2rem] border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">
                  {auditError}
                </div>
              ) : null}

              <div className="mt-5 grid gap-4 rounded-[1.2rem] border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
                <div className="grid gap-3">
                  <label className="grid gap-2 text-sm text-[var(--muted)]">
                    <span>Buscar na auditoria</span>
                    <input
                      value={auditFilters.query}
                      onChange={(event) =>
                        setAuditFilters((currentFilters) => ({
                          ...currentFilters,
                          query: event.target.value
                        }))
                      }
                      className="rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50"
                      placeholder="Provider, slug, usuario, versao..."
                    />
                  </label>

                  <div className="grid gap-2">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                      Dominio
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {auditDomainOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setAuditFilters((currentFilters) => ({
                              ...currentFilters,
                              domain: option.value as AuditDomainFilter
                            }))
                          }
                          className={classNames(
                            "rounded-full border px-3 py-1.5 text-xs transition",
                            auditFilters.domain === option.value
                              ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]"
                              : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/30 hover:text-[var(--foreground)]"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                      Tom
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {auditToneOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setAuditFilters((currentFilters) => ({
                              ...currentFilters,
                              tone: option.value as AuditToneFilter
                            }))
                          }
                          className={classNames(
                            "rounded-full border px-3 py-1.5 text-xs transition",
                            auditFilters.tone === option.value
                              ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]"
                              : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/30 hover:text-[var(--foreground)]"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-2">
                  <span>
                    {formatMetric(auditWorkbenchSummary.visibleEvents)} de{" "}
                    {formatMetric(auditWorkbenchSummary.totalEvents)} evento(s)
                  </span>
                  <span>
                    IA {formatMetric(auditWorkbenchSummary.aiEvents)} | Links{" "}
                    {formatMetric(auditWorkbenchSummary.sharingEvents)} | Alertas{" "}
                    {formatMetric(auditWorkbenchSummary.warningEvents)}
                  </span>
                </div>

                {auditRecommendations.length ? (
                  <div className="grid gap-2 rounded-[1rem] border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                      Recomendações
                    </p>
                    <ul className="grid gap-2 text-sm leading-6 text-[var(--foreground)]">
                      {auditRecommendations.map((recommendation) => (
                        <li key={recommendation}>{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {hasAuditFilters ? (
                  <button
                    type="button"
                    onClick={() => setAuditFilters(getDefaultAuditWorkbenchFilters())}
                    className="w-fit rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)]/30 hover:text-[var(--foreground)]"
                  >
                    Limpar filtros
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleDownloadAuditCsv}
                  disabled={!filteredAuditEvents.length}
                  className="w-fit rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)]/30 hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Baixar CSV filtrado
                </button>
              </div>

              {isLoadingAudit ? (
                <div className="mt-5 grid gap-3">
                  {[0, 1, 2].map((item) => (
                    <div
                      key={item}
                      className="h-20 rounded-[1.2rem] border border-[var(--border)] bg-[var(--surface-secondary)]"
                    />
                  ))}
                </div>
              ) : filteredAuditEvents.length ? (
                <div className="mt-5 grid gap-4">
                  {auditTimelineGroups.map((group) => (
                    <div key={group.key} className="grid gap-3">
                      <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                        {group.label}
                      </p>
                      {group.events.map((event) => (
                        <Surface
                          key={event.id}
                          as="div"
                          variant="subtle"
                          className={classNames(
                            "rounded-[1.2rem] p-4",
                            event.tone === "success" &&
                              "border-[color:rgba(52,211,153,0.24)]",
                            event.tone === "warning" &&
                              "border-[color:rgba(250,204,21,0.24)]"
                          )}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="text-sm font-medium text-[var(--foreground-strong)]">
                              {event.actionLabel}
                            </p>
                            <span
                              className={classNames(
                                "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em]",
                                event.tone === "success"
                                  ? "border-emerald-300/20 text-emerald-200"
                                  : event.tone === "warning"
                                    ? "border-amber-300/20 text-amber-200"
                                    : "border-[var(--border)] text-[var(--muted)]"
                              )}
                            >
                              {event.entityLabel}
                            </span>
                          </div>
                          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                            {formatDate(event.createdAt)}
                          </p>
                          <p className="mt-2 truncate text-sm text-[var(--muted)]">
                            {event.actorLabel}
                          </p>
                          {event.insight ? (
                            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                              {event.insight}
                            </p>
                          ) : null}
                          {event.contextHref && event.contextLabel ? (
                            <Link
                              href={event.contextHref}
                              className="mt-3 inline-flex rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                            >
                              {event.contextLabel}
                            </Link>
                          ) : null}
                          {event.visiblePayloadSummary.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {event.visiblePayloadSummary.map((summaryItem) => (
                                <span
                                  key={summaryItem}
                                  className="rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-2.5 py-1 text-xs text-[var(--muted)]"
                                >
                                  {summaryItem}
                                </span>
                              ))}
                              {event.hiddenPayloadSummaryCount > 0 ? (
                                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-2.5 py-1 text-xs text-[var(--muted)]">
                                  +{event.hiddenPayloadSummaryCount} detalhe(s)
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </Surface>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5">
                  <EmptyState
                    title={
                      hasAuditFilters
                        ? "Nenhum evento encontrado para os filtros atuais."
                        : "Nenhum evento recente."
                    }
                    description={
                      hasAuditFilters
                        ? "Limpe os filtros ou ajuste a busca para ampliar a leitura."
                        : "Acoes sensiveis aparecerao aqui conforme o uso do tenant."
                    }
                  />
                </div>
              )}
            </Surface>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
