import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import { authenticateNextRequest } from "@/lib/auth/request";
import { exportQuoteToJson } from "@/lib/quotes/service";

interface ExportQuoteJsonRouteContext {
  params: Promise<{
    quoteId: string;
  }>;
}

/**
 * Exporta o snapshot da versão atual do orçamento em formato JSON estável.
 */
export async function GET(
  request: NextRequest,
  context: ExportQuoteJsonRouteContext
) {
  try {
    const { authContext } = authenticateNextRequest(request);
    const { quoteId } = await context.params;
    const response = await exportQuoteToJson(authContext, quoteId);

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
