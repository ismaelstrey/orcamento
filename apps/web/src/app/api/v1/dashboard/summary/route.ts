import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import { authenticateNextRequest } from "@/lib/auth/request";
import { getDashboardSummary } from "@/lib/dashboard/service";

/**
 * Retorna os indicadores mínimos do dashboard para o tenant autenticado.
 */
export async function GET(request: NextRequest) {
  try {
    const { authContext } = authenticateNextRequest(request);
    const response = await getDashboardSummary(authContext);

    return jsonResponse(response, 200);
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
