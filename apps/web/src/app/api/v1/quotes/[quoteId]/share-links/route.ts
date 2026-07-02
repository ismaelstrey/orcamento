import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import { authenticateNextRequest } from "@/lib/auth/request";
import {
  createQuoteShareLink,
  listQuoteShareLinks
} from "@/lib/quotes/service";

interface QuoteShareLinksRouteContext {
  params: Promise<{
    quoteId: string;
  }>;
}

/**
 * Lista os links públicos já gerados para um orçamento.
 */
export async function GET(
  request: NextRequest,
  context: QuoteShareLinksRouteContext
) {
  try {
    const { authContext } = authenticateNextRequest(request);
    const { quoteId } = await context.params;
    const response = await listQuoteShareLinks(
      authContext,
      quoteId,
      request.nextUrl.origin
    );

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
 * Cria um link público novo apontando para uma versão específica.
 */
export async function POST(
  request: NextRequest,
  context: QuoteShareLinksRouteContext
) {
  try {
    const { authContext } = authenticateNextRequest(request);
    const { quoteId } = await context.params;
    const body = await request.json();
    const response = await createQuoteShareLink(
      authContext,
      quoteId,
      body,
      request.nextUrl.origin
    );

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
