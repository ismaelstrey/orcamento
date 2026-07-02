import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import { authenticateNextRequest } from "@/lib/auth/request";
import { getCustomerById, updateCustomer } from "@/lib/customers/service";

interface CustomerRouteContext {
  params: Promise<{
    customerId: string;
  }>;
}

/**
 * Retorna o detalhe de um cliente dentro do tenant autenticado.
 */
export async function GET(_request: NextRequest, context: CustomerRouteContext) {
  try {
    const request = _request;
    const { authContext } = authenticateNextRequest(request);
    const { customerId } = await context.params;
    const response = await getCustomerById(authContext, customerId);

    if (!response) {
      return jsonResponse(
        {
          error: "not_found",
          details: {
            message: "Cliente não encontrado."
          }
        },
        404
      );
    }

    return jsonResponse(response, 200);
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

/**
 * Atualiza um cliente dentro do tenant autenticado.
 */
export async function PATCH(
  request: NextRequest,
  context: CustomerRouteContext
) {
  try {
    const { authContext } = authenticateNextRequest(request);
    const { customerId } = await context.params;
    const body = await request.json();
    const response = await updateCustomer(authContext, customerId, body);

    if (!response) {
      return jsonResponse(
        {
          error: "not_found",
          details: {
            message: "Cliente não encontrado."
          }
        },
        404
      );
    }

    return jsonResponse(response, 200);
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
