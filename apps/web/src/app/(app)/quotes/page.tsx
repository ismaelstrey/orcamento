"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthContext } from "@/components/auth/authProvider";
import { useAiQuoteDraft } from "@/hooks/useAiQuoteDraft";
import { useCatalog } from "@/hooks/useCatalog";
import { useCustomers } from "@/hooks/useCustomers";
import { useQuotes } from "@/hooks/useQuotes";
import type { QuoteDraftProviderCapabilities } from "@/lib/ai/providers";
import type { QuoteDraftFallbackReview } from "@/lib/ai/service";
import type { CustomerResponse } from "@/lib/customers/schemas";
import type { ProductResponse } from "@/lib/catalog/schemas";
import type {
  CreateQuoteRequest,
  CreateQuoteVersionRequest,
  ExportQuoteJsonResponse,
  ImportQuoteJsonRequest,
  ImportQuoteJsonResponse,
  PdfResponse,
  QuoteDetail,
  QuoteSummary,
  ShareLinkResponse
} from "@/lib/quotes/schemas";

interface QuoteCreateFormValues {
  customerId: string;
  title: string;
  publicNotes: string;
  internalNotes: string;
  productId: string;
  quantity: string;
}

interface QuoteRevisionItemFormValues {
  id: string;
  productId: string;
  productName: string;
  productDescription: string;
  quantity: string;
  unitPrice: string;
}

interface QuoteRevisionFormValues {
  label: string;
  items: QuoteRevisionItemFormValues[];
}

interface QuoteAiDraftFormValues {
  customerId: string;
  userText: string;
  budgetMaxCents: string;
}

type QuoteStatusFilter = "all" | QuoteSummary["status"];

const quotePageSize = 5;

const initialQuoteCreateFormValues: QuoteCreateFormValues = {
  customerId: "",
  title: "",
  publicNotes: "",
  internalNotes: "",
  productId: "",
  quantity: "1"
};

const initialQuoteRevisionFormValues: QuoteRevisionFormValues = {
  label: "",
  items: []
};

const initialQuoteAiDraftFormValues: QuoteAiDraftFormValues = {
  customerId: "",
  userText: "",
  budgetMaxCents: ""
};

function buildAiDraftBriefingExample(): Pick<
  QuoteAiDraftFormValues,
  "userText" | "budgetMaxCents"
> {
  return {
    userText:
      "Preciso de tres notebooks corporativos para equipe comercial, com boa bateria, SSD e garantia para uso em viagens.",
    budgetMaxCents: "12000,00"
  };
}

function buildImportJsonExample(customerId: string): string {
  return JSON.stringify(
    {
      schemaVersion: "1.0",
      customerId,
      currency: "BRL",
      category: "notebooks",
      budgetMaxCents: 1500000,
      usageContext: "Equipe administrativa com uso corporativo diário",
      notes: "Preferir equipamentos com SSD e garantia comercial.",
      items: [
        {
          type: "notebook",
          model: "Notebook corporativo i5 16GB SSD",
          quantity: 3
        }
      ]
    },
    null,
    2
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatCurrency(valueInCents: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency
  }).format(valueInCents / 100);
}

function formatStatus(value: QuoteSummary["status"]): string {
  if (value === "draft") {
    return "Draft";
  }

  if (value === "published") {
    return "Publicado";
  }

  return "Arquivado";
}

function formatSourceType(value: QuoteDetail["versions"][number]["sourceType"]): string {
  if (value === "import_json") {
    return "Importacao JSON";
  }

  if (value === "ai_future") {
    return "IA";
  }

  return "Manual";
}

export default function QuotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const importJsonSectionRef = useRef<HTMLElement | null>(null);
  const { accessToken, tenant } = useAuthContext();
  const { generateQuoteDraft, getQuoteDraftCapabilities } =
    useAiQuoteDraft(accessToken);
  const { loadCustomers } = useCustomers(accessToken);
  const { listProducts } = useCatalog(accessToken);
  const {
    listQuotes,
    createQuote,
    createQuoteVersion,
    getQuoteById,
    listQuoteShareLinks,
    createQuoteShareLink,
    revokeQuoteShareLink,
    generateQuotePdf,
    importQuoteFromJson,
    exportQuoteToJson
  } = useQuotes(accessToken);
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<QuoteDetail | null>(
    null
  );
  const [shareLinks, setShareLinks] = useState<ShareLinkResponse[]>([]);
  const [exportedJson, setExportedJson] =
    useState<ExportQuoteJsonResponse | null>(null);
  const [pdfResult, setPdfResult] = useState<PdfResponse | null>(null);
  const [importJsonText, setImportJsonText] = useState("");
  const [importResult, setImportResult] =
    useState<ImportQuoteJsonResponse | null>(null);
  const [aiDraftForm, setAiDraftForm] = useState<QuoteAiDraftFormValues>(
    initialQuoteAiDraftFormValues
  );
  const [aiDraftReview, setAiDraftReview] =
    useState<QuoteDraftFallbackReview | null>(null);
  const [aiDraftCapabilities, setAiDraftCapabilities] =
    useState<QuoteDraftProviderCapabilities | null>(null);
  const [copiedShareLinkId, setCopiedShareLinkId] = useState<string | null>(null);
  const [quoteSearch, setQuoteSearch] = useState("");
  const [quoteStatusFilter, setQuoteStatusFilter] =
    useState<QuoteStatusFilter>("all");
  const [quotePage, setQuotePage] = useState(1);
  const [createForm, setCreateForm] = useState<QuoteCreateFormValues>(
    initialQuoteCreateFormValues
  );
  const [revisionForm, setRevisionForm] = useState<QuoteRevisionFormValues>(
    initialQuoteRevisionFormValues
  );
  const [isLoadingBootstrap, setIsLoadingBootstrap] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  const [isImportingQuote, setIsImportingQuote] = useState(false);
  const [isGeneratingAiDraft, setIsGeneratingAiDraft] = useState(false);
  const [isLoadingAiCapabilities, setIsLoadingAiCapabilities] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isRunningAction, setIsRunningAction] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [aiDraftMessage, setAiDraftMessage] = useState<string | null>(null);
  const [aiDraftError, setAiDraftError] = useState<string | null>(null);
  const [aiDraftCapabilitiesError, setAiDraftCapabilitiesError] =
    useState<string | null>(null);
  const [detailMessage, setDetailMessage] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const routedQuoteId = searchParams.get("quoteId");
  const hasAiDraftProvider = Boolean(aiDraftCapabilities?.isEnabled);

  const customerMap = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers]
  );
  const filteredQuotes = useMemo(() => {
    const normalizedSearch = quoteSearch.trim().toLocaleLowerCase("pt-BR");

    return quotes.filter((quote) => {
      const customer = customerMap.get(quote.customerId);
      const matchesStatus =
        quoteStatusFilter === "all" || quote.status === quoteStatusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        quote.title,
        quote.status,
        formatStatus(quote.status),
        customer?.name ?? "",
        quote.currentVersion.versionNumber
      ]
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return searchableText.includes(normalizedSearch);
    });
  }, [customerMap, quoteSearch, quoteStatusFilter, quotes]);
  const quoteTotalPages = Math.max(1, Math.ceil(filteredQuotes.length / quotePageSize));
  const paginatedQuotes = useMemo(() => {
    const startIndex = (quotePage - 1) * quotePageSize;

    return filteredQuotes.slice(startIndex, startIndex + quotePageSize);
  }, [filteredQuotes, quotePage]);
  const quotePageStart = filteredQuotes.length
    ? (quotePage - 1) * quotePageSize + 1
    : 0;
  const quotePageEnd = Math.min(quotePage * quotePageSize, filteredQuotes.length);
  const currentVersionDetail = useMemo(() => {
    if (!selectedQuoteDetail) {
      return null;
    }

    return (
      selectedQuoteDetail.versions.find(
        (version) => version.id === selectedQuoteDetail.currentVersion.id
      ) ?? null
    );
  }, [selectedQuoteDetail]);

  const refreshQuotesWorkspace = useCallback(async () => {
    setIsLoadingBootstrap(true);
    setPageError(null);

    try {
      const [customersPayload, productsPayload, quotesPayload] = await Promise.all([
        loadCustomers({
          page: 1,
          pageSize: 100
        }),
        listProducts(),
        listQuotes()
      ]);

      setCustomers(customersPayload.items);
      setProducts(productsPayload);
      setQuotes(quotesPayload);
      setCreateForm((currentValues) => ({
        ...currentValues,
        customerId:
          currentValues.customerId ||
          customersPayload.items[0]?.id ||
          initialQuoteCreateFormValues.customerId,
        productId:
          currentValues.productId ||
          productsPayload[0]?.id ||
          initialQuoteCreateFormValues.productId
      }));
      setAiDraftForm((currentValues) => ({
        ...currentValues,
        customerId:
          currentValues.customerId ||
          customersPayload.items[0]?.id ||
          initialQuoteAiDraftFormValues.customerId
      }));
    } catch (bootstrapError: unknown) {
      setPageError(
        bootstrapError instanceof Error
          ? bootstrapError.message
          : "Falha ao carregar o workspace de orçamentos."
      );
    } finally {
      setIsLoadingBootstrap(false);
    }
  }, [listProducts, listQuotes, loadCustomers]);

  useEffect(() => {
    const refreshQuotesWorkspaceTimeout = window.setTimeout(() => {
      void refreshQuotesWorkspace();
    }, 0);

    return () => {
      window.clearTimeout(refreshQuotesWorkspaceTimeout);
    };
  }, [refreshQuotesWorkspace]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const loadAiCapabilitiesTimeout = window.setTimeout(() => {
      setIsLoadingAiCapabilities(true);
      setAiDraftCapabilitiesError(null);

      void getQuoteDraftCapabilities()
        .then((capabilities) => {
          setAiDraftCapabilities(capabilities);
        })
        .catch((capabilitiesError: unknown) => {
          setAiDraftCapabilities(null);
          setAiDraftCapabilitiesError(
            capabilitiesError instanceof Error
              ? capabilitiesError.message
              : "Falha ao verificar disponibilidade do assistente de IA."
          );
        })
        .finally(() => {
          setIsLoadingAiCapabilities(false);
        });
    }, 0);

    return () => {
      window.clearTimeout(loadAiCapabilitiesTimeout);
    };
  }, [accessToken, getQuoteDraftCapabilities]);

  useEffect(() => {
    const resetQuotePageTimeout = window.setTimeout(() => {
      setQuotePage(1);
    }, 0);

    return () => {
      window.clearTimeout(resetQuotePageTimeout);
    };
  }, [quoteSearch, quoteStatusFilter]);

  useEffect(() => {
    if (quotePage <= quoteTotalPages) {
      return;
    }

    const clampQuotePageTimeout = window.setTimeout(() => {
      setQuotePage(quoteTotalPages);
    }, 0);

    return () => {
      window.clearTimeout(clampQuotePageTimeout);
    };
  }, [quotePage, quoteTotalPages]);

  const openQuotePanelRoute = useCallback(
    (quoteId: string): void => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("quoteId", quoteId);
      router.push(`/quotes?${nextParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const clearQuotePanelRoute = useCallback((): void => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("quoteId");
    const query = nextParams.toString();

    router.push(query ? `/quotes?${query}` : "/quotes", { scroll: false });
  }, [router, searchParams]);

  const resetQuotePanelState = useCallback((): void => {
    setSelectedQuoteId(null);
    setSelectedQuoteDetail(null);
    setShareLinks([]);
    setExportedJson(null);
    setPdfResult(null);
    setDetailMessage(null);
    setDetailError(null);
    setIsLoadingDetail(false);
    setCopiedShareLinkId(null);
  }, []);

  const loadQuotePanel = useCallback(
    async (quoteId: string) => {
      setSelectedQuoteId(quoteId);
      setSelectedQuoteDetail(null);
      setShareLinks([]);
      setExportedJson(null);
      setPdfResult(null);
      setCopiedShareLinkId(null);
      setIsLoadingDetail(true);
      setDetailError(null);
      setDetailMessage(null);

      try {
        const [quoteDetailPayload, shareLinksPayload] = await Promise.all([
          getQuoteById(quoteId),
          listQuoteShareLinks(quoteId)
        ]);

        setSelectedQuoteDetail(quoteDetailPayload);
        setShareLinks(shareLinksPayload);
      } catch (quoteError: unknown) {
        setDetailError(
          quoteError instanceof Error
            ? quoteError.message
            : "Falha ao carregar detalhes do orçamento."
        );
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [getQuoteById, listQuoteShareLinks]
  );

  const handleCloseQuotePanel = useCallback((): void => {
    resetQuotePanelState();
    clearQuotePanelRoute();
  }, [clearQuotePanelRoute, resetQuotePanelState]);

  useEffect(() => {
    const routeSyncTimeout = window.setTimeout(() => {
      if (!routedQuoteId) {
        if (selectedQuoteId) {
          resetQuotePanelState();
        }

        return;
      }

      if (routedQuoteId === selectedQuoteId) {
        return;
      }

      void loadQuotePanel(routedQuoteId);
    }, 0);

    return () => {
      window.clearTimeout(routeSyncTimeout);
    };
  }, [loadQuotePanel, resetQuotePanelState, routedQuoteId, selectedQuoteId]);

  useEffect(() => {
    if (!currentVersionDetail) {
      const resetRevisionFormTimeout = window.setTimeout(() => {
        setRevisionForm(initialQuoteRevisionFormValues);
      }, 0);

      return () => {
        window.clearTimeout(resetRevisionFormTimeout);
      };

      return;
    }

    const revisionFormTimeout = window.setTimeout(() => {
      setRevisionForm({
        label: `Revisão ${currentVersionDetail.versionNumber + 1}`,
        items: currentVersionDetail.items.map((item) => ({
          id: item.id,
          productId: item.productId ?? "",
          productName: item.productName,
          productDescription: item.productDescription ?? "",
          quantity: String(item.quantity),
          unitPrice: (item.unitPriceCents / 100).toFixed(2).replace(".", ",")
        }))
      });
    }, 0);

    return () => {
      window.clearTimeout(revisionFormTimeout);
    };
  }, [currentVersionDetail]);

  useEffect(() => {
    if (!selectedQuoteId) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        handleCloseQuotePanel();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleCloseQuotePanel, selectedQuoteId]);

  function handleCreateFormFieldChange(
    field: keyof QuoteCreateFormValues,
    value: string
  ): void {
    setCreateForm((currentValues) => ({
      ...currentValues,
      [field]: value
    }));
  }

  function handleAiDraftFormFieldChange(
    field: keyof QuoteAiDraftFormValues,
    value: string
  ): void {
    setAiDraftForm((currentValues) => ({
      ...currentValues,
      [field]: value
    }));
    setAiDraftError(null);
    setAiDraftMessage(null);
  }

  function handleResetQuoteForm(): void {
    setCreateForm({
      ...initialQuoteCreateFormValues,
      customerId: customers[0]?.id ?? "",
      productId: products[0]?.id ?? ""
    });
    setCreateMessage(null);
  }

  function handleUseImportExample(): void {
    setImportJsonText(buildImportJsonExample(customers[0]?.id ?? ""));
    setImportResult(null);
    setImportMessage(null);
    setImportError(null);
  }

  function scrollToImportJsonSection(): void {
    importJsonSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function handleUseAiDraftExample(): void {
    const example = buildAiDraftBriefingExample();

    setAiDraftForm((currentValues) => ({
      ...currentValues,
      customerId: currentValues.customerId || customers[0]?.id || "",
      userText: example.userText,
      budgetMaxCents: example.budgetMaxCents
    }));
    setAiDraftReview(null);
    setAiDraftMessage(null);
    setAiDraftError(null);
  }

  function handleResetAiDraft(): void {
    setAiDraftForm({
      ...initialQuoteAiDraftFormValues,
      customerId: customers[0]?.id ?? ""
    });
    setAiDraftReview(null);
    setAiDraftMessage(null);
    setAiDraftError(null);
  }

  async function handleGenerateAiDraft(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    setIsGeneratingAiDraft(true);
    setAiDraftMessage(null);
    setAiDraftError(null);
    setAiDraftReview(null);

    try {
      const normalizedBudget = aiDraftForm.budgetMaxCents.trim();
      const budgetMaxCents = normalizedBudget
        ? Math.round(Number(normalizedBudget.replace(",", ".")) * 100)
        : undefined;

      if (
        budgetMaxCents !== undefined &&
        (!Number.isInteger(budgetMaxCents) || budgetMaxCents <= 0)
      ) {
        throw new Error("Informe um orçamento máximo válido ou deixe o campo vazio.");
      }

      const review = await generateQuoteDraft({
        customerId: aiDraftForm.customerId,
        userText: aiDraftForm.userText.trim(),
        currency: "BRL",
        ...(budgetMaxCents ? { budgetMaxCents } : {}),
        catalogHints: products.slice(0, 20).map((product) => ({
          productId: product.id,
          name: product.name,
          category: product.categoryId
        }))
      });

      setAiDraftReview(review);
      setImportJsonText(JSON.stringify(review.importPayload, null, 2));
      setImportResult(null);
      setImportError(null);
      setImportMessage("Draft de IA convertido em JSON. Revise antes de importar.");
      setAiDraftMessage("Draft gerado e enviado para a área de importação JSON.");
    } catch (draftError: unknown) {
      setAiDraftError(
        draftError instanceof Error
          ? draftError.message
          : "Falha ao gerar draft com assistente de IA."
      );
    } finally {
      setIsGeneratingAiDraft(false);
    }
  }

  async function handleImportQuoteJson(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    setIsImportingQuote(true);
    setImportMessage(null);
    setImportError(null);
    setImportResult(null);

    try {
      const parsedPayload = JSON.parse(importJsonText) as ImportQuoteJsonRequest;
      const importedQuote = await importQuoteFromJson(parsedPayload);

      setImportResult(importedQuote);
      setImportMessage(
        importedQuote.warnings.length
          ? "Draft importado com alertas para revisÃ£o."
          : "Draft importado com sucesso."
      );
      await refreshQuotesWorkspace();
      openQuotePanelRoute(importedQuote.quoteId);
    } catch (importFailure: unknown) {
      setImportError(
        importFailure instanceof SyntaxError
          ? "JSON invÃ¡lido. Revise chaves, aspas e vÃ­rgulas antes de importar."
          : importFailure instanceof Error
            ? importFailure.message
            : "Falha ao importar JSON do orÃ§amento."
      );
    } finally {
      setIsImportingQuote(false);
    }
  }

  async function handleCreateQuote(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    setIsSubmittingQuote(true);
    setCreateMessage(null);
    setPageError(null);

    try {
      const quantity = Number(createForm.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("Informe uma quantidade inteira maior que zero.");
      }

      const payload: CreateQuoteRequest = {
        customerId: createForm.customerId,
        title: createForm.title.trim(),
        ...(createForm.publicNotes.trim()
          ? { publicNotes: createForm.publicNotes.trim() }
          : {}),
        ...(createForm.internalNotes.trim()
          ? { internalNotes: createForm.internalNotes.trim() }
          : {}),
        items: [
          {
            productId: createForm.productId,
            quantity
          }
        ]
      };

      const createdQuote = await createQuote(payload);

      setCreateMessage("Orçamento criado com sucesso.");
      await refreshQuotesWorkspace();
      openQuotePanelRoute(createdQuote.id);
      handleResetQuoteForm();
    } catch (creationError: unknown) {
      setPageError(
        creationError instanceof Error
          ? creationError.message
          : "Falha ao criar orçamento."
      );
    } finally {
      setIsSubmittingQuote(false);
    }
  }

  async function handleCreateShareLink(quoteVersionId?: string): Promise<void> {
    if (!selectedQuoteId || !selectedQuoteDetail) {
      return;
    }

    setIsRunningAction(true);
    setDetailError(null);
    setDetailMessage(null);

    try {
      const shareLink = await createQuoteShareLink(selectedQuoteId, {
        quoteVersionId: quoteVersionId ?? selectedQuoteDetail.currentVersion.id
      });

      setShareLinks((currentLinks) => [shareLink, ...currentLinks]);
      setDetailMessage("Link de compartilhamento criado com sucesso.");
    } catch (shareError: unknown) {
      setDetailError(
        shareError instanceof Error
          ? shareError.message
          : "Falha ao criar link de compartilhamento."
      );
    } finally {
      setIsRunningAction(false);
    }
  }

  async function handleRevokeShareLink(shareLinkId: string): Promise<void> {
    if (!selectedQuoteId) {
      return;
    }

    setIsRunningAction(true);
    setDetailError(null);
    setDetailMessage(null);

    try {
      const revokedShareLink = await revokeQuoteShareLink(
        selectedQuoteId,
        shareLinkId
      );

      setShareLinks((currentLinks) =>
        currentLinks.map((currentLink) =>
          currentLink.id === revokedShareLink.id ? revokedShareLink : currentLink
        )
      );
      setDetailMessage("Link revogado com sucesso.");
    } catch (revokeError: unknown) {
      setDetailError(
        revokeError instanceof Error
          ? revokeError.message
          : "Falha ao revogar link."
      );
    } finally {
      setIsRunningAction(false);
    }
  }

  async function handleCopyShareLink(shareLink: ShareLinkResponse): Promise<void> {
    setDetailError(null);
    setDetailMessage(null);

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareLink.url);
      } else {
        const copyTarget = document.createElement("textarea");
        copyTarget.value = shareLink.url;
        copyTarget.setAttribute("readonly", "true");
        copyTarget.style.position = "fixed";
        copyTarget.style.opacity = "0";
        document.body.appendChild(copyTarget);
        copyTarget.select();
        document.execCommand("copy");
        document.body.removeChild(copyTarget);
      }

      setCopiedShareLinkId(shareLink.id);
      setDetailMessage("Link publico copiado para a area de transferencia.");
    } catch {
      setDetailError("Nao foi possivel copiar o link. Abra o link e copie pela barra do navegador.");
    }
  }

  async function handleExportQuote(): Promise<void> {
    if (!selectedQuoteId) {
      return;
    }

    setIsRunningAction(true);
    setDetailError(null);
    setDetailMessage(null);

    try {
      const exportedPayload = await exportQuoteToJson(selectedQuoteId);
      setExportedJson(exportedPayload);
      setDetailMessage("Exportação JSON gerada com sucesso.");
    } catch (exportError: unknown) {
      setDetailError(
        exportError instanceof Error
          ? exportError.message
          : "Falha ao exportar orçamento em JSON."
      );
    } finally {
      setIsRunningAction(false);
    }
  }

  async function handleGeneratePdf(quoteVersionId?: string): Promise<void> {
    if (!selectedQuoteId || !selectedQuoteDetail) {
      return;
    }

    setIsRunningAction(true);
    setDetailError(null);
    setDetailMessage(null);

    try {
      const pdfPayload = await generateQuotePdf(selectedQuoteId, {
        quoteVersionId: quoteVersionId ?? selectedQuoteDetail.currentVersion.id
      });
      setPdfResult(pdfPayload);
      setDetailMessage("Documento comercial gerado com sucesso.");
    } catch (pdfError: unknown) {
      setDetailError(
        pdfError instanceof Error ? pdfError.message : "Falha ao gerar PDF."
      );
    } finally {
      setIsRunningAction(false);
    }
  }

  function handleRevisionFieldChange(field: "label", value: string): void {
    setRevisionForm((currentValues) => ({
      ...currentValues,
      [field]: value
    }));
  }

  function handleRevisionItemFieldChange(
    itemId: string,
    field: "quantity" | "unitPrice",
    value: string
  ): void {
    setRevisionForm((currentValues) => ({
      ...currentValues,
      items: currentValues.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: value
            }
          : item
      )
    }));
  }

  async function handleCreateRevision(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    if (!selectedQuoteId) {
      return;
    }

    setIsSubmittingRevision(true);
    setDetailError(null);
    setDetailMessage(null);

    try {
      const payload: CreateQuoteVersionRequest = {
        ...(revisionForm.label.trim() ? { label: revisionForm.label.trim() } : {}),
        items: revisionForm.items.map((item) => {
          const quantity = Number(item.quantity);
          const unitPriceCents = Math.round(
            Number(item.unitPrice.replace(",", ".")) * 100
          );

          if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new Error("Cada item da revisão precisa ter quantidade válida.");
          }

          if (Number.isNaN(unitPriceCents) || unitPriceCents < 0) {
            throw new Error(
              "Cada item da revisão precisa ter preço unitário válido."
            );
          }

          return item.productId
            ? {
                productId: item.productId,
                quantity,
                unitPriceCents
              }
            : {
                productName: item.productName,
                ...(item.productDescription
                  ? { productDescription: item.productDescription }
                  : {}),
                quantity,
                unitPriceCents
              };
        })
      };

      const createdVersion = await createQuoteVersion(selectedQuoteId, payload);

      await refreshQuotesWorkspace();
      await loadQuotePanel(selectedQuoteId);
      setDetailMessage(
        `Nova versão criada com sucesso: revisão ${createdVersion.versionNumber}.`
      );
    } catch (revisionError: unknown) {
      setDetailError(
        revisionError instanceof Error
          ? revisionError.message
          : "Falha ao criar nova revisão."
      );
    } finally {
      setIsSubmittingRevision(false);
    }
  }

  return (
    <div className="grid gap-5">
      <header className="flex flex-col gap-5 rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.32em] text-sky-200">
            Orcamentos
          </span>
          <h1 className="mt-4 text-4xl leading-tight tracking-tight text-white">
            Monte, acompanhe e distribua propostas comerciais
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Trabalhe com versões congeladas, exportação estável e distribuição
            pública do tenant {tenant?.name}.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-200">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-sky-200/70">
            Panorama
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            {quotes.length} orçamento(s), {customers.length} cliente(s) e{" "}
            {products.length} produto(s) disponíveis para operação.
          </p>
        </div>
      </header>

      {pageError ? (
        <section className="rounded-[1.75rem] border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-100">
          {pageError}
        </section>
      ) : null}

      <div className="grid gap-5">
        <section className="grid gap-5">
          <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
                  Novo orçamento
                </p>
                <h2 className="mt-3 text-2xl text-white">
                  Criar orçamento com item de catálogo
                </h2>
              </div>

              <button
                type="button"
                onClick={handleResetQuoteForm}
                className="inline-flex w-fit rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Limpar formulário
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleCreateQuote}>
              <label className="grid gap-2 text-sm text-slate-200">
                <span>Cliente</span>
                <select
                  value={createForm.customerId}
                  onChange={(event) =>
                    handleCreateFormFieldChange("customerId", event.target.value)
                  }
                  className="rounded-2xl border border-white/10 bg-[#0c1526] px-4 py-3 text-white outline-none transition focus:border-sky-300/40"
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-slate-200">
                <span>Título</span>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(event) =>
                    handleCreateFormFieldChange("title", event.target.value)
                  }
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                  placeholder="Orçamento corporativo de notebooks"
                  required
                />
              </label>

              <div className="grid gap-4 md:grid-cols-[1fr_140px]">
                <label className="grid gap-2 text-sm text-slate-200">
                  <span>Produto</span>
                  <select
                    value={createForm.productId}
                    onChange={(event) =>
                      handleCreateFormFieldChange("productId", event.target.value)
                    }
                    className="rounded-2xl border border-white/10 bg-[#0c1526] px-4 py-3 text-white outline-none transition focus:border-sky-300/40"
                    required
                  >
                    <option value="">Selecione um produto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-slate-200">
                  <span>Quantidade</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={createForm.quantity}
                    onChange={(event) =>
                      handleCreateFormFieldChange("quantity", event.target.value)
                    }
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                    required
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm text-slate-200">
                <span>Notas públicas</span>
                <textarea
                  value={createForm.publicNotes}
                  onChange={(event) =>
                    handleCreateFormFieldChange("publicNotes", event.target.value)
                  }
                  className="min-h-24 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                  placeholder="Observações visíveis no documento compartilhado."
                />
              </label>

              <label className="grid gap-2 text-sm text-slate-200">
                <span>Notas internas</span>
                <textarea
                  value={createForm.internalNotes}
                  onChange={(event) =>
                    handleCreateFormFieldChange("internalNotes", event.target.value)
                  }
                  className="min-h-24 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                  placeholder="Contexto interno para equipe comercial."
                />
              </label>

              {createMessage ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
                  {createMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={
                  isSubmittingQuote ||
                  isLoadingBootstrap ||
                  customers.length === 0 ||
                  products.length === 0
                }
                className="inline-flex w-fit rounded-full border border-sky-300/20 bg-sky-400/10 px-5 py-3 font-medium text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingQuote ? "Criando..." : "Criar orçamento"}
              </button>
            </form>
          </article>

          <article className="rounded-[1.75rem] border border-sky-300/15 bg-slate-950/45 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
                  Assistente IA
                </p>
                <h2 className="mt-3 text-2xl text-white">
                  Gerar payload estruturado a partir de briefing
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  Descreva a necessidade comercial e deixe a camada de IA preparar
                  um JSON revisavel para o fluxo de importacao.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseAiDraftExample}
                  disabled={customers.length === 0}
                  className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Usar briefing exemplo
                </button>
                <button
                  type="button"
                  onClick={handleResetAiDraft}
                  className="inline-flex rounded-full border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                  Limpar IA
                </button>
                <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] text-slate-300">
                  {isLoadingAiCapabilities
                    ? "Verificando"
                    : hasAiDraftProvider
                      ? `Ativo: ${aiDraftCapabilities?.providers[0]?.providerName}`
                      : "Sem provider"}
                </span>
              </div>
            </div>

            {aiDraftCapabilitiesError ? (
              <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {aiDraftCapabilitiesError}
              </div>
            ) : null}

            {!isLoadingAiCapabilities && !hasAiDraftProvider ? (
              <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm leading-7 text-amber-50">
                Nenhum provider de IA está ativo. Para testar em desenvolvimento,
                configure <code className="font-mono">AI_QUOTE_DRAFT_PROVIDER=local</code>{" "}
                e reinicie o servidor.
              </div>
            ) : null}

            {hasAiDraftProvider ? (
              <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
                Provider pronto para gerar um JSON revisavel sem gravar nada
                automaticamente.
                <span className="mt-2 block font-mono text-xs uppercase tracking-[0.18em] text-emerald-100/75">
                  Prompt {aiDraftCapabilities?.promptVersion} | Schema{" "}
                  {aiDraftCapabilities?.outputSchemaVersion}
                </span>
              </div>
            ) : null}

            <form className="mt-6 grid gap-4" onSubmit={handleGenerateAiDraft}>
              <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                <label className="grid gap-2 text-sm text-slate-200">
                  <span>Cliente</span>
                  <select
                    value={aiDraftForm.customerId}
                    onChange={(event) =>
                      handleAiDraftFormFieldChange("customerId", event.target.value)
                    }
                    className="rounded-2xl border border-white/10 bg-[#0c1526] px-4 py-3 text-white outline-none transition focus:border-sky-300/40"
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-slate-200">
                  <span>Budget maximo</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={aiDraftForm.budgetMaxCents}
                    onChange={(event) =>
                      handleAiDraftFormFieldChange(
                        "budgetMaxCents",
                        event.target.value
                      )
                    }
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                    placeholder="12000,00"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm text-slate-200">
                <span>Briefing</span>
                <textarea
                  value={aiDraftForm.userText}
                  onChange={(event) =>
                    handleAiDraftFormFieldChange("userText", event.target.value)
                  }
                  className="min-h-32 rounded-2xl border border-white/10 bg-[#0c1526] px-4 py-3 text-sm leading-7 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                  placeholder="Ex: Preciso de tres notebooks corporativos para uma equipe comercial, com boa bateria e garantia."
                  required
                />
              </label>

              {aiDraftError ? (
                <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-50">
                  {aiDraftError}
                </div>
              ) : null}

              {aiDraftMessage ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
                  {aiDraftMessage}
                </div>
              ) : null}

              {aiDraftReview ? (
                <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <p>
                      {aiDraftReview.title} gerado por {aiDraftReview.provider}.
                    </p>
                    <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-200">
                      Confiança media{" "}
                      {Math.round(aiDraftReview.confidenceSummary.average * 100)}%
                    </p>
                  </div>

                  {aiDraftReview.warnings.length ? (
                    <ul className="grid gap-2 text-sm leading-6 text-amber-100">
                      {aiDraftReview.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  ) : null}

                  <button
                    type="button"
                    onClick={scrollToImportJsonSection}
                    className="inline-flex w-fit rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-400/20"
                  >
                    Revisar JSON gerado
                  </button>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={
                  isGeneratingAiDraft ||
                  isLoadingBootstrap ||
                  isLoadingAiCapabilities ||
                  !hasAiDraftProvider ||
                  customers.length === 0 ||
                  aiDraftForm.userText.trim().length < 10
                }
                className="inline-flex w-fit rounded-full border border-sky-300/20 bg-sky-400/10 px-5 py-3 font-medium text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGeneratingAiDraft ? "Gerando..." : "Gerar JSON com IA"}
              </button>
            </form>
          </article>

          <article
            ref={importJsonSectionRef}
            className="scroll-mt-6 rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
                  Importar JSON
                </p>
                <h2 className="mt-3 text-2xl text-white">
                  Criar draft revisavel a partir de payload estruturado
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  Cole um JSON compativel para acelerar a montagem do orcamento.
                  O backend normaliza os itens e abre o draft para revisao.
                </p>
              </div>

              <button
                type="button"
                onClick={handleUseImportExample}
                disabled={customers.length === 0}
                className="inline-flex w-fit rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Usar exemplo
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleImportQuoteJson}>
              <label className="grid gap-2 text-sm text-slate-200">
                <span>Payload JSON</span>
                <textarea
                  value={importJsonText}
                  onChange={(event) => {
                    setImportJsonText(event.target.value);
                    setImportError(null);
                    setImportMessage(null);
                  }}
                  className="min-h-56 rounded-2xl border border-white/10 bg-[#0c1526] px-4 py-3 font-mono text-xs leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                  placeholder='{"schemaVersion":"1.0","customerId":"...","currency":"BRL","category":"notebooks","items":[{"type":"notebook","model":"Notebook corporativo","quantity":2}]}'
                  spellCheck={false}
                  required
                />
              </label>

              {importError ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {importError}
                </div>
              ) : null}

              {importMessage ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
                  {importMessage}
                </div>
              ) : null}

              {importResult ? (
                <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <p>
                      {importResult.normalizedItems.length} item(ns)
                      normalizado(s) na versao importada.
                    </p>
                    <button
                      type="button"
                      onClick={() => openQuotePanelRoute(importResult.quoteId)}
                      className="text-left text-sky-300 underline-offset-4 hover:underline md:text-right"
                    >
                      Abrir draft importado
                    </button>
                  </div>

                  {importResult.warnings.length ? (
                    <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-3 text-amber-50">
                      <p className="font-medium">Alertas para revisar</p>
                      <ul className="mt-2 grid gap-2 text-sm leading-6">
                        {importResult.warnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={
                  isImportingQuote ||
                  isLoadingBootstrap ||
                  customers.length === 0 ||
                  importJsonText.trim().length === 0
                }
                className="inline-flex w-fit rounded-full border border-sky-300/20 bg-sky-400/10 px-5 py-3 font-medium text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isImportingQuote ? "Importando..." : "Criar draft revisavel"}
              </button>
            </form>
          </article>

          <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
                  Lista de orçamentos
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  {filteredQuotes.length} de {quotes.length} orcamento(s) visiveis.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(220px,360px)_180px]">
                <label className="grid gap-2 text-sm text-slate-200">
                  <span>Buscar</span>
                  <input
                    type="search"
                    value={quoteSearch}
                    onChange={(event) => setQuoteSearch(event.target.value)}
                    className="rounded-2xl border border-white/10 bg-[#0c1526] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                    placeholder="Titulo, cliente ou versao"
                  />
                </label>

                <label className="grid gap-2 text-sm text-slate-200">
                  <span>Status</span>
                  <select
                    value={quoteStatusFilter}
                    onChange={(event) =>
                      setQuoteStatusFilter(event.target.value as QuoteStatusFilter)
                    }
                    className="rounded-2xl border border-white/10 bg-[#0c1526] px-4 py-3 text-white outline-none transition focus:border-sky-300/40"
                  >
                    <option value="all">Todos</option>
                    <option value="draft">Draft</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </label>
              </div>
            </div>

            {quoteSearch || quoteStatusFilter !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setQuoteSearch("");
                  setQuoteStatusFilter("all");
                }}
                className="mt-4 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Limpar filtros
              </button>
            ) : null}
            <div className="mt-6 grid gap-3">
              {isLoadingBootstrap ? (
                [0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-24 rounded-2xl border border-white/10 bg-white/5"
                  />
                ))
              ) : paginatedQuotes.length ? (
                paginatedQuotes.map((quote) => {
                  const isSelected = quote.id === selectedQuoteId;
                  const customer = customerMap.get(quote.customerId);

                  return (
                    <button
                      key={quote.id}
                      type="button"
                      onClick={() => openQuotePanelRoute(quote.id)}
                      aria-current={isSelected ? "true" : undefined}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        isSelected
                          ? "border-sky-300/30 bg-sky-400/15"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-base font-medium text-white">
                            {quote.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-300">
                            {customer?.name ?? "Cliente não carregado"}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            Versão atual: {quote.currentVersion.versionNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-[var(--accent)]">
                            {formatCurrency(
                              quote.currentVersion.totalCents,
                              quote.currentVersion.currency
                            )}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                            {formatStatus(quote.status)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : quotes.length ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                  Nenhum orcamento encontrado com os filtros atuais.
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                  Nenhum orçamento cadastrado ainda.
                </div>
              )}
            </div>
            {filteredQuotes.length > quotePageSize ? (
              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
                <p>
                  Mostrando {quotePageStart}-{quotePageEnd} de{" "}
                  {filteredQuotes.length} orcamento(s).
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setQuotePage((currentPage) => Math.max(1, currentPage - 1))
                    }
                    disabled={quotePage <= 1}
                    className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="inline-flex rounded-full border border-white/10 bg-[#0c1526] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-sky-200">
                    {quotePage}/{quoteTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuotePage((currentPage) =>
                        Math.min(quoteTotalPages, currentPage + 1)
                      )
                    }
                    disabled={quotePage >= quoteTotalPages}
                    className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Proxima
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        </section>

        {selectedQuoteId ? (
          <section className="fixed inset-0 z-40 overflow-y-auto bg-black/70 px-3 py-4 backdrop-blur-sm md:px-6 md:py-8">
            <button
              type="button"
              aria-label="Fechar painel do orçamento"
              className="fixed inset-0 h-full w-full cursor-default"
              onClick={handleCloseQuotePanel}
            />
          <article className="relative z-10 mx-auto max-w-[1320px] rounded-[1.75rem] border border-white/10 bg-slate-950 p-5 shadow-2xl md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
                  Painel do orçamento
                </p>
                <h2 className="mt-3 text-2xl text-white">
                  {selectedQuoteDetail?.title ?? "Selecione um orçamento"}
                </h2>
              </div>

              {selectedQuoteDetail ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleCreateShareLink()}
                    disabled={isRunningAction}
                    className="inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Criar share link
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleExportQuote()}
                    disabled={isRunningAction}
                    className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Exportar JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleGeneratePdf()}
                    disabled={isRunningAction}
                    className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Gerar PDF
                  </button>
                  {pdfResult ? (
                    <Link
                      href={`/quotes/${selectedQuoteId}/document?quoteVersionId=${selectedQuoteDetail.currentVersion.id}`}
                      className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Abrir documento
                    </Link>
                  ) : null}
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleCloseQuotePanel}
                className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Fechar
              </button>
            </div>

            {isLoadingDetail ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
                Carregando detalhes do orçamento selecionado...
              </div>
            ) : null}

            {detailError ? (
              <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {detailError}
              </div>
            ) : null}

            {detailMessage ? (
              <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
                {detailMessage}
              </div>
            ) : null}

            {!selectedQuoteDetail && !isLoadingDetail ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                Escolha um orçamento na lista para visualizar versões e executar
                ações comerciais.
              </div>
            ) : null}

            {selectedQuoteDetail ? (
              <div className="mt-6 grid gap-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-400">Cliente</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {customerMap.get(selectedQuoteDetail.customerId)?.name ??
                        "Cliente não carregado"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-400">Versão atual</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {selectedQuoteDetail.currentVersion.versionNumber}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-400">Total atual</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatCurrency(
                        selectedQuoteDetail.currentVersion.totalCents,
                        selectedQuoteDetail.currentVersion.currency
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="grid gap-5">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="font-mono text-xs uppercase tracking-[0.24em] text-sky-200/80">
                        Versões
                      </p>
                      <div className="mt-4 grid gap-4">
                        {selectedQuoteDetail.versions.map((version) => {
                          const isCurrentVersion =
                            version.id === selectedQuoteDetail.currentVersion.id;

                          return (
                            <div
                              key={version.id}
                              className={`relative rounded-2xl border p-4 ${
                                isCurrentVersion
                                  ? "border-sky-300/30 bg-sky-400/10"
                                  : "border-white/10 bg-[#0b1322]"
                              }`}
                            >
                              <div className="absolute left-4 top-5 h-[calc(100%-2.5rem)] w-px bg-white/10" />
                              <div
                                className={`absolute left-[11px] top-5 h-3 w-3 rounded-full ${
                                  isCurrentVersion
                                    ? "bg-sky-300 shadow-[0_0_18px_rgba(125,211,252,0.55)]"
                                    : "bg-slate-500"
                                }`}
                              />

                              <div className="ml-7 grid gap-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-base font-medium text-white">
                                        Versao {version.versionNumber}
                                      </p>
                                      {isCurrentVersion ? (
                                        <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-100">
                                          Atual
                                        </span>
                                      ) : null}
                                    </div>
                                    <p className="mt-2 text-sm text-slate-300">
                                      {version.label ?? "Sem label"} |{" "}
                                      {formatSourceType(version.sourceType)} |{" "}
                                      {version.items.length} item(ns)
                                    </p>
                                    <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
                                      {formatDate(version.createdAt)}
                                    </p>
                                  </div>

                                  <div className="text-left md:text-right">
                                    <p className="text-base font-semibold text-[var(--accent)]">
                                      {formatCurrency(
                                        version.totalCents,
                                        version.currency
                                      )}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                      Subtotal{" "}
                                      {formatCurrency(
                                        version.subtotalCents,
                                        version.currency
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid gap-2">
                                  {version.items.slice(0, 3).map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm md:flex-row md:items-center md:justify-between"
                                    >
                                      <span className="text-slate-200">
                                        {item.quantity}x {item.productName}
                                      </span>
                                      <span className="text-slate-400">
                                        {formatCurrency(
                                          item.totalPriceCents,
                                          version.currency
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                  {version.items.length > 3 ? (
                                    <p className="text-xs text-slate-500">
                                      +{version.items.length - 3} item(ns) nesta
                                      versao
                                    </p>
                                  ) : null}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void handleGeneratePdf(version.id)}
                                    disabled={isRunningAction}
                                    className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Gerar documento
                                  </button>
                                  <Link
                                    href={`/quotes/${selectedQuoteId}/document?quoteVersionId=${version.id}`}
                                    className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                                  >
                                    Abrir preview
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleCreateShareLink(version.id)
                                    }
                                    disabled={isRunningAction}
                                    className="inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Publicar link
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="font-mono text-xs uppercase tracking-[0.24em] text-sky-200/80">
                        Nova revisão
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        Ajuste quantidades e preços unitários para congelar uma nova
                        versão do orçamento atual.
                      </p>

                      <form className="mt-5 grid gap-4" onSubmit={handleCreateRevision}>
                        <label className="grid gap-2 text-sm text-slate-200">
                          <span>Label da revisão</span>
                          <input
                            type="text"
                            value={revisionForm.label}
                            onChange={(event) =>
                              handleRevisionFieldChange("label", event.target.value)
                            }
                            className="rounded-2xl border border-white/10 bg-[#0b1322] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                            placeholder="Revisão comercial"
                          />
                        </label>

                        <div className="grid gap-3">
                          {revisionForm.items.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-2xl border border-white/10 bg-[#0b1322] p-4"
                            >
                              <p className="text-base font-medium text-white">
                                {item.productName}
                              </p>
                              <p className="mt-1 text-sm text-slate-400">
                                {item.productDescription || "Sem descrição adicional."}
                              </p>
                              <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <label className="grid gap-2 text-sm text-slate-200">
                                  <span>Quantidade</span>
                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={item.quantity}
                                    onChange={(event) =>
                                      handleRevisionItemFieldChange(
                                        item.id,
                                        "quantity",
                                        event.target.value
                                      )
                                    }
                                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/40"
                                    required
                                  />
                                </label>
                                <label className="grid gap-2 text-sm text-slate-200">
                                  <span>Preço unitário</span>
                                  <input
                                    type="text"
                                    value={item.unitPrice}
                                    onChange={(event) =>
                                      handleRevisionItemFieldChange(
                                        item.id,
                                        "unitPrice",
                                        event.target.value
                                      )
                                    }
                                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/40"
                                    placeholder="100,00"
                                    required
                                  />
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingRevision || revisionForm.items.length === 0}
                          className="inline-flex w-fit rounded-full border border-sky-300/20 bg-sky-400/10 px-5 py-3 font-medium text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSubmittingRevision ? "Criando revisão..." : "Criar nova versão"}
                        </button>
                      </form>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="font-mono text-xs uppercase tracking-[0.24em] text-sky-200/80">
                        Export JSON
                      </p>
                      {exportedJson ? (
                        <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-[#0b1322] p-4 text-xs leading-6 text-slate-200">
{JSON.stringify(exportedJson, null, 2)}
                        </pre>
                      ) : (
                        <p className="mt-4 text-sm leading-7 text-slate-300">
                          Gere a exportação estável da versão atual para visualizar o payload.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-5">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="font-mono text-xs uppercase tracking-[0.24em] text-sky-200/80">
                        Share links
                      </p>
                      <div className="mt-4 grid gap-3">
                        {shareLinks.length ? (
                          shareLinks.map((shareLink) => (
                            <div
                              key={shareLink.id}
                              className="rounded-2xl border border-white/10 bg-[#0b1322] p-4"
                            >
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-white">
                                    {shareLink.slug}
                                  </p>
                                  <p className="mt-2 truncate rounded-full border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-slate-300">
                                    {shareLink.url}
                                  </p>
                                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                                    Status: {shareLink.status}
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void handleCopyShareLink(shareLink)}
                                    className="inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-400/20"
                                  >
                                    {copiedShareLinkId === shareLink.id
                                      ? "Copiado"
                                      : "Copiar"}
                                  </button>
                                  <a
                                    href={shareLink.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                                  >
                                    Abrir
                                  </a>
                                  {shareLink.status === "active" ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void handleRevokeShareLink(shareLink.id)
                                      }
                                      disabled={isRunningAction}
                                      className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      Revogar
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm leading-7 text-slate-300">
                            Ainda não existem links públicos para este orçamento.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="font-mono text-xs uppercase tracking-[0.24em] text-sky-200/80">
                        PDF
                      </p>
                      {pdfResult ? (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-[#0b1322] p-4">
                          <p className="text-sm text-slate-300">
                            Documento pronto para a versão {pdfResult.quoteVersionId}.
                          </p>
                          <Link
                            href={`/quotes/${selectedQuoteId}/document?quoteVersionId=${selectedQuoteDetail.currentVersion.id}`}
                            className="mt-3 inline-flex text-sm text-sky-300 underline-offset-4 hover:underline"
                          >
                            Abrir pré-visualização autenticada
                          </Link>
                          <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-400">
                            Endpoint bruto: {pdfResult.fileUrl}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-4 text-sm leading-7 text-slate-300">
                          Gere o documento comercial HTML/PDF da versão corrente.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </article>
        </section>
        ) : null}
      </div>
    </div>
  );
}
