export const roleCodes = ["owner", "admin", "seller"] as const;

export const userStatuses = ["active", "invited", "disabled"] as const;

export type RoleCode = (typeof roleCodes)[number];
export type UserStatus = (typeof userStatuses)[number];

export interface AuthTenant {
  id: string;
  name: string;
  slug: string;
}

export interface AuthUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  passwordHash: string;
  status: UserStatus;
  lastLoginAt?: Date | null;
  tenant: AuthTenant;
  roles: RoleCode[];
}

export interface AuthSession {
  id: string;
  tenantId: string;
  userId: string;
  refreshTokenHash: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
}

export interface SessionMetadata {
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
}

export interface LoginInput {
  email: string;
  password: string;
  metadata?: SessionMetadata;
}

export interface RefreshInput {
  refreshToken: string;
  metadata?: SessionMetadata;
}

export interface LogoutInput {
  sessionId: string;
}

export interface AuthenticatedPayload {
  sub: string;
  tenantId: string;
  sessionId: string;
  roles: RoleCode[];
  type: "access";
  iat?: number;
  exp?: number;
}

export interface AuthContext {
  userId: string;
  tenantId: string;
  sessionId: string;
  roles: RoleCode[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    name: string;
    email: string;
    status: UserStatus;
  };
  tenant: AuthTenant;
  roles: RoleCode[];
}

export interface MeResponse {
  user: {
    id: string;
    name: string;
    email: string;
    status: UserStatus;
  };
  tenant: AuthTenant;
  roles: RoleCode[];
}

export interface AuthenticatedRequestLike {
  headers: Record<string, string | string[] | undefined>;
  authContext?: AuthContext;
}
