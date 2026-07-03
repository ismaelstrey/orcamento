"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/components/auth/authProvider";
import { FeedbackBanner } from "@/components/ui/feedbackBanner";
import { PageHeader } from "@/components/ui/pageHeader";
import { Surface } from "@/components/ui/surface";

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
    void params.then((resolvedParams) => {
      setQuoteId(resolvedParams.quoteId);
    });
  }, [params]);

  useEffect(() => {
    if (!quoteId || !accessToken) {
      return;
    }

    const currentLocation = new URL(window.location.href);
    const quoteVersionId = currentLocation.searchParams.get("quoteVersionId");

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
  }, [accessToken, quoteId]);

  return (
    <main className="app-grid min-h-screen px-4 py-4 md:px-6 md:py-6">
      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1700px] flex-col gap-4">
        <PageHeader
          eyebrow="Documento comercial"
          title="Pré-visualização autenticada do orçamento"
          description="Visualize o documento comercial no contexto autenticado, ocupando melhor a área útil disponível sem perder a legibilidade."
        />

        {isLoading ? (
          <FeedbackBanner description="Carregando documento comercial..." title="Sincronizando documento" />
        ) : null}

        {error ? (
          <FeedbackBanner description={error} title="Falha ao carregar" variant="error" />
        ) : null}

        {htmlPreview ? (
          <Surface
            as="section"
            variant="elevated"
            className="overflow-hidden p-3 md:p-4"
          >
            <div
              className="content-scroll min-h-[75vh] overflow-auto rounded-[1.25rem] bg-white"
              dangerouslySetInnerHTML={{ __html: htmlPreview }}
            />
          </Surface>
        ) : null}
      </section>
    </main>
  );
}
