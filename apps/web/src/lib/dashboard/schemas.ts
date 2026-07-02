import { z } from "zod";

export const dashboardTopProductSchema = z.object({
  productId: z.string().nullable().optional(),
  productName: z.string(),
  uses: z.number().int().nonnegative()
});

export const dashboardSummaryResponseSchema = z.object({
  totalQuotes: z.number().int().nonnegative(),
  quotesThisMonth: z.number().int().nonnegative(),
  activeCustomers: z.number().int().nonnegative(),
  publishedLinks: z.number().int().nonnegative(),
  topProducts: z.array(dashboardTopProductSchema)
});

export type DashboardTopProduct = z.infer<typeof dashboardTopProductSchema>;
export type DashboardSummaryResponse = z.infer<
  typeof dashboardSummaryResponseSchema
>;
