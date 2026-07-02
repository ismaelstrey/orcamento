import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import { authenticateNextRequest } from "@/lib/auth/request";
import { revokeQuoteShareLink } from "@/lib/quotes/service";

interface RevokeQuoteShareLinkRouteContext {
  params: Promise<{
    quoteId: string;
    shareLinkId: string;
  }>;
}

/**
 * Revoga logicamente um link público de orçamento.
 */
export async function POST(
  request: NextRequest,
  context: RevokeQuoteShareLinkRouteContext
) {
  try {
    const { authContext } = authenticateNextRequest(request);
    const { quoteId, shareLinkId } = await context.params;
    const response = await revokeQuoteShareLink(
      authContext,
      quoteId,
      shareLinkId,
      request.nextUrl.origin
    );

    if (!response) {
      return jsonResponse(
        {
          error: "not_found",
          details: {
            message: "Link de compartilhamento não encontrado."
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
