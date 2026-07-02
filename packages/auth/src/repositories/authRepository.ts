import type {
  AuthContext,
  AuthSession,
  AuthTenant,
  AuthUser,
  MeResponse,
  RoleCode,
  SessionMetadata
} from "../types/auth";

export interface CreateSessionInput {
  tenantId: string;
  userId: string;
  refreshTokenHash: string;
  metadata?: SessionMetadata;
  expiresAt: Date;
}

export interface AuthRepository {
  findUserByEmail(email: string): Promise<AuthUser | null>;
  findUserById(userId: string): Promise<AuthUser | null>;
  updateLastLogin(userId: string, loginAt: Date): Promise<void>;
  createSession(input: CreateSessionInput): Promise<AuthSession>;
  findSessionById(sessionId: string): Promise<AuthSession | null>;
  findSessionByRefreshTokenHash(
    refreshTokenHash: string
  ): Promise<AuthSession | null>;
  revokeSession(sessionId: string, revokedAt: Date): Promise<void>;
  rotateSessionRefreshToken(
    sessionId: string,
    refreshTokenHash: string,
    expiresAt: Date,
    metadata?: SessionMetadata
  ): Promise<AuthSession>;
  resolveMe(context: AuthContext): Promise<MeResponse | null>;
}

export interface AuthAuditLogger {
  logSuccess(action: "login" | "refresh" | "logout", context: {
    userId: string;
    tenantId: string;
    sessionId?: string;
  }): Promise<void>;
  logFailure(action: "login" | "refresh" | "logout", context: {
    email?: string;
    userId?: string;
    tenantId?: string;
    sessionId?: string;
    reason: string;
  }): Promise<void>;
}

export interface TenantResolver {
  getTenantById(tenantId: string): Promise<AuthTenant | null>;
}

export interface RoleAuthorizer {
  hasAnyRole(currentRoles: RoleCode[], allowedRoles: RoleCode[]): boolean;
}
