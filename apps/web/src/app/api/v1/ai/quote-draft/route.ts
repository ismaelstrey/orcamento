import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import {
  getConfiguredQuoteDraftProviders,
  getQuoteDraftProviderCapabilities
} from "@/lib/ai/providers";
import {
  ensureAiQuoteDraftAccess,
  generateAuditedQuoteDraftReview
} from "@/lib/ai/audit";
import { authenticateNextRequest } from "@/lib/auth/request";

/**
 * Informa se há provider de IA disponível para geração de drafts.
 */
export async function GET(request: NextRequest) {
  try {
    const { authContext } = authenticateNextRequest(request);
    ensureAiQuoteDraftAccess(authContext);

    return jsonResponse(getQuoteDraftProviderCapabilities(), 200);
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

/**
 * Gera um draft importavel de orçamento a partir de briefing em linguagem natural.
 */
export async function POST(request: NextRequest) {
  try {
    const { authContext } = authenticateNextRequest(request);

    const body = await request.json();
    const response = await generateAuditedQuoteDraftReview({
      authContext,
      providers: getConfiguredQuoteDraftProviders(),
      request: body
    });

    return jsonResponse(response, 200);
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
