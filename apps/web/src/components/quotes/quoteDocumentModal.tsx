"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/components/auth/authProvider";
import { Button } from "@/components/ui/button";
import { FeedbackBanner } from "@/components/ui/feedbackBanner";
import { Surface } from "@/components/ui/surface";

interface QuoteDocumentModalProps {
  quoteId: string;
}

export function QuoteDocumentModal({ quoteId }: QuoteDocumentModalProps) {
  const { accessToken } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteVersionId = searchParams.get("quoteVersionId");
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("orcamento.html");
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        router.push("/quotes");
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [router]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const endpoint = quoteVersionId
      ? `/api/v1/quotes/${quoteId}/pdf?quoteVersionId=${quoteVersionId}`
      : `/api/v1/quotes/${quoteId}/pdf`;

    void (async () => {
      setIsLoading(true);
      setError(null);

      try {
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

        setDownloadUrl(`${endpoint}${endpoint.includes("?") ? "&" : "?"}download=1`);
        const contentDisposition = response.headers.get("Content-Disposition");
        const dispositionFileName = contentDisposition?.match(/filename="([^"]+)"/)?.[1];
        setFileName(dispositionFileName ?? "orcamento.html");

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
  }, [accessToken, quoteId, quoteVersionId]);

  async function handleDownload(): Promise<void> {
    if (!downloadUrl || !accessToken) {
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error("Falha ao baixar o documento comercial.");
      }

      const documentBlob = await response.blob();
      const objectUrl = window.URL.createObjectURL(documentBlob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      anchor.click();
      window.URL.revokeObjectURL(objectUrl);
    } catch (downloadError: unknown) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Falha ao baixar o documento comercial."
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visualizacao do documento comercial"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-3 py-4 backdrop-blur-sm md:px-5 md:py-6"
    >
      <Link
        href="/quotes"
        aria-label="Fechar visualizacao"
        className="fixed inset-0 cursor-default"
      />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1500px] flex-col gap-4">
        <Surface
          as="header"
          variant="hero"
          className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:p-5"
        >
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-strong)]/80">
              Documento comercial
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground-strong)] md:text-3xl">
              Pre-visualizacao do orcamento
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Esta rota abre como modal e pode ser salva ou atualizada sem sair da visualizacao.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => window.print()}
              disabled={!htmlPreview}
            >
              Imprimir
            </Button>
            <Button
              onClick={() => void handleDownload()}
              disabled={!downloadUrl || isDownloading}
            >
              {isDownloading ? "Baixando..." : "Baixar HTML"}
            </Button>
            <Link
              href="/quotes"
              className="inline-flex items-center justify-center rounded-full border border-transparent bg-transparent px-4.5 py-2.5 text-sm font-medium text-[var(--foreground)] transition duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              Fechar
            </Link>
          </div>
        </Surface>

        {isLoading ? (
          <FeedbackBanner
            description="Carregando documento comercial..."
            title="Sincronizando documento"
          />
        ) : null}

        {error ? (
          <FeedbackBanner description={error} title="Falha ao carregar" variant="error" />
        ) : null}

        {htmlPreview ? (
          <Surface
            as="section"
            variant="elevated"
            className="min-h-0 flex-1 overflow-hidden p-3 md:p-4"
          >
            <div
              className="content-scroll h-[calc(100vh-15rem)] min-h-[420px] overflow-auto rounded-[1.25rem] bg-white"
              dangerouslySetInnerHTML={{ __html: htmlPreview }}
            />
          </Surface>
        ) : null}
      </section>
    </div>
  );
}
