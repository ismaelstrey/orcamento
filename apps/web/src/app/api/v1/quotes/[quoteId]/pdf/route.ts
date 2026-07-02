import { NextResponse, type NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import { authenticateNextRequest } from "@/lib/auth/request";
import { generateQuotePdf, getQuotePdfDocument } from "@/lib/quotes/service";

interface QuotePdfRouteContext {
  params: Promise<{
    quoteId: string;
  }>;
}

async function parseOptionalJsonBody(request: NextRequest): Promise<unknown> {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return {};
  }

  return JSON.parse(rawBody) as unknown;
}

/**
 * Retorna a URL do documento comercial gerado para a versão solicitada.
 */
export async function POST(
  request: NextRequest,
  context: QuotePdfRouteContext
) {
  try {
    const { authContext } = authenticateNextRequest(request);
    const { quoteId } = await context.params;
    const body = await parseOptionalJsonBody(request);
    const response = await generateQuotePdf(
      authContext,
      quoteId,
      body ?? {},
      request.nextUrl.origin
    );

    if (!response) {
      return jsonResponse(
        {
          error: "not_found",
          details: {
            message: "Orçamento não encontrado."
          }
        },
        404
      );
    }

    return jsonResponse(response, 200);
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

/**
 * Serve o documento HTML imprimível que representa a versão congelada do orçamento.
 */
export async function GET(
  request: NextRequest,
  context: QuotePdfRouteContext
) {
  try {
    const { authContext } = authenticateNextRequest(request);
    const { quoteId } = await context.params;
    const quoteVersionId = request.nextUrl.searchParams.get("quoteVersionId");
    const response = await getQuotePdfDocument(authContext, quoteId, {
      quoteVersionId: quoteVersionId ?? undefined
    });

    if (!response) {
      return jsonResponse(
        {
          error: "not_found",
          details: {
            message: "Orçamento não encontrado."
          }
        },
        404
      );
    }

    return new NextResponse(response.html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${response.fileName}"`,
        "X-Quote-Version-Id": response.quoteVersionId
      }
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
