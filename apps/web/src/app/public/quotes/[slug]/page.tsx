"use client";

import { useEffect, useState } from "react";
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

export default function PublicQuotePage({ params }: PublicQuotePageProps) {
  const { getPublicQuoteBySlug } = useQuotes(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [quoteShare, setQuoteShare] = useState<PublicQuoteShare | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveParamsTimeout = window.setTimeout(() => {
      void params.then((resolvedParams) => {
        setSlug(resolvedParams.slug);
      });
    }, 0);

    return () => {
      window.clearTimeout(resolveParamsTimeout);
    };
  }, [params]);

  useEffect(() => {
    if (!slug) {
      return;
    }

    const loadPublicQuoteTimeout = window.setTimeout(() => {
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
              : "Falha ao carregar orçamento compartilhado."
          );
        } finally {
          setIsLoading(false);
        }
      })();
    }, 0);

    return () => {
      window.clearTimeout(loadPublicQuoteTimeout);
    };
  }, [getPublicQuoteBySlug, slug]);

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-10 text-slate-100 md:px-8 md:py-12">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-[2rem] border border-white/10 bg-[rgba(9,16,29,0.85)] p-6 shadow-[0_40px_120px_rgba(2,6,23,0.45)] md:p-8">
        <header className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
          <span className="inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.32em] text-sky-200">
            Orçamento compartilhado
          </span>
          <h1 className="mt-4 text-4xl leading-tight tracking-tight text-white">
            {quoteShare?.quote.title ?? "Visualização pública"}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Cliente: {quoteShare?.quote.customerName ?? "Carregando..."}
          </p>
        </header>

        {isLoading ? (
          <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
            Carregando orçamento compartilhado...
          </section>
        ) : null}

        {error ? (
          <section className="rounded-[1.75rem] border border-rose-400/20 bg-rose-500/10 p-6">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-rose-200/80">
              Falha ao carregar
            </p>
            <p className="mt-3 text-sm leading-7 text-rose-100">{error}</p>
          </section>
        ) : null}

        {quoteShare ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Versão</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {quoteShare.version.versionNumber}
                </p>
              </article>
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Status do link</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {quoteShare.status}
                </p>
              </article>
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Total</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {formatCurrency(
                    quoteShare.version.totalCents,
                    quoteShare.version.currency
                  )}
                </p>
              </article>
            </section>

            {quoteShare.quote.publicNotes ? (
              <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-sky-200/80">
                  Observações públicas
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-200">
                  {quoteShare.quote.publicNotes}
                </p>
              </section>
            ) : null}

            <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-sky-200/80">
                Itens da versão
              </p>
              <div className="mt-5 grid gap-3">
                {quoteShare.version.items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-[#0b1322] p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-base font-medium text-white">
                          {item.productName}
                        </p>
                        <p className="mt-1 text-sm text-slate-300">
                          {item.productDescription ?? "Sem descrição adicional."}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-semibold text-[var(--accent)]">
                          {formatCurrency(
                            item.totalPriceCents,
                            quoteShare.version.currency
                          )}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                          Qtd. {item.quantity}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
