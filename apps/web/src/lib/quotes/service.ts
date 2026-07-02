import { randomBytes } from "node:crypto";
import { AuthError, authorizeRoles, type AuthContext } from "@orcamento/auth";
import type { Prisma, Product, QuoteShareLinkStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit/service";
import { prisma } from "@/lib/db/prisma";
import {
  mapQuoteDetailResponse,
  mapShareLinkResponse,
  mapQuoteSummaryResponse,
  mapQuoteVersionResponse
} from "./mapper";
import { renderQuotePdfTemplate } from "./pdfTemplate";
import {
  createQuoteRequestSchema,
  generatePdfRequestSchema,
  importQuoteJsonRequestSchema,
  createShareLinkRequestSchema,
  createQuoteVersionRequestSchema,
  publicQuoteSlugParamsSchema,
  quoteParamsSchema,
  shareLinkParamsSchema,
  quoteVersionParamsSchema,
  updateQuoteRequestSchema,
  type CreateQuoteRequest,
  type ExportQuoteJsonResponse,
  type GeneratePdfRequest,
  type ImportQuoteJsonRequest,
  type CreateShareLinkRequest,
  type CreateQuoteVersionRequest,
  type QuoteItemInput,
  type UpdateQuoteRequest
} from "./schemas";

interface ResolvedQuoteItem {
  productId: string | null;
  productName: string;
  productDescription: string | null;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  currency: string;
}

interface ResolvedImportQuoteItem {
  resolvedItem: ResolvedQuoteItem;
  normalizedItem: {
    inputType: string;
    inputModel: string;
    matchedProductId?: string;
    resolvedName: string;
    quantity: number;
  };
  warning?: string;
}

function ensureQuoteReadAccess(authContext: AuthContext): void {
  authorizeRoles(authContext, ["owner", "admin", "seller"]);
}

function ensureQuoteWriteAccess(authContext: AuthContext): void {
  authorizeRoles(authContext, ["owner", "admin", "seller"]);
}

async function logAuthenticatedAuditEvent(
  authContext: AuthContext,
  input: {
    action: string;
    entityType: string;
    entityId: string;
    payloadJson?: Prisma.InputJsonValue;
  }
): Promise<void> {
  await logAuditEvent({
    tenantId: authContext.tenantId,
    actorUserId: authContext.userId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    ...(input.payloadJson !== undefined ? { payloadJson: input.payloadJson } : {})
  });
}

const quoteWithVersionsInclude = {
  versions: {
    include: {
      items: true
    }
  }
} satisfies Prisma.QuoteInclude;

const quoteWithCustomerAndVersionsInclude = {
  customer: true,
  versions: {
    include: {
      items: true
    }
  }
} satisfies Prisma.QuoteInclude;

async function ensureCustomerBelongsToTenant(
  tenantId: string,
  customerId: string
): Promise<void> {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      tenantId
    }
  });

  if (!customer) {
    throw new AuthError(
      "tenant_scope_error",
      "Cliente não pertence ao tenant autenticado.",
      403
    );
  }
}

async function findProductForQuote(
  tenantId: string,
  productId: string
): Promise<Product> {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      tenantId
    }
  });

  if (!product) {
    throw new AuthError(
      "tenant_scope_error",
      "Produto não pertence ao tenant autenticado.",
      403
    );
  }

  return product;
}

async function resolveQuoteItem(
  tenantId: string,
  item: QuoteItemInput
): Promise<ResolvedQuoteItem> {
  if (item.productId) {
    const product = await findProductForQuote(tenantId, item.productId);
    const unitPriceCents = item.unitPriceCents ?? product.basePriceCents;
    const productName = item.productName ?? product.name;
    const productDescription = item.productDescription ?? product.description;

    return {
      productId: product.id,
      productName,
      productDescription,
      quantity: item.quantity,
      unitPriceCents,
      totalPriceCents: item.quantity * unitPriceCents,
      currency: product.currency
    };
  }

  if (!item.productName || item.unitPriceCents === undefined) {
    throw new AuthError(
      "validation_error",
      "Item manual exige productName e unitPriceCents.",
      400
    );
  }

  return {
    productId: null,
    productName: item.productName,
    productDescription: item.productDescription ?? null,
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    totalPriceCents: item.quantity * item.unitPriceCents,
    currency: "BRL"
  };
}

function resolveQuoteCurrency(items: ResolvedQuoteItem[]): string {
  const currencies = [...new Set(items.map((item) => item.currency))];

  if (currencies.length !== 1) {
    throw new AuthError(
      "currency_mismatch",
      "Todos os itens do orçamento devem usar a mesma moeda.",
      400
    );
  }

  return currencies[0] ?? "BRL";
}

async function resolveQuoteItems(
  tenantId: string,
  items: QuoteItemInput[]
): Promise<ResolvedQuoteItem[]> {
  return Promise.all(items.map((item) => resolveQuoteItem(tenantId, item)));
}

function normalizeImportSearchTerm(value: string): string {
  return value.trim().toLowerCase();
}

async function findProductForImport(
  tenantId: string,
  model: string,
  currency: string
): Promise<Product | null> {
  const normalizedModel = normalizeImportSearchTerm(model);
  const products = await prisma.product.findMany({
    where: {
      tenantId,
      currency,
      isActive: true,
      OR: [
        {
          name: {
            contains: normalizedModel,
            mode: "insensitive"
          }
        },
        {
          sku: {
            contains: normalizedModel,
            mode: "insensitive"
          }
        }
      ]
    },
    take: 5,
    orderBy: {
      updatedAt: "desc"
    }
  });

  const exactMatch = products.find(
    (product) => normalizeImportSearchTerm(product.name) === normalizedModel
  );

  return exactMatch ?? products[0] ?? null;
}

function buildImportQuoteTitle(input: {
  category: string;
  usageContext?: string | undefined;
}): string {
  if (input.usageContext?.trim()) {
    return `Importação ${input.category} - ${input.usageContext.trim()}`;
  }

  return `Importação ${input.category}`;
}

function buildImportInternalNotes(input: {
  schemaVersion: string;
  category: string;
  usageContext?: string | undefined;
  budgetMaxCents?: number | undefined;
}): string {
  const parts = [`Importado via JSON v${input.schemaVersion}.`];

  if (input.usageContext?.trim()) {
    parts.push(`Contexto: ${input.usageContext.trim()}.`);
  }

  if (input.budgetMaxCents !== undefined) {
    parts.push(`Budget máximo informado: ${input.budgetMaxCents} centavos.`);
  }

  parts.push(`Categoria informada: ${input.category}.`);

  return parts.join(" ");
}

async function resolveImportQuoteItem(
  tenantId: string,
  currency: string,
  item: ImportQuoteJsonRequest["items"][number]
): Promise<ResolvedImportQuoteItem> {
  const matchedProduct = await findProductForImport(tenantId, item.model, currency);

  if (matchedProduct) {
    return {
      resolvedItem: {
        productId: matchedProduct.id,
        productName: matchedProduct.name,
        productDescription: matchedProduct.description ?? null,
        quantity: item.quantity,
        unitPriceCents: matchedProduct.basePriceCents,
        totalPriceCents: item.quantity * matchedProduct.basePriceCents,
        currency: matchedProduct.currency
      },
      normalizedItem: {
        inputType: item.type,
        inputModel: item.model,
        matchedProductId: matchedProduct.id,
        resolvedName: matchedProduct.name,
        quantity: item.quantity
      }
    };
  }

  return {
    resolvedItem: {
      productId: null,
      productName: item.model,
      productDescription: `Item importado (${item.type}).`,
      quantity: item.quantity,
      unitPriceCents: 0,
      totalPriceCents: 0,
      currency
    },
    normalizedItem: {
      inputType: item.type,
      inputModel: item.model,
      resolvedName: item.model,
      quantity: item.quantity
    },
    warning: `Item "${item.model}" não encontrou produto compatível e foi importado como manual com valor zero.`
  };
}

async function resolveImportQuoteItems(
  tenantId: string,
  currency: string,
  items: ImportQuoteJsonRequest["items"]
) {
  return Promise.all(
    items.map((item) => resolveImportQuoteItem(tenantId, currency, item))
  );
}

function buildQuoteVersionTotals(items: ResolvedQuoteItem[]) {
  const subtotalCents = items.reduce(
    (total, item) => total + item.totalPriceCents,
    0
  );
  const discountCents = 0;
  const totalCents = subtotalCents - discountCents;
  const currency = resolveQuoteCurrency(items);

  return {
    currency,
    subtotalCents,
    discountCents,
    totalCents
  };
}

async function findQuoteWithVersions(
  tenantId: string,
  quoteId: string
) {
  return prisma.quote.findFirst({
    where: {
      id: quoteId,
      tenantId
    },
    include: quoteWithVersionsInclude
  });
}

async function findQuoteVersionWithItems(quoteId: string, versionId: string) {
  return prisma.quoteVersion.findFirst({
    where: {
      id: versionId,
      quoteId
    },
    include: {
      items: true
    }
  });
}

async function findQuoteShareLink(quoteId: string, shareLinkId: string) {
  return prisma.quoteShareLink.findFirst({
    where: {
      id: shareLinkId,
      quoteId
    }
  });
}

function buildPublicQuoteUrl(baseUrl: string, slug: string): string {
  return new URL(`/public/quotes/${slug}`, baseUrl).toString();
}

function generateShareLinkSlug(): string {
  return `q_${randomBytes(6).toString("hex")}`;
}

function getComputedShareLinkStatus(input: {
  status: QuoteShareLinkStatus;
  expiresAt: Date | null;
}): QuoteShareLinkStatus {
  if (
    input.status === "active" &&
    input.expiresAt &&
    input.expiresAt.getTime() < Date.now()
  ) {
    return "expired";
  }

  return input.status;
}

async function syncExpiredShareLinkStatus(shareLinkId: string) {
  return prisma.quoteShareLink.update({
    where: {
      id: shareLinkId
    },
    data: {
      status: "expired"
    }
  });
}

async function normalizeShareLinkStatus<T extends {
  id: string;
  status: QuoteShareLinkStatus;
  expiresAt: Date | null;
}>(shareLink: T): Promise<T> {
  const computedStatus = getComputedShareLinkStatus(shareLink);

  if (computedStatus === shareLink.status) {
    return shareLink;
  }

  const updatedShareLink = await syncExpiredShareLinkStatus(shareLink.id);

  return {
    ...shareLink,
    status: updatedShareLink.status
  };
}

async function ensureQuoteVersionBelongsToQuote(
  quoteId: string,
  versionId: string
) {
  return prisma.quoteVersion.findFirst({
    where: {
      id: versionId,
      quoteId
    },
    include: {
      items: true
    }
  });
}

function getCurrentQuoteVersion<T extends { versionNumber: number }>(
  versions: T[]
): T | null {
  return (
    [...versions].sort(
      (leftVersion, rightVersion) =>
        rightVersion.versionNumber - leftVersion.versionNumber
    )[0] ?? null
  );
}

function buildQuotePdfFileUrl(
  baseUrl: string,
  quoteId: string,
  quoteVersionId: string
): string {
  const pdfUrl = new URL(`/api/v1/quotes/${quoteId}/pdf`, baseUrl);
  pdfUrl.searchParams.set("quoteVersionId", quoteVersionId);

  return pdfUrl.toString();
}

function buildQuotePdfFileName(quoteTitle: string, versionNumber: number): string {
  const slug = quoteTitle
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${slug || "orcamento"}-v${versionNumber}.html`;
}

async function findQuoteForPdf(tenantId: string, quoteId: string) {
  return prisma.quote.findFirst({
    where: {
      id: quoteId,
      tenantId
    },
    include: quoteWithCustomerAndVersionsInclude
  });
}

async function resolveQuotePdfSource(
  tenantId: string,
  quoteId: string,
  requestedQuoteVersionId?: string
) {
  const quote = await findQuoteForPdf(tenantId, quoteId);

  if (!quote) {
    return null;
  }

  const version = requestedQuoteVersionId
    ? quote.versions.find((quoteVersion) => quoteVersion.id === requestedQuoteVersionId) ??
      null
    : getCurrentQuoteVersion(quote.versions);

  if (!version) {
    throw new AuthError(
      "pdf_generation_error",
      "Não foi possível identificar uma versão válida para gerar o PDF.",
      400
    );
  }

  return {
    quote,
    version
  };
}

/**
 * Lista os orçamentos do tenant com resumo da versão atual.
 */
export async function listQuotes(authContext: AuthContext) {
  ensureQuoteReadAccess(authContext);

  const quotes = await prisma.quote.findMany({
    where: {
      tenantId: authContext.tenantId
    },
    include: quoteWithVersionsInclude,
    orderBy: {
      updatedAt: "desc"
    }
  });

  return quotes.map(mapQuoteSummaryResponse);
}

/**
 * Cria o orçamento e já persiste a versão 1 congelando os itens resolvidos.
 */
export async function createQuote(
  authContext: AuthContext,
  input: CreateQuoteRequest
) {
  ensureQuoteWriteAccess(authContext);
  const parsedInput = createQuoteRequestSchema.parse(input);

  await ensureCustomerBelongsToTenant(authContext.tenantId, parsedInput.customerId);

  const resolvedItems = await resolveQuoteItems(
    authContext.tenantId,
    parsedInput.items
  );
  const { currency, subtotalCents, discountCents, totalCents } =
    buildQuoteVersionTotals(resolvedItems);

  const quote = await prisma.$transaction(async (transaction) => {
    const createdQuote = await transaction.quote.create({
      data: {
        tenantId: authContext.tenantId,
        customerId: parsedInput.customerId,
        title: parsedInput.title,
        publicNotes: parsedInput.publicNotes ?? null,
        internalNotes: parsedInput.internalNotes ?? null
      }
    });

    await transaction.quoteVersion.create({
      data: {
        quoteId: createdQuote.id,
        versionNumber: 1,
        currency,
        subtotalCents,
        discountCents,
        totalCents,
        sourceType: "manual",
        items: {
          create: resolvedItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productDescription: item.productDescription,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            totalPriceCents: item.totalPriceCents
          }))
        }
      }
    });

    return transaction.quote.findUniqueOrThrow({
      where: {
        id: createdQuote.id
      },
      include: quoteWithVersionsInclude
    });
  });

  const currentVersion = getCurrentQuoteVersion(quote.versions);

  await logAuthenticatedAuditEvent(authContext, {
    action: "quote.create",
    entityType: "quote",
    entityId: quote.id,
    payloadJson: {
      customerId: quote.customerId,
      currentVersionId: currentVersion?.id ?? null
    }
  });

  return mapQuoteSummaryResponse(quote);
}

/**
 * Importa um payload JSON estruturado e cria um draft inicial revisável.
 */
export async function importQuoteFromJson(
  authContext: AuthContext,
  input: ImportQuoteJsonRequest
) {
  ensureQuoteWriteAccess(authContext);
  const parsedInput = importQuoteJsonRequestSchema.parse(input);

  await ensureCustomerBelongsToTenant(authContext.tenantId, parsedInput.customerId);

  const resolvedItems = await resolveImportQuoteItems(
    authContext.tenantId,
    parsedInput.currency,
    parsedInput.items
  );
  const quoteItems = resolvedItems.map((item) => item.resolvedItem);
  const normalizedItems = resolvedItems.map((item) => item.normalizedItem);
  const warnings = resolvedItems
    .flatMap((item) => (item.warning ? [item.warning] : []))
    .filter((warning, index, allWarnings) => allWarnings.indexOf(warning) === index);
  const { currency, subtotalCents, discountCents, totalCents } =
    buildQuoteVersionTotals(quoteItems);

  if (currency !== parsedInput.currency) {
    warnings.push(
      `A moeda efetiva da importação foi ajustada para ${currency} conforme os itens resolvidos.`
    );
  }

  if (
    parsedInput.budgetMaxCents !== undefined &&
    totalCents > parsedInput.budgetMaxCents
  ) {
    warnings.push(
      `O total importado (${totalCents} centavos) excede o budget informado (${parsedInput.budgetMaxCents} centavos).`
    );
  }

  const quote = await prisma.$transaction(async (transaction) => {
    const createdQuote = await transaction.quote.create({
      data: {
        tenantId: authContext.tenantId,
        customerId: parsedInput.customerId,
        title: buildImportQuoteTitle({
          category: parsedInput.category,
          usageContext: parsedInput.usageContext
        }),
        publicNotes: parsedInput.notes ?? null,
        internalNotes: buildImportInternalNotes({
          schemaVersion: parsedInput.schemaVersion,
          category: parsedInput.category,
          usageContext: parsedInput.usageContext,
          budgetMaxCents: parsedInput.budgetMaxCents
        })
      }
    });

    const createdVersion = await transaction.quoteVersion.create({
      data: {
        quoteId: createdQuote.id,
        versionNumber: 1,
        label: "Importação JSON",
        currency,
        subtotalCents,
        discountCents,
        totalCents,
        sourceType: "import_json",
        items: {
          create: quoteItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productDescription: item.productDescription,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            totalPriceCents: item.totalPriceCents
          }))
        }
      }
    });

    return {
      quoteId: createdQuote.id,
      versionId: createdVersion.id
    };
  });

  await logAuthenticatedAuditEvent(authContext, {
    action: "quote.import_json",
    entityType: "quote",
    entityId: quote.quoteId,
    payloadJson: {
      versionId: quote.versionId,
      warningCount: warnings.length,
      normalizedItemsCount: normalizedItems.length
    }
  });

  return {
    quoteId: quote.quoteId,
    versionId: quote.versionId,
    warnings,
    normalizedItems
  };
}

/**
 * Exporta o snapshot da versão atual do orçamento em um JSON estável.
 */
export async function exportQuoteToJson(
  authContext: AuthContext,
  quoteId: string
): Promise<ExportQuoteJsonResponse | null> {
  ensureQuoteReadAccess(authContext);
  const params = quoteParamsSchema.parse({ quoteId });
  const quote = await findQuoteWithVersions(authContext.tenantId, params.quoteId);

  if (!quote) {
    return null;
  }

  const currentVersion = getCurrentQuoteVersion(quote.versions);

  if (!currentVersion) {
    throw new AuthError(
      "not_found",
      "Nenhuma versão encontrada para exportação do orçamento.",
      404
    );
  }

  await logAuthenticatedAuditEvent(authContext, {
    action: "quote.export_json",
    entityType: "quote_version",
    entityId: currentVersion.id,
    payloadJson: {
      quoteId: quote.id,
      versionNumber: currentVersion.versionNumber
    }
  });

  return {
    schemaVersion: "1.0.0",
    quote: {
      id: quote.id,
      title: quote.title
    },
    version: {
      id: currentVersion.id,
      versionNumber: currentVersion.versionNumber,
      currency: currentVersion.currency,
      totalCents: currentVersion.totalCents
    },
    items: currentVersion.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents
    }))
  };
}

/**
 * Retorna um orçamento com suas versões preservadas.
 */
export async function getQuoteById(authContext: AuthContext, quoteId: string) {
  ensureQuoteReadAccess(authContext);
  const params = quoteParamsSchema.parse({ quoteId });

  const quote = await findQuoteWithVersions(authContext.tenantId, params.quoteId);

  return quote ? mapQuoteDetailResponse(quote) : null;
}

/**
 * Lista as versões do orçamento já ordenadas da mais recente para a mais antiga.
 */
export async function listQuoteVersions(
  authContext: AuthContext,
  quoteId: string
) {
  ensureQuoteReadAccess(authContext);
  const params = quoteParamsSchema.parse({ quoteId });

  const quote = await findQuoteWithVersions(authContext.tenantId, params.quoteId);

  if (!quote) {
    return null;
  }

  return [...quote.versions]
    .sort(
      (leftVersion, rightVersion) =>
        rightVersion.versionNumber - leftVersion.versionNumber
    )
    .map(mapQuoteVersionResponse);
}

/**
 * Retorna uma versão específica do orçamento respeitando o escopo do tenant.
 */
export async function getQuoteVersionById(
  authContext: AuthContext,
  quoteId: string,
  versionId: string
) {
  ensureQuoteReadAccess(authContext);
  const params = quoteVersionParamsSchema.parse({ quoteId, versionId });

  const quote = await prisma.quote.findFirst({
    where: {
      id: params.quoteId,
      tenantId: authContext.tenantId
    },
    select: {
      id: true
    }
  });

  if (!quote) {
    return null;
  }

  const version = await findQuoteVersionWithItems(params.quoteId, params.versionId);

  return version ? mapQuoteVersionResponse(version) : null;
}

/**
 * Cria uma nova versão do orçamento preservando as anteriores como histórico.
 */
export async function createQuoteVersion(
  authContext: AuthContext,
  quoteId: string,
  input: CreateQuoteVersionRequest
) {
  ensureQuoteWriteAccess(authContext);
  const params = quoteParamsSchema.parse({ quoteId });
  const parsedInput = createQuoteVersionRequestSchema.parse(input);

  const quote = await findQuoteWithVersions(authContext.tenantId, params.quoteId);

  if (!quote) {
    return null;
  }

  const resolvedItems = await resolveQuoteItems(
    authContext.tenantId,
    parsedInput.items
  );
  const { currency, subtotalCents, discountCents, totalCents } =
    buildQuoteVersionTotals(resolvedItems);
  const nextVersionNumber =
    Math.max(...quote.versions.map((version) => version.versionNumber), 0) + 1;

  const version = await prisma.$transaction(async (transaction) => {
    const createdVersion = await transaction.quoteVersion.create({
      data: {
        quoteId: quote.id,
        versionNumber: nextVersionNumber,
        label: parsedInput.label ?? null,
        currency,
        subtotalCents,
        discountCents,
        totalCents,
        sourceType: "manual",
        items: {
          create: resolvedItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productDescription: item.productDescription,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            totalPriceCents: item.totalPriceCents
          }))
        }
      },
      include: {
        items: true
      }
    });

    await transaction.quote.update({
      where: {
        id: quote.id
      },
      data: {
        updatedAt: new Date()
      }
    });

    return createdVersion;
  });

  await logAuthenticatedAuditEvent(authContext, {
    action: "quote_version.create",
    entityType: "quote_version",
    entityId: version.id,
    payloadJson: {
      quoteId: quote.id,
      versionNumber: version.versionNumber
    }
  });

  return mapQuoteVersionResponse(version);
}

/**
 * Lista os links públicos gerados para um orçamento.
 */
export async function listQuoteShareLinks(
  authContext: AuthContext,
  quoteId: string,
  baseUrl: string
) {
  ensureQuoteReadAccess(authContext);
  const params = quoteParamsSchema.parse({ quoteId });

  const quote = await prisma.quote.findFirst({
    where: {
      id: params.quoteId,
      tenantId: authContext.tenantId
    },
    select: {
      id: true
    }
  });

  if (!quote) {
    return null;
  }

  const shareLinks = await prisma.quoteShareLink.findMany({
    where: {
      quoteId: quote.id,
      tenantId: authContext.tenantId
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const normalizedShareLinks = await Promise.all(
    shareLinks.map((shareLink) => normalizeShareLinkStatus(shareLink))
  );

  return normalizedShareLinks.map((shareLink) =>
    mapShareLinkResponse(
      shareLink,
      buildPublicQuoteUrl(baseUrl, shareLink.slug)
    )
  );
}

/**
 * Cria um novo share link vinculado a uma versão específica do orçamento.
 */
export async function createQuoteShareLink(
  authContext: AuthContext,
  quoteId: string,
  input: CreateShareLinkRequest,
  baseUrl: string
) {
  ensureQuoteWriteAccess(authContext);
  const params = quoteParamsSchema.parse({ quoteId });
  const parsedInput = createShareLinkRequestSchema.parse(input);

  const quote = await prisma.quote.findFirst({
    where: {
      id: params.quoteId,
      tenantId: authContext.tenantId
    },
    select: {
      id: true
    }
  });

  if (!quote) {
    return null;
  }

  const quoteVersion = await ensureQuoteVersionBelongsToQuote(
    quote.id,
    parsedInput.quoteVersionId
  );

  if (!quoteVersion) {
    throw new AuthError(
      "tenant_scope_error",
      "Versão do orçamento não pertence ao orçamento informado.",
      403
    );
  }

  const expiresAt = parsedInput.expiresAt
    ? new Date(parsedInput.expiresAt)
    : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

  if (expiresAt.getTime() <= Date.now()) {
    throw new AuthError(
      "validation_error",
      "expiresAt deve estar no futuro.",
      400
    );
  }

  let shareLink = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = generateShareLinkSlug();

    try {
      shareLink = await prisma.quoteShareLink.create({
        data: {
          tenantId: authContext.tenantId,
          quoteId: quote.id,
          quoteVersionId: quoteVersion.id,
          slug,
          expiresAt
        }
      });
      break;
    } catch (error: unknown) {
      const isUniqueViolation =
        error instanceof Error && error.message.includes("Unique constraint");

      if (!isUniqueViolation || attempt === 4) {
        throw error;
      }
    }
  }

  if (!shareLink) {
    throw new AuthError(
      "internal_server_error",
      "Não foi possível gerar um slug único para o share link.",
      500
    );
  }

  await logAuthenticatedAuditEvent(authContext, {
    action: "quote_share_link.create",
    entityType: "quote_share_link",
    entityId: shareLink.id,
    payloadJson: {
      quoteId: quote.id,
      quoteVersionId: shareLink.quoteVersionId,
      slug: shareLink.slug
    }
  });

  return mapShareLinkResponse(
    shareLink,
    buildPublicQuoteUrl(baseUrl, shareLink.slug)
  );
}

/**
 * Revoga logicamente um share link de um orçamento.
 */
export async function revokeQuoteShareLink(
  authContext: AuthContext,
  quoteId: string,
  shareLinkId: string,
  baseUrl: string
) {
  ensureQuoteWriteAccess(authContext);
  const params = shareLinkParamsSchema.parse({ quoteId, shareLinkId });

  const quote = await prisma.quote.findFirst({
    where: {
      id: params.quoteId,
      tenantId: authContext.tenantId
    },
    select: {
      id: true
    }
  });

  if (!quote) {
    return null;
  }

  const shareLink = await findQuoteShareLink(quote.id, params.shareLinkId);

  if (!shareLink) {
    return null;
  }

  const normalizedShareLink = await normalizeShareLinkStatus(shareLink);

  if (normalizedShareLink.status === "revoked") {
    return mapShareLinkResponse(
      normalizedShareLink,
      buildPublicQuoteUrl(baseUrl, normalizedShareLink.slug)
    );
  }

  const revokedShareLink = await prisma.quoteShareLink.update({
    where: {
      id: normalizedShareLink.id
    },
    data: {
      status: "revoked",
      revokedAt: new Date()
    }
  });

  await logAuthenticatedAuditEvent(authContext, {
    action: "quote_share_link.revoke",
    entityType: "quote_share_link",
    entityId: revokedShareLink.id,
    payloadJson: {
      quoteId: quote.id,
      quoteVersionId: revokedShareLink.quoteVersionId,
      slug: revokedShareLink.slug
    }
  });

  return mapShareLinkResponse(
    revokedShareLink,
    buildPublicQuoteUrl(baseUrl, revokedShareLink.slug)
  );
}

/**
 * Retorna o payload público de um orçamento compartilhado por slug.
 */
export async function getPublicQuoteBySlug(slug: string) {
  const params = publicQuoteSlugParamsSchema.parse({ slug });

  const shareLink = await prisma.quoteShareLink.findUnique({
    where: {
      slug: params.slug
    },
    include: {
      quote: {
        include: {
          customer: true
        }
      },
      quoteVersion: {
        include: {
          items: true
        }
      }
    }
  });

  if (!shareLink) {
    throw new AuthError(
      "not_found",
      "Link público não encontrado.",
      404
    );
  }

  const normalizedShareLink = await normalizeShareLinkStatus(shareLink);

  if (normalizedShareLink.status === "revoked") {
    throw new AuthError(
      "share_link_revoked",
      "Este link público foi revogado.",
      410
    );
  }

  if (normalizedShareLink.status === "expired") {
    throw new AuthError(
      "share_link_expired",
      "Este link público expirou.",
      410
    );
  }

  return {
    slug: normalizedShareLink.slug,
    status: normalizedShareLink.status,
    expiresAt: normalizedShareLink.expiresAt?.toISOString() ?? null,
    quote: {
      id: normalizedShareLink.quote.id,
      title: normalizedShareLink.quote.title,
      customerName: normalizedShareLink.quote.customer.name,
      publicNotes: normalizedShareLink.quote.publicNotes
    },
    version: mapQuoteVersionResponse(normalizedShareLink.quoteVersion)
  };
}

/**
 * Retorna a URL do documento comercial gerado a partir de uma versão do orçamento.
 */
export async function generateQuotePdf(
  authContext: AuthContext,
  quoteId: string,
  input: GeneratePdfRequest,
  baseUrl: string
) {
  ensureQuoteReadAccess(authContext);
  const params = quoteParamsSchema.parse({ quoteId });
  const parsedInput = generatePdfRequestSchema.parse(input);
  const source = await resolveQuotePdfSource(
    authContext.tenantId,
    params.quoteId,
    parsedInput.quoteVersionId
  );

  if (!source) {
    return null;
  }

  await logAuthenticatedAuditEvent(authContext, {
    action: "quote_pdf.generate",
    entityType: "quote_version",
    entityId: source.version.id,
    payloadJson: {
      quoteId: source.quote.id,
      versionNumber: source.version.versionNumber
    }
  });

  return {
    fileUrl: buildQuotePdfFileUrl(baseUrl, source.quote.id, source.version.id),
    quoteVersionId: source.version.id
  };
}

/**
 * Gera o documento HTML imprimível usado como base operacional do PDF no MVP.
 */
export async function getQuotePdfDocument(
  authContext: AuthContext,
  quoteId: string,
  input: GeneratePdfRequest
) {
  ensureQuoteReadAccess(authContext);
  const params = quoteParamsSchema.parse({ quoteId });
  const parsedInput = generatePdfRequestSchema.parse(input);
  const source = await resolveQuotePdfSource(
    authContext.tenantId,
    params.quoteId,
    parsedInput.quoteVersionId
  );

  if (!source) {
    return null;
  }

  return {
    fileName: buildQuotePdfFileName(
      source.quote.title,
      source.version.versionNumber
    ),
    quoteVersionId: source.version.id,
    html: renderQuotePdfTemplate({
      quoteId: source.quote.id,
      quoteTitle: source.quote.title,
      customerName: source.quote.customer.name,
      publicNotes: source.quote.publicNotes ?? null,
      issuedAt: new Date().toISOString(),
      version: mapQuoteVersionResponse(source.version)
    })
  };
}

/**
 * Atualiza apenas metadados do orçamento sem recriar versões.
 */
export async function updateQuote(
  authContext: AuthContext,
  quoteId: string,
  input: UpdateQuoteRequest
) {
  ensureQuoteWriteAccess(authContext);
  const params = quoteParamsSchema.parse({ quoteId });
  const parsedInput = updateQuoteRequestSchema.parse(input);

  const currentQuote = await findQuoteWithVersions(
    authContext.tenantId,
    params.quoteId
  );

  if (!currentQuote) {
    return null;
  }

  const updatedQuote = await prisma.quote.update({
    where: {
      id: currentQuote.id
    },
    data: {
      ...(parsedInput.title !== undefined ? { title: parsedInput.title } : {}),
      ...(parsedInput.publicNotes !== undefined
        ? { publicNotes: parsedInput.publicNotes ?? null }
        : {}),
      ...(parsedInput.internalNotes !== undefined
        ? { internalNotes: parsedInput.internalNotes ?? null }
        : {}),
      ...(parsedInput.status !== undefined ? { status: parsedInput.status } : {})
    },
    include: quoteWithVersionsInclude
  });

  await logAuthenticatedAuditEvent(authContext, {
    action: "quote.update",
    entityType: "quote",
    entityId: updatedQuote.id,
    payloadJson: {
      status: updatedQuote.status,
      title: updatedQuote.title
    }
  });

  return mapQuoteDetailResponse(updatedQuote);
}
