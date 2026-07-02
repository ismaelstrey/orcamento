import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import { authenticateNextRequest } from "@/lib/auth/request";
import { createProduct, listProducts } from "@/lib/catalog/service";

export async function GET(request: NextRequest) {
  try {
    const { authContext } = authenticateNextRequest(request);
    const response = await listProducts(authContext);

    return jsonResponse(response, 200);
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authContext } = authenticateNextRequest(request);
    const body = await request.json();
    const response = await createProduct(authContext, body);

    return jsonResponse(response, 201);
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
