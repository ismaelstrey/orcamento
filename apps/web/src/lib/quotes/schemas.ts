import { z } from "zod";

export const quoteItemInputSchema = z
  .object({
    productId: z.string().min(1).optional(),
    productName: z.string().min(2).max(180).optional(),
    productDescription: z.string().max(4000).optional(),
    quantity: z.number().int().positive(),
    unitPriceCents: z.number().int().nonnegative().optional()
  })
  .superRefine((value, context) => {
    const hasProduct = Boolean(value.productId);
    const hasManual = Boolean(
      value.productName && value.unitPriceCents !== undefined
    );

    if (!hasProduct && !hasManual) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Informe productId ou item manual com productName e unitPriceCents."
      });
    }
  });

export const createQuoteRequestSchema = z.object({
  customerId: z.string().min(1),
  title: z.string().min(2).max(180),
  publicNotes: z.string().max(4000).optional(),
  internalNotes: z.string().max(4000).optional(),
  items: z.array(quoteItemInputSchema).min(1)
});

export const updateQuoteRequestSchema = z.object({
  title: z.string().min(2).max(180).optional(),
  publicNotes: z.string().max(4000).optional(),
  internalNotes: z.string().max(4000).optional(),
  status: z.enum(["draft", "published", "archived"]).optional()
});

export const createQuoteVersionRequestSchema = z.object({
  label: z.string().max(160).optional(),
  items: z.array(quoteItemInputSchema).min(1)
});

export const quoteParamsSchema = z.object({
  quoteId: z.string().min(1)
});

export const quoteVersionParamsSchema = z.object({
  quoteId: z.string().min(1),
  versionId: z.string().min(1)
});

export const createShareLinkRequestSchema = z.object({
  quoteVersionId: z.string().min(1),
  expiresAt: z.string().datetime().optional()
});

export const generatePdfRequestSchema = z.object({
  quoteVersionId: z.string().min(1).optional()
});

export const importQuoteJsonItemSchema = z.object({
  type: z.string().min(1).max(80),
  model: z.string().min(1).max(180),
  quantity: z.number().int().positive()
});

export const importQuoteJsonRequestSchema = z.object({
  customerId: z.string().min(1),
  schemaVersion: z.string().min(1),
  currency: z.string().length(3),
  category: z.string().min(1).max(120),
  budgetMaxCents: z.number().int().positive().optional(),
  usageContext: z.string().max(500).optional(),
  items: z.array(importQuoteJsonItemSchema).min(1),
  notes: z.string().max(4000).optional()
});

export const shareLinkParamsSchema = z.object({
  quoteId: z.string().min(1),
  shareLinkId: z.string().min(1)
});

export const publicQuoteSlugParamsSchema = z.object({
  slug: z.string().min(1)
});

export const quoteSummarySchema = z.object({
  id: z.string(),
  customerId: z.string(),
  title: z.string(),
  status: z.enum(["draft", "published", "archived"]),
  publicNotes: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  currentVersion: z.object({
    id: z.string(),
    versionNumber: z.number().int().positive(),
    subtotalCents: z.number().int().nonnegative(),
    discountCents: z.number().int().nonnegative(),
    totalCents: z.number().int().nonnegative(),
    currency: z.string()
  })
});

export const quoteVersionResponseSchema = z.object({
  id: z.string(),
  versionNumber: z.number().int().positive(),
  label: z.string().nullable().optional(),
  currency: z.string(),
  subtotalCents: z.number().int(),
  discountCents: z.number().int(),
  totalCents: z.number().int(),
  sourceType: z.enum(["manual", "import_json", "ai_future"]),
  createdAt: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
      productId: z.string().nullable().optional(),
      productName: z.string(),
      productDescription: z.string().nullable().optional(),
      quantity: z.number().int().positive(),
      unitPriceCents: z.number().int().nonnegative(),
      totalPriceCents: z.number().int().nonnegative()
    })
  )
});

export const quoteDetailSchema = quoteSummarySchema.extend({
  versions: z.array(quoteVersionResponseSchema)
});

export const shareLinkResponseSchema = z.object({
  id: z.string(),
  quoteId: z.string(),
  quoteVersionId: z.string(),
  slug: z.string(),
  url: z.string().url(),
  status: z.enum(["active", "revoked", "expired"]),
  expiresAt: z.string().nullable().optional(),
  revokedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const publicQuoteShareSchema = z.object({
  slug: z.string(),
  status: z.enum(["active", "revoked", "expired"]),
  expiresAt: z.string().nullable().optional(),
  quote: z.object({
    id: z.string(),
    title: z.string(),
    customerName: z.string(),
    publicNotes: z.string().nullable().optional()
  }),
  version: quoteVersionResponseSchema
});

export const pdfResponseSchema = z.object({
  fileUrl: z.string().url(),
  quoteVersionId: z.string()
});

export const importQuoteJsonResponseSchema = z.object({
  quoteId: z.string(),
  versionId: z.string(),
  warnings: z.array(z.string()).default([]),
  normalizedItems: z.array(
    z.object({
      inputType: z.string(),
      inputModel: z.string(),
      matchedProductId: z.string().optional(),
      resolvedName: z.string(),
      quantity: z.number().int().positive()
    })
  )
});

export const exportQuoteJsonResponseSchema = z.object({
  schemaVersion: z.string(),
  quote: z.object({
    id: z.string(),
    title: z.string()
  }),
  version: z.object({
    id: z.string(),
    versionNumber: z.number().int().positive(),
    currency: z.string(),
    totalCents: z.number().int().nonnegative()
  }),
  items: z.array(
    z.object({
      productName: z.string(),
      quantity: z.number().int().positive(),
      unitPriceCents: z.number().int().nonnegative()
    })
  )
});

export type QuoteItemInput = z.infer<typeof quoteItemInputSchema>;
export type ImportQuoteJsonItem = z.infer<typeof importQuoteJsonItemSchema>;
export type CreateQuoteRequest = z.infer<typeof createQuoteRequestSchema>;
export type CreateQuoteVersionRequest = z.infer<
  typeof createQuoteVersionRequestSchema
>;
export type CreateShareLinkRequest = z.infer<typeof createShareLinkRequestSchema>;
export type GeneratePdfRequest = z.infer<typeof generatePdfRequestSchema>;
export type ImportQuoteJsonRequest = z.infer<typeof importQuoteJsonRequestSchema>;
export type UpdateQuoteRequest = z.infer<typeof updateQuoteRequestSchema>;
export type QuoteSummary = z.infer<typeof quoteSummarySchema>;
export type QuoteDetail = z.infer<typeof quoteDetailSchema>;
export type QuoteVersionResponse = z.infer<typeof quoteVersionResponseSchema>;
export type ShareLinkResponse = z.infer<typeof shareLinkResponseSchema>;
export type PublicQuoteShare = z.infer<typeof publicQuoteShareSchema>;
export type PdfResponse = z.infer<typeof pdfResponseSchema>;
export type ImportQuoteJsonResponse = z.infer<
  typeof importQuoteJsonResponseSchema
>;
export type ExportQuoteJsonResponse = z.infer<
  typeof exportQuoteJsonResponseSchema
>;
