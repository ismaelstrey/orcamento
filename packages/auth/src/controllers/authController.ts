import type {
  AuthenticatedRequestLike,
  LoginInput,
  RefreshInput
} from "../types/auth";
import { AuthService } from "../services/authService";
import { AuthError } from "../utils/authErrors";

export interface RequestWithBody<TBody> extends AuthenticatedRequestLike {
  body: TBody;
}

/**
 * Adapta os casos de uso de autenticação para uma futura camada HTTP.
 */
export function createAuthController(service: AuthService) {
  return {
    login(request: RequestWithBody<LoginInput>) {
      return service.login(request.body);
    },
    refresh(request: RequestWithBody<RefreshInput>) {
      return service.refresh(request.body);
    },
    logout(request: AuthenticatedRequestLike) {
      if (!request.authContext) {
        throw new AuthError(
          "authentication_error",
          "AuthContext ausente para logout.",
          401
        );
      }

      return service.logout(request.authContext);
    },
    me(request: AuthenticatedRequestLike) {
      if (!request.authContext) {
        throw new AuthError(
          "authentication_error",
          "AuthContext ausente para endpoint me.",
          401
        );
      }

      return service.me(request.authContext);
    }
  };
}
