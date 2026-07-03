"use client";

import { useAuthContext } from "@/components/auth/authProvider";
import { useEffect, useState } from "react";

interface QuoteDocumentPageProps {
  params: Promise<{
    quoteId: string;
  }>;
}

export default function QuoteDocumentPage({ params }: QuoteDocumentPageProps) {
  const { accessToken } = useAuthContext();
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveParamsTimeout = window.setTimeout(() => {
      void params.then((resolvedParams) => {
        setQuoteId(resolvedParams.quoteId);
      });
    }, 0);

    return () => {
      window.clearTimeout(resolveParamsTimeout);
    };
  }, [params]);

  useEffect(() => {
    if (!quoteId || !accessToken) {
      return;
    }

    const currentLocation = new URL(window.location.href);
    const quoteVersionId = currentLocation.searchParams.get("quoteVersionId");

    const loadDocumentTimeout = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setError(null);

        try {
          const endpoint = quoteVersionId
            ? `/api/v1/quotes/${quoteId}/pdf?quoteVersionId=${quoteVersionId}`
            : `/api/v1/quotes/${quoteId}/pdf`;
          const response = await fetch(endpoint, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`
            }
          });
          const responseHtml = await response.text();

          if (!response.ok) {
            throw new Error("Falha ao carregar o documento comercial.");
          }

          /**
           * Extrai o conteúdo visível do HTML comercial para renderizar no shell autenticado.
           */
          const parser = new window.DOMParser();
          const documentHtml = parser.parseFromString(responseHtml, "text/html");
          const styles = Array.from(documentHtml.head.querySelectorAll("style"))
            .map((styleElement) => styleElement.outerHTML)
            .join("");
          const bodyContent = documentHtml.body.innerHTML;

          setHtmlPreview(`${styles}${bodyContent}`);
        } catch (documentError: unknown) {
          setError(
            documentError instanceof Error
              ? documentError.message
              : "Falha ao carregar o documento comercial."
          );
        } finally {
          setIsLoading(false);
        }
      })();
    }, 0);

    return () => {
      window.clearTimeout(loadDocumentTimeout);
    };
  }, [accessToken, quoteId]);

  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-4 md:px-6 md:py-6">
      <section className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col gap-4 rounded-[2rem] border border-white/10 bg-[rgba(9,16,29,0.82)] p-4 shadow-[0_30px_90px_rgba(2,6,23,0.45)] md:p-6">
        <header className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
            Documento comercial
          </p>
          <h1 className="mt-3 text-2xl text-white">
            Pré-visualização autenticada do orçamento
          </h1>
        </header>

        {isLoading ? (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
            Carregando documento comercial...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[1.5rem] border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {htmlPreview ? (
          <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white">
            <div
              className="min-h-[75vh] overflow-auto bg-white"
              dangerouslySetInnerHTML={{ __html: htmlPreview }}
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}
