import type { RefreshInput } from "@orcamento/auth";
import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import { authModule } from "@/lib/auth/module";

/**
 * Renova a sessão atual rotacionando o refresh token.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RefreshInput;
    const response = await authModule.controller.refresh({
      headers: {},
      body: {
        ...body,
        metadata: {
          userAgent: request.headers.get("user-agent") ?? undefined,
          ipAddress:
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            undefined
        }
      }
    });

    return jsonResponse(response, 200);
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
