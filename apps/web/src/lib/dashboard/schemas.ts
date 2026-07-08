import { z } from "zod";

export const dashboardTopProductSchema = z.object({
  productId: z.string().nullable().optional(),
  productName: z.string(),
  uses: z.number().int().nonnegative()
});

export const dashboardRecentQuoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  customerName: z.string(),
  status: z.enum(["draft", "published", "archived"]),
  versionNumber: z.number().int().positive(),
  totalCents: z.number().int().nonnegative(),
  currency: z.string(),
  updatedAt: z.string()
});

export const dashboardSummaryResponseSchema = z.object({
  totalQuotes: z.number().int().nonnegative(),
  quotesThisMonth: z.number().int().nonnegative(),
  activeCustomers: z.number().int().nonnegative(),
  publishedLinks: z.number().int().nonnegative(),
  topProducts: z.array(dashboardTopProductSchema),
  recentQuotes: z.array(dashboardRecentQuoteSchema)
});

export type DashboardTopProduct = z.infer<typeof dashboardTopProductSchema>;
export type DashboardRecentQuote = z.infer<typeof dashboardRecentQuoteSchema>;
export type DashboardSummaryResponse = z.infer<
  typeof dashboardSummaryResponseSchema
>;
