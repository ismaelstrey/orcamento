"use client";

import { useEffect } from "react";
import { useAuthContext } from "@/components/auth/authProvider";
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
      <header className="flex flex-col gap-5 rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.32em] text-sky-200">
            Dashboard
          </span>
          <h1 className="mt-4 text-4xl leading-tight tracking-tight text-white">
            Visão operacional do tenant
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Acompanhe o resumo da operação e use este painel como ponto de
            partida para os próximos módulos do fluxo comercial.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-slate-200">
          <span className="font-mono text-xs uppercase tracking-[0.24em] text-sky-200/80">
            Situação
          </span>
          <span>
            {isLoading
              ? "Sincronizando indicadores..."
              : "Resumo carregado do endpoint /api/v1/dashboard/summary"}
          </span>
          <button
            type="button"
            onClick={() => void loadDashboardSummary()}
            className="inline-flex w-fit rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-2 font-medium text-sky-100 transition hover:bg-sky-400/20"
          >
            Atualizar resumo
          </button>
        </div>
      </header>

      {error ? (
        <section className="rounded-[1.75rem] border border-rose-400/20 bg-rose-500/10 p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-rose-200/80">
            Falha ao carregar
          </p>
          <h2 className="mt-3 text-2xl text-white">
            Não foi possível abrir o dashboard.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-rose-100/80">
            {error}
          </p>
          <button
            type="button"
            onClick={() => void loadDashboardSummary()}
            className="mt-5 inline-flex rounded-full border border-rose-300/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Tentar novamente
          </button>
        </section>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
        <section className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((card) => (
              <article
                key={card.key}
                className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-5"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-sky-200/80">
                  {card.label}
                </p>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
                  {isLoading || !summary ? "..." : formatMetric(summary[card.key])}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  {card.description}
                </p>
              </article>
            ))}
          </div>

          <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
                  Produtos mais usados
                </p>
                <h2 className="mt-3 text-2xl text-white">
                  Ranking da versão atual dos orçamentos
                </h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--muted)]">
                Top 5
              </span>
            </div>

            {isLoading ? (
              <div className="mt-6 grid gap-3">
                {[0, 1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-18 rounded-2xl border border-white/10 bg-white/5 p-5"
                  />
                ))}
              </div>
            ) : summary?.topProducts.length ? (
              <div className="mt-6 grid gap-3">
                {summary.topProducts.map((product, index) => (
                  <div
                    key={`${product.productId ?? product.productName}-${index}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div>
                      <p className="text-base font-medium text-white">
                        {product.productName}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {product.productId
                          ? `Produto vinculado ao catálogo: ${product.productId}`
                          : "Item manual sem vínculo com catálogo"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-[var(--accent)]">
                        {formatMetric(product.uses)}
                      </p>
                      <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                        usos
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 p-6">
                <p className="text-base text-white">
                  Ainda não existem produtos suficientes para montar o ranking.
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Crie orçamentos e versões para popular o dashboard com dados
                  reais de uso.
                </p>
              </div>
            )}
          </article>
        </section>

        <aside className="grid gap-5">
          <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/40 p-6">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
              Próximas ações
            </p>
            <ul className="mt-5 space-y-3">
              {nextActions.map((action) => (
                <li
                  key={action}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-100"
                >
                  {action}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/40 p-6">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
              Leitura rápida
            </p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-[var(--muted)]">Pressão comercial do mês</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {summary
                    ? `${formatMetric(summary.quotesThisMonth)} orçamento(s) iniciado(s)`
                    : "Carregando..."}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-[var(--muted)]">Capacidade de distribuição</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {summary
                    ? `${formatMetric(summary.publishedLinks)} link(s) público(s) ativo(s)`
                    : "Carregando..."}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-[var(--muted)]">Base de relacionamento</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {summary
                    ? `${formatMetric(summary.activeCustomers)} cliente(s) disponível(is)`
                    : "Carregando..."}
                </p>
              </div>
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}
