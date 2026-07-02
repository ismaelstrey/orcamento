"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";

const metricCards = [
  {
    key: "totalQuotes",
    label: "Orçamentos totais",
    description: "Volume geral de orçamentos do tenant."
  },
  {
    key: "quotesThisMonth",
    label: "Orçamentos no mês",
    description: "Produção comercial aberta no mês atual."
  },
  {
    key: "activeCustomers",
    label: "Clientes ativos",
    description: "Clientes já cadastrados para uso nos fluxos."
  },
  {
    key: "publishedLinks",
    label: "Links publicados",
    description: "Compartilhamentos públicos ativos neste momento."
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

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const {
    accessToken,
    user,
    tenant,
    roles,
    isAuthenticated,
    isBootstrapping,
    isSubmitting,
    error: authError,
    login,
    logout
  } = useAuth();
  const { summary, isLoading, error, loadDashboardSummary } =
    useDashboard(accessToken);

  const roleLabel = useMemo(() => roles.join(", "), [roles]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void loadDashboardSummary();
  }, [isAuthenticated, loadDashboardSummary]);

  /**
   * Realiza o login do frontend antes de liberar os dados privados do dashboard.
   */
  async function handleLoginSubmit(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    try {
      await login(email.trim(), password);
      setPassword("");
    } catch {
      // O erro já fica refletido no estado do hook.
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10 md:px-8 md:py-12">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(125,211,252,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />

      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 rounded-[2rem] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[0_40px_120px_rgba(2,6,23,0.55)] backdrop-blur md:p-8">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.32em] text-sky-200">
              Dashboard MVP
            </span>
            <h1 className="mt-4 text-4xl leading-tight tracking-tight text-white md:text-5xl">
              Visão operacional do
              <span className="text-[var(--accent)]"> Intelligent Quote Platform</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] md:text-base">
              A página inicial agora mostra o resumo do tenant, os principais
              indicadores comerciais e os produtos mais usados nas versões
              atuais dos orçamentos.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-slate-200">
            <span className="font-mono text-xs uppercase tracking-[0.24em] text-sky-200/80">
              Situação
            </span>
            <span>
              {isBootstrapping
                ? "Restaurando sessão do navegador..."
                : isAuthenticated
                  ? isLoading
                    ? "Sincronizando indicadores..."
                    : "Resumo carregado do endpoint /api/v1/dashboard/summary"
                  : "Faça login para acessar os dados privados do dashboard."}
            </span>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => void loadDashboardSummary()}
                className="inline-flex w-fit rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-2 font-medium text-sky-100 transition hover:bg-sky-400/20"
              >
                Atualizar resumo
              </button>
            ) : null}
          </div>
        </header>

        {!isAuthenticated ? (
          <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-sky-200/80">
                Acesso autenticado
              </p>
              <h2 className="mt-4 text-3xl text-white">
                Entre com sua conta para carregar o dashboard.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                Os indicadores são privados e dependem do header
                <code className="mx-1 rounded bg-white/10 px-2 py-1 text-xs text-white">
                  Authorization
                </code>
                emitido após o login.
              </p>

              <form className="mt-8 grid gap-4" onSubmit={handleLoginSubmit}>
                <label className="grid gap-2 text-sm text-slate-200">
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="owner@bootstrap.local"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                    autoComplete="email"
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm text-slate-200">
                  <span>Senha</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Sua senha de acesso"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                    autoComplete="current-password"
                    required
                  />
                </label>

                {authError ? (
                  <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {authError}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting || isBootstrapping}
                  className="inline-flex w-fit rounded-full border border-sky-300/20 bg-sky-400/10 px-5 py-3 font-medium text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Entrando..." : "Entrar e carregar dashboard"}
                </button>
              </form>
            </article>

            <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/40 p-6">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
                Escopo desbloqueado
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
          </section>
        ) : (
          <>
            <section className="rounded-[1.75rem] border border-emerald-400/15 bg-emerald-500/10 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-emerald-200/80">
                    Sessão autenticada
                  </p>
                  <h2 className="mt-2 text-2xl text-white">
                    {user?.name} conectado em {tenant?.name}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-emerald-50/80">
                    Tenant: {tenant?.slug} | Perfis: {roleLabel}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void logout()}
                  className="inline-flex w-fit rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                >
                  Sair
                </button>
              </div>
            </section>

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

            <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
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
                    {isLoading || !summary
                      ? "..."
                      : formatMetric(summary[card.key])}
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
          </>
        )}
      </section>
    </main>
  );
}
