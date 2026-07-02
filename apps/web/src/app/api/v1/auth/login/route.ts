import type { LoginInput } from "@orcamento/auth";
import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import { authModule } from "@/lib/auth/module";

/**
 * Executa o login do usuário autenticando e criando uma nova sessão.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginInput;
    const response = await authModule.controller.login({
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
