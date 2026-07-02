import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import { authModule } from "@/lib/auth/module";
import { authenticateNextRequest } from "@/lib/auth/request";

/**
 * Retorna o usuário autenticado, tenant atual e papéis ativos.
 */
export async function GET(request: NextRequest) {
  try {
    const { authRequest } = authenticateNextRequest(request);
    const response = await authModule.controller.me(authRequest);

    return jsonResponse(response, 200);
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
