import { z } from "zod";

export const createCategoryRequestSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120)
});

export const createBrandRequestSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120)
});

export const productSpecificationSchema = z.object({
  key: z.string().min(1).max(120),
  value: z.string().min(1).max(500)
});

export const createProductRequestSchema = z.object({
  categoryId: z.string().min(1),
  brandId: z.string().min(1).optional(),
  name: z.string().min(2).max(180),
  sku: z.string().max(120).optional(),
  description: z.string().max(4000).optional(),
  basePriceCents: z.number().int().nonnegative(),
  currency: z.string().length(3),
  specifications: z.array(productSpecificationSchema).default([])
});

export const updateProductRequestSchema = createProductRequestSchema.partial();

export const productParamsSchema = z.object({
  productId: z.string().min(1)
});

export const categoryResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const brandResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const productResponseSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  brandId: z.string().nullable().optional(),
  name: z.string(),
  sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  basePriceCents: z.number().int(),
  currency: z.string(),
  isActive: z.boolean(),
  specifications: z.array(productSpecificationSchema),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type CreateCategoryRequest = z.infer<typeof createCategoryRequestSchema>;
export type CreateBrandRequest = z.infer<typeof createBrandRequestSchema>;
export type CreateProductRequest = z.infer<typeof createProductRequestSchema>;
export type UpdateProductRequest = z.infer<typeof updateProductRequestSchema>;
export type CategoryResponse = z.infer<typeof categoryResponseSchema>;
export type BrandResponse = z.infer<typeof brandResponseSchema>;
export type ProductResponse = z.infer<typeof productResponseSchema>;
