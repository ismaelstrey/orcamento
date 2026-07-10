import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import { authenticateNextRequest } from "@/lib/auth/request";
import { getDatabaseHealth } from "@/lib/config/databaseHealth";

/**
 * Executa uma consulta curta autenticada para validar a conectividade Prisma.
 */
export async function GET(request: NextRequest) {
  try {
    const { authContext } = authenticateNextRequest(request);
    const response = await getDatabaseHealth(authContext);

    return jsonResponse(response, response.status === "healthy" ? 200 : 503);
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
