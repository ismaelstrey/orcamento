import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import { getConfiguredQuoteDraftProviders } from "@/lib/ai/providers";
import { generateQuoteDraftReviewWithFallback } from "@/lib/ai/service";
import { authenticateNextRequest } from "@/lib/auth/request";

/**
 * Gera um draft importavel de orçamento a partir de briefing em linguagem natural.
 */
export async function POST(request: NextRequest) {
  try {
    authenticateNextRequest(request);

    const body = await request.json();
    const response = await generateQuoteDraftReviewWithFallback({
      providers: getConfiguredQuoteDraftProviders(),
      request: body
    });

    return jsonResponse(response, 200);
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
