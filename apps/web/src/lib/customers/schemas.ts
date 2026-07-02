import { z } from "zod";

export const createCustomerRequestSchema = z.object({
  name: z.string().min(2).max(160),
  email: z.string().email().optional(),
  phone: z.string().min(8).max(30).optional(),
  document: z.string().min(3).max(30).optional(),
  notes: z.string().max(2000).optional()
});

export const updateCustomerRequestSchema =
  createCustomerRequestSchema.partial();

export const customerParamsSchema = z.object({
  customerId: z.string().min(1)
});

export const customersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().max(200).optional()
});

export const customerResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  document: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const customersListResponseSchema = z.object({
  items: z.array(customerResponseSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative()
});

export type CreateCustomerRequest = z.infer<typeof createCustomerRequestSchema>;
export type UpdateCustomerRequest = z.infer<typeof updateCustomerRequestSchema>;
export type CustomersQuery = z.infer<typeof customersQuerySchema>;
export type CustomerResponse = z.infer<typeof customerResponseSchema>;
export type CustomersListResponse = z.infer<typeof customersListResponseSchema>;
