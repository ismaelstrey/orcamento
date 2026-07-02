export type AuthErrorCode =
  | "authentication_error"
  | "authorization_error"
  | "validation_error"
  | "tenant_scope_error"
  | "currency_mismatch"
  | "pdf_generation_error"
  | "not_found"
  | "internal_server_error"
  | "share_link_revoked"
  | "share_link_expired";

export class AuthError extends Error {
  public readonly code: AuthErrorCode;
  public readonly statusCode: number;

  constructor(code: AuthErrorCode, message: string, statusCode = 401) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.statusCode = statusCode;
  }
}
