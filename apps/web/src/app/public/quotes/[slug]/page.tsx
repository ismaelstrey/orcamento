"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/emptyState";
import { FeedbackBanner } from "@/components/ui/feedbackBanner";
import { Surface } from "@/components/ui/surface";
import { useQuotes } from "@/hooks/useQuotes";
import {
  buildPublicQuoteWorkbench,
  type PublicQuoteActionKind,
  type PublicQuoteStatusTone
} from "@/lib/quotes/publicWorkbench";
import type { PublicQuoteShare } from "@/lib/quotes/schemas";

interface PublicQuotePageProps {
  params: Promise<{
    slug: string;
  }>;
}

function getPublicToneClassName(tone: PublicQuoteStatusTone): string {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  if (tone === "danger") {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function PublicQuotePage({ params }: PublicQuotePageProps) {
  const { getPublicQuoteBySlug } = useQuotes(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [quoteShare, setQuoteShare] = useState<PublicQuoteShare | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const quoteWorkbench = useMemo(
    () => (quoteShare ? buildPublicQuoteWorkbench(quoteShare) : null),
    [quoteShare]
  );

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

  function handlePublicAction(actionKind: PublicQuoteActionKind): void {
    if (actionKind === "print") {
      window.print();
      return;
    }

    if (actionKind === "copy") {
      void handleCopyCurrentLink();
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
                {quoteWorkbench?.title ?? "Visualizacao publica"}
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Documento compartilhado para{" "}
                <span className="font-medium text-slate-900">
                  {quoteWorkbench?.customerName ?? "cliente"}
                </span>
                . Os valores abaixo representam uma versao congelada da proposta.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
                Resumo
              </p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">
                {quoteWorkbench?.totalLabel ?? "..."}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {quoteWorkbench?.versionLabel ?? "Carregando versao"}
              </p>
              {quoteWorkbench ? (
                <p
                  className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getPublicToneClassName(
                    quoteWorkbench.statusTone
                  )}`}
                >
                  {quoteWorkbench.statusLabel}
                </p>
              ) : null}
            </div>
          </div>

          {quoteWorkbench ? (
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 md:flex-row md:items-center md:justify-between lg:px-8">
              <p className="text-sm text-slate-600">
                {quoteWorkbench.generatedAtLabel} | {quoteWorkbench.expirationLabel}
              </p>

              <div className="flex flex-wrap gap-2 print:hidden">
                {quoteWorkbench.actions
                  .filter((action) => action.kind !== "contact")
                  .map((action) => (
                    <button
                      key={action.kind}
                      type="button"
                      onClick={() => handlePublicAction(action.kind)}
                      disabled={!action.isEnabled}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${getPublicToneClassName(
                        action.tone
                      )}`}
                      title={action.helper}
                    >
                      {action.label}
                    </button>
                  ))}
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

        {quoteShare && quoteWorkbench ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {quoteWorkbench.metrics.map((metric) => (
                <div
                  key={metric.key}
                  className={`rounded-2xl border p-5 shadow-sm ${getPublicToneClassName(
                    metric.tone
                  )}`}
                >
                  <p className="text-sm opacity-80">{metric.label}</p>
                  <p className="mt-2 text-xl font-semibold">{metric.value}</p>
                  <p className="mt-2 text-xs leading-5 opacity-75">
                    {metric.helper}
                  </p>
                </div>
              ))}
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-sky-600">
                Leitura da proposta
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                {quoteWorkbench.narrative.headline}
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                {quoteWorkbench.narrative.body}
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {quoteWorkbench.narrative.bullets.map((bullet) => (
                  <p
                    key={bullet}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                  >
                    {bullet}
                  </p>
                ))}
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

            <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-sky-600">
                  Checklist de decisao
                </p>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {quoteWorkbench.checklist.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-4 ${getPublicToneClassName(
                        item.tone
                      )}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-white/70 text-xs font-semibold">
                          {item.isComplete ? "OK" : "!"}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className="mt-1 text-xs leading-5 opacity-80">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-sky-200">
                  {quoteWorkbench.printSummary.title}
                </p>
                <div className="mt-5 grid gap-2">
                  {quoteWorkbench.printSummary.lines.map((line) => (
                    <p
                      key={line}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm leading-6 text-slate-200"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </section>

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
                {quoteWorkbench.itemViewModels.length ? (
                  quoteWorkbench.itemViewModels.map((item) => (
                    <article
                      key={item.id}
                      className="grid gap-4 border-b border-slate-100 p-5 last:border-b-0 lg:grid-cols-[1fr_150px_180px]"
                    >
                      <div>
                        <p className="text-base font-medium text-slate-950">
                          {item.productName}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {item.description}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-sky-700">
                          {item.insight}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Quantidade
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          {item.quantityLabel}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.shareLabel}
                        </p>
                      </div>
                      <div className="md:text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Total
                        </p>
                        <p className="mt-2 text-base font-semibold text-slate-950">
                          {item.totalPriceLabel}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Unit. {item.unitPriceLabel}
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
                  {quoteWorkbench.footerNote}
                </p>
                <p className="text-2xl font-semibold text-slate-950">
                  {quoteWorkbench.totalLabel}
                </p>
              </div>
            </section>

            <Surface as="section" variant="default" className="p-5 print:hidden">
              <div className="mb-5 grid gap-3 md:grid-cols-3">
                {quoteWorkbench.trustNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4"
                  >
                    <p className="text-sm font-semibold text-[var(--foreground-strong)]">
                      {note.title}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                      {note.description}
                    </p>
                  </div>
                ))}
              </div>
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
