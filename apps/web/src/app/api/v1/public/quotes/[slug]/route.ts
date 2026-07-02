import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import { getPublicQuoteBySlug } from "@/lib/quotes/service";

interface PublicQuoteRouteContext {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Retorna a visão pública de um orçamento compartilhado.
 */
export async function GET(
  _request: NextRequest,
  context: PublicQuoteRouteContext
) {
  try {
    const { slug } = await context.params;
    const response = await getPublicQuoteBySlug(slug);

    return jsonResponse(response, 200);
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
