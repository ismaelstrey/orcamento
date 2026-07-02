import { authorizeRoles, type AuthContext } from "@orcamento/auth";
import { prisma } from "@/lib/db/prisma";
import {
  createCustomerRequestSchema,
  customersQuerySchema,
  customerParamsSchema,
  updateCustomerRequestSchema,
  type CreateCustomerRequest,
  type CustomersQuery,
  type UpdateCustomerRequest
} from "./schemas";
import { mapCustomerResponse } from "./mapper";

/**
 * Lista clientes do tenant autenticado com busca simples.
 */
export async function listCustomers(
  authContext: AuthContext,
  query: CustomersQuery
) {
  authorizeRoles(authContext, ["owner", "admin", "seller"]);

  const parsedQuery = customersQuerySchema.parse(query);
  const where = {
    tenantId: authContext.tenantId,
    ...(parsedQuery.search
      ? {
          OR: [
            { name: { contains: parsedQuery.search, mode: "insensitive" as const } },
            { email: { contains: parsedQuery.search, mode: "insensitive" as const } },
            { document: { contains: parsedQuery.search, mode: "insensitive" as const } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      skip: (parsedQuery.page - 1) * parsedQuery.pageSize,
      take: parsedQuery.pageSize
    }),
    prisma.customer.count({ where })
  ]);

  return {
    items: items.map(mapCustomerResponse),
    page: parsedQuery.page,
    pageSize: parsedQuery.pageSize,
    total
  };
}

/**
 * Cria um cliente sempre vinculado ao tenant autenticado.
 */
export async function createCustomer(
  authContext: AuthContext,
  input: CreateCustomerRequest
) {
  authorizeRoles(authContext, ["owner", "admin", "seller"]);
  const parsedInput = createCustomerRequestSchema.parse(input);

  const customer = await prisma.customer.create({
    data: {
      tenantId: authContext.tenantId,
      name: parsedInput.name,
      email: parsedInput.email ?? null,
      phone: parsedInput.phone ?? null,
      document: parsedInput.document ?? null,
      notes: parsedInput.notes ?? null
    }
  });

  return mapCustomerResponse(customer);
}

/**
 * Busca um cliente garantindo escopo do tenant atual.
 */
export async function getCustomerById(
  authContext: AuthContext,
  customerId: string
) {
  authorizeRoles(authContext, ["owner", "admin", "seller"]);
  const params = customerParamsSchema.parse({ customerId });

  const customer = await prisma.customer.findFirst({
    where: {
      id: params.customerId,
      tenantId: authContext.tenantId
    }
  });

  return customer ? mapCustomerResponse(customer) : null;
}

/**
 * Atualiza um cliente dentro do tenant autenticado.
 */
export async function updateCustomer(
  authContext: AuthContext,
  customerId: string,
  input: UpdateCustomerRequest
) {
  authorizeRoles(authContext, ["owner", "admin", "seller"]);
  const params = customerParamsSchema.parse({ customerId });
  const parsedInput = updateCustomerRequestSchema.parse(input);

  const currentCustomer = await prisma.customer.findFirst({
    where: {
      id: params.customerId,
      tenantId: authContext.tenantId
    }
  });

  if (!currentCustomer) {
    return null;
  }

  const customer = await prisma.customer.update({
    where: {
      id: currentCustomer.id
    },
    data: {
      ...(parsedInput.name !== undefined ? { name: parsedInput.name } : {}),
      ...(parsedInput.email !== undefined ? { email: parsedInput.email ?? null } : {}),
      ...(parsedInput.phone !== undefined ? { phone: parsedInput.phone ?? null } : {}),
      ...(parsedInput.document !== undefined
        ? { document: parsedInput.document ?? null }
        : {}),
      ...(parsedInput.notes !== undefined ? { notes: parsedInput.notes ?? null } : {})
    }
  });

  return mapCustomerResponse(customer);
}
