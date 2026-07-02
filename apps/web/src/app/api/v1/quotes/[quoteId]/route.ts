import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import { authenticateNextRequest } from "@/lib/auth/request";
import { getQuoteById, updateQuote } from "@/lib/quotes/service";

interface QuoteRouteContext {
  params: Promise<{
    quoteId: string;
  }>;
}

/**
 * Retorna o orçamento com o histórico de versões carregado.
 */
export async function GET(_request: NextRequest, context: QuoteRouteContext) {
  try {
    const request = _request;
    const { authContext } = authenticateNextRequest(request);
    const { quoteId } = await context.params;
    const response = await getQuoteById(authContext, quoteId);

    if (!response) {
      return jsonResponse(
        {
          error: "not_found",
          details: {
            message: "Orçamento não encontrado."
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
 * Atualiza metadados do orçamento sem alterar versões já consolidadas.
 */
export async function PATCH(
  request: NextRequest,
  context: QuoteRouteContext
) {
  try {
    const { authContext } = authenticateNextRequest(request);
    const { quoteId } = await context.params;
    const body = await request.json();
    const response = await updateQuote(authContext, quoteId, body);

    if (!response) {
      return jsonResponse(
        {
          error: "not_found",
          details: {
            message: "Orçamento não encontrado."
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
