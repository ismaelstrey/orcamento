import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import { authenticateNextRequest } from "@/lib/auth/request";
import { createQuoteVersion, listQuoteVersions } from "@/lib/quotes/service";

interface QuoteVersionsRouteContext {
  params: Promise<{
    quoteId: string;
  }>;
}

/**
 * Lista as versões de um orçamento do tenant autenticado.
 */
export async function GET(
  request: NextRequest,
  context: QuoteVersionsRouteContext
) {
  try {
    const { authContext } = authenticateNextRequest(request);
    const { quoteId } = await context.params;
    const response = await listQuoteVersions(authContext, quoteId);

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
 * Cria uma nova versão congelada para o orçamento informado.
 */
export async function POST(
  request: NextRequest,
  context: QuoteVersionsRouteContext
) {
  try {
    const { authContext } = authenticateNextRequest(request);
    const { quoteId } = await context.params;
    const body = await request.json();
    const response = await createQuoteVersion(authContext, quoteId, body);

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

    return jsonResponse(response, 201);
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
