import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import { authenticateNextRequest } from "@/lib/auth/request";
import { getQuoteVersionById } from "@/lib/quotes/service";

interface QuoteVersionRouteContext {
  params: Promise<{
    quoteId: string;
    versionId: string;
  }>;
}

/**
 * Retorna uma versão específica do orçamento com os itens congelados.
 */
export async function GET(
  request: NextRequest,
  context: QuoteVersionRouteContext
) {
  try {
    const { authContext } = authenticateNextRequest(request);
    const { quoteId, versionId } = await context.params;
    const response = await getQuoteVersionById(authContext, quoteId, versionId);

    if (!response) {
      return jsonResponse(
        {
          error: "not_found",
          details: {
            message: "Versão do orçamento não encontrada."
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
