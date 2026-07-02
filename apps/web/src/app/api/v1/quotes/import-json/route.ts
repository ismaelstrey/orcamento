import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import { authenticateNextRequest } from "@/lib/auth/request";
import { importQuoteFromJson } from "@/lib/quotes/service";

/**
 * Importa um payload JSON estruturado e cria um draft inicial do orçamento.
 */
export async function POST(request: NextRequest) {
  try {
    const { authContext } = authenticateNextRequest(request);
    const body = await request.json();
    const response = await importQuoteFromJson(authContext, body);

    return jsonResponse(response, 201);
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
