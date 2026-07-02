import type { Customer } from "@prisma/client";

/**
 * Normaliza a entidade Customer para o contrato HTTP do módulo.
 */
export function mapCustomerResponse(customer: Customer) {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    document: customer.document,
    notes: customer.notes,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString()
  };
}
