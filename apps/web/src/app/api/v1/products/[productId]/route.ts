import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import { authenticateNextRequest } from "@/lib/auth/request";
import { getProductById, updateProduct } from "@/lib/catalog/service";

interface ProductRouteContext {
  params: Promise<{
    productId: string;
  }>;
}

export async function GET(_request: NextRequest, context: ProductRouteContext) {
  try {
    const request = _request;
    const { authContext } = authenticateNextRequest(request);
    const { productId } = await context.params;
    const response = await getProductById(authContext, productId);

    if (!response) {
      return jsonResponse(
        {
          error: "not_found",
          details: {
            message: "Produto não encontrado."
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

export async function PATCH(
  request: NextRequest,
  context: ProductRouteContext
) {
  try {
    const { authContext } = authenticateNextRequest(request);
    const { productId } = await context.params;
    const body = await request.json();
    const response = await updateProduct(authContext, productId, body);

    if (!response) {
      return jsonResponse(
        {
          error: "not_found",
          details: {
            message: "Produto não encontrado."
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
