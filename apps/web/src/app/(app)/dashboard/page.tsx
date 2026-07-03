"use client";

import { useEffect } from "react";
import { useAuthContext } from "@/components/auth/authProvider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/emptyState";
import { FeedbackBanner } from "@/components/ui/feedbackBanner";
import { PageHeader } from "@/components/ui/pageHeader";
import { StatCard } from "@/components/ui/statCard";
import { Surface } from "@/components/ui/surface";
import { useDashboard } from "@/hooks/useDashboard";

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

export default function DashboardPage() {
  const { accessToken } = useAuthContext();
  const { summary, isLoading, error, loadDashboardSummary } =
    useDashboard(accessToken);

  useEffect(() => {
    void loadDashboardSummary();
  }, [loadDashboardSummary]);

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
            </div>
          </Surface>
        </aside>
      </div>
    </div>
  );
}
