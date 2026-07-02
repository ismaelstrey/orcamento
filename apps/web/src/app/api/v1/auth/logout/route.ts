import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import { authModule } from "@/lib/auth/module";
import { authenticateNextRequest } from "@/lib/auth/request";

/**
 * Revoga a sessão representada pelo access token atual.
 */
export async function POST(request: NextRequest) {
  try {
    const { authRequest } = authenticateNextRequest(request);
    await authModule.controller.logout(authRequest);

    return jsonResponse({ success: true }, 200);
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
