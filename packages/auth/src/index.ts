export const authPackageName = "@orcamento/auth";

export { createAuthController } from "./controllers/authController";
export { authModuleNotes } from "./docs/authModuleNotes";
export { authenticateRequest } from "./middlewares/authenticate";
export { authorizeRoles } from "./middlewares/authorize";
export type {
  AuthAuditLogger,
  AuthRepository,
  CreateSessionInput,
  RoleAuthorizer,
  TenantResolver
} from "./repositories/authRepository";
export { createPrismaAuthRepository } from "./repositories/prismaAuthRepository";
export { AuthService } from "./services/authService";
export { createNoopAuthAuditLogger } from "./services/noopAuthAuditLogger";
export { hashPassword, verifyPassword } from "./services/passwordService";
export { createAuthModule, createAuthModulePlaceholder } from "./server";
export type {
  AuthenticatedRequestLike,
  AuthContext,
  AuthResponse,
  AuthSession,
  AuthTenant,
  AuthUser,
  LoginInput,
  MeResponse,
  RefreshInput,
  RoleCode,
  SessionMetadata,
  UserStatus
} from "./types/auth";
export { roleCodes, userStatuses } from "./types/auth";
export { AuthError } from "./utils/authErrors";
export { createFutureDate, durationToSeconds } from "./utils/duration";
export { generateOpaqueToken, hashToken } from "./utils/hashing";
export { issueAccessToken, verifyAccessToken } from "./utils/jwt";
export {
  authResponseSchema,
  loginInputSchema,
  loginRequestSchema,
  logoutRequestSchema,
  meResponseSchema,
  refreshInputSchema,
  refreshRequestSchema,
  sessionMetadataSchema
} from "./validators/authSchemas";
