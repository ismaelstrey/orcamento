import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api/http";
import { authenticateNextRequest } from "@/lib/auth/request";
import { createCustomer, listCustomers } from "@/lib/customers/service";

/**
 * Lista clientes do tenant autenticado com paginação e busca.
 */
export async function GET(request: NextRequest) {
  try {
    const { authContext } = authenticateNextRequest(request);
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page");
    const pageSize = searchParams.get("pageSize");
    const search = searchParams.get("search");

    const response = await listCustomers(authContext, {
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      ...(search ? { search } : {})
    });

    return jsonResponse(response, 200);
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

/**
 * Cria um novo cliente para o tenant autenticado.
 */
export async function POST(request: NextRequest) {
  try {
    const { authContext } = authenticateNextRequest(request);
    const body = await request.json();
    const response = await createCustomer(authContext, body);

    return jsonResponse(response, 201);
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
