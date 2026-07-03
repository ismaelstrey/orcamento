"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/emptyState";
import { FeedbackBanner } from "@/components/ui/feedbackBanner";
import { PageHeader } from "@/components/ui/pageHeader";
import { StatCard } from "@/components/ui/statCard";
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

export default function PublicQuotePage({ params }: PublicQuotePageProps) {
  const { getPublicQuoteBySlug } = useQuotes(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [quoteShare, setQuoteShare] = useState<PublicQuoteShare | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            : "Falha ao carregar orçamento compartilhado."
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, [getPublicQuoteBySlug, slug]);

  return (
    <main className="app-grid min-h-screen px-4 py-6 md:px-6 md:py-8">
      <section className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-6">
        <PageHeader
          eyebrow="Orçamento compartilhado"
          title={quoteShare?.quote.title ?? "Visualização pública"}
          description={`Cliente: ${quoteShare?.quote.customerName ?? "Carregando..."}`}
        />

        {isLoading ? (
          <FeedbackBanner description="Carregando orçamento compartilhado..." title="Sincronizando dados" />
        ) : null}

        {error ? (
          <FeedbackBanner description={error} title="Falha ao carregar" variant="error" />
        ) : null}

        {quoteShare ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <StatCard
                label="Versão"
                value={String(quoteShare.version.versionNumber)}
                description="Versão congelada compartilhada com o cliente."
              />
              <StatCard
                label="Status do link"
                value={quoteShare.status}
                description="Estado atual da publicação pública."
              />
              <StatCard
                label="Total"
                value={formatCurrency(
                  quoteShare.version.totalCents,
                  quoteShare.version.currency
                )}
                description="Valor consolidado da versão publicada."
              />
            </section>

            {quoteShare.quote.publicNotes ? (
              <Surface as="section" variant="default" className="p-6">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--accent-strong)]/80">
                  Observações públicas
                </p>
                <p className="mt-4 text-sm leading-7 text-[var(--foreground)]">
                  {quoteShare.quote.publicNotes}
                </p>
              </Surface>
            ) : null}

            <Surface as="section" variant="default" className="p-6">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--accent-strong)]/80">
                Itens da versão
              </p>
              <div className="mt-5 grid gap-3">
                {quoteShare.version.items.length ? (
                  quoteShare.version.items.map((item) => (
                    <Surface
                      key={item.id}
                      as="article"
                      variant="subtle"
                      hoverable
                      className="p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-base font-medium text-[var(--foreground-strong)]">
                            {item.productName}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                            {item.productDescription ?? "Sem descrição adicional."}
                          </p>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-base font-semibold text-[var(--accent)]">
                            {formatCurrency(
                              item.totalPriceCents,
                              quoteShare.version.currency
                            )}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                            Qtd. {item.quantity}
                          </p>
                        </div>
                      </div>
                    </Surface>
                  ))
                ) : (
                  <EmptyState
                    title="Nenhum item encontrado nesta versão."
                    description="A versão compartilhada não possui itens públicos disponíveis."
                  />
                )}
              </div>
            </Surface>
          </>
        ) : null}
      </section>
    </main>
  );
}
