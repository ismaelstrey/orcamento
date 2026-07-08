"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/emptyState";
import { FeedbackBanner } from "@/components/ui/feedbackBanner";
import { Surface } from "@/components/ui/surface";
import { useQuotes } from "@/hooks/useQuotes";
import type { PublicQuoteShare } from "@/lib/quotes/schemas";

interface PublicQuotePageProps {
  params: Promise<{
    slug: string;
  }>;
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

function formatPublicStatus(status: PublicQuoteShare["status"]): string {
  if (status === "active") {
    return "Link ativo";
  }

  if (status === "expired") {
    return "Link expirado";
  }

  return "Link revogado";
}

export default function PublicQuotePage({ params }: PublicQuotePageProps) {
  const { getPublicQuoteBySlug } = useQuotes(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [quoteShare, setQuoteShare] = useState<PublicQuoteShare | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    void params.then((resolvedParams) => {
      setSlug(resolvedParams.slug);
    });
  }, [params]);

  useEffect(() => {
    if (!slug) {
      return;
    }

    void (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getPublicQuoteBySlug(slug);
        setQuoteShare(response);
      } catch (loadError: unknown) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Falha ao carregar proposta compartilhada."
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, [getPublicQuoteBySlug, slug]);

  async function handleCopyCurrentLink(): Promise<void> {
    setCopyMessage(null);

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyMessage("Link copiado.");
    } catch {
      setCopyMessage("Nao foi possivel copiar automaticamente.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f7fb] px-4 py-6 text-slate-950 md:px-6 md:py-8">
      <section className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">
        <header className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px] lg:p-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-sky-600">
                Proposta comercial
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-950 md:text-4xl">
                {quoteShare?.quote.title ?? "Visualizacao publica"}
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Documento compartilhado para{" "}
                <span className="font-medium text-slate-900">
                  {quoteShare?.quote.customerName ?? "cliente"}
                </span>
                . Os valores abaixo representam uma versao congelada da proposta.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
                Resumo
              </p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">
                {quoteShare
                  ? formatCurrency(
                      quoteShare.version.totalCents,
                      quoteShare.version.currency
                    )
                  : "..."}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {quoteShare
                  ? `Versao ${quoteShare.version.versionNumber} publicada`
                  : "Carregando versao"}
              </p>
              {quoteShare ? (
                <p className="mt-1 text-sm text-slate-600">
                  {formatPublicStatus(quoteShare.status)}
                </p>
              ) : null}
            </div>
          </div>

          {quoteShare ? (
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 md:flex-row md:items-center md:justify-between lg:px-8">
              <p className="text-sm text-slate-600">
                Gerado em {formatDate(quoteShare.version.createdAt)}
                {quoteShare.expiresAt
                  ? ` | Valido ate ${formatDate(quoteShare.expiresAt)}`
                  : ""}
              </p>

              <div className="flex flex-wrap gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
                >
                  Imprimir
                </button>
                <button
                  type="button"
                  onClick={() => void handleCopyCurrentLink()}
                  className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-900 transition hover:bg-sky-100"
                >
                  Copiar link
                </button>
              </div>
            </div>
          ) : null}
        </header>

        {copyMessage ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 print:hidden">
            {copyMessage}
          </div>
        ) : null}

        {isLoading ? (
          <FeedbackBanner
            description="Carregando proposta compartilhada..."
            title="Sincronizando dados"
          />
        ) : null}

        {error ? (
          <FeedbackBanner description={error} title="Falha ao carregar" variant="error" />
        ) : null}

        {quoteShare ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Subtotal</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {formatCurrency(
                    quoteShare.version.subtotalCents,
                    quoteShare.version.currency
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Desconto</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {formatCurrency(
                    quoteShare.version.discountCents,
                    quoteShare.version.currency
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
                <p className="text-sm text-sky-700">Total da proposta</p>
                <p className="mt-2 text-xl font-semibold text-sky-950">
                  {formatCurrency(
                    quoteShare.version.totalCents,
                    quoteShare.version.currency
                  )}
                </p>
              </div>
            </section>

            {quoteShare.quote.publicNotes ? (
              <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-sky-600">
                  Observacoes publicas
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-700">
                  {quoteShare.quote.publicNotes}
                </p>
              </section>
            ) : null}

            <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-6">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-sky-600">
                  Itens da versao
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                  Composicao comercial
                </h2>
              </div>

              <div className="grid">
                {quoteShare.version.items.length ? (
                  quoteShare.version.items.map((item) => (
                    <article
                      key={item.id}
                      className="grid gap-4 border-b border-slate-100 p-5 last:border-b-0 md:grid-cols-[1fr_120px_160px]"
                    >
                      <div>
                        <p className="text-base font-medium text-slate-950">
                          {item.productName}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {item.productDescription ?? "Sem descricao adicional."}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Quantidade
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          {item.quantity}
                        </p>
                      </div>
                      <div className="md:text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Total
                        </p>
                        <p className="mt-2 text-base font-semibold text-slate-950">
                          {formatCurrency(
                            item.totalPriceCents,
                            quoteShare.version.currency
                          )}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Unit.{" "}
                          {formatCurrency(
                            item.unitPriceCents,
                            quoteShare.version.currency
                          )}
                        </p>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="p-6">
                    <EmptyState
                      title="Nenhum item encontrado nesta versao."
                      description="A versao compartilhada nao possui itens publicos disponiveis."
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-6 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-slate-600">
                  Documento derivado de uma versao congelada. Alteracoes futuras
                  no orcamento nao modificam este snapshot.
                </p>
                <p className="text-2xl font-semibold text-slate-950">
                  {formatCurrency(
                    quoteShare.version.totalCents,
                    quoteShare.version.currency
                  )}
                </p>
              </div>
            </section>

            <Surface as="section" variant="default" className="p-5 print:hidden">
              <p className="text-sm leading-7 text-[var(--muted)]">
                Para aceitar ou solicitar ajustes nesta proposta, responda pelo
                canal comercial em que o link foi enviado.
              </p>
            </Surface>
          </>
        ) : null}
      </section>
    </main>
  );
}
