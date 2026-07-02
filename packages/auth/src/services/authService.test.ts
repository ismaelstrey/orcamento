import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthAuditLogger, AuthRepository } from "../repositories/authRepository";
import type { AuthContext, AuthSession, AuthUser } from "../types/auth";
import { AuthError } from "../utils/authErrors";

const mockVerifyPassword = vi.hoisted(() => vi.fn());
const mockIssueAccessToken = vi.hoisted(() => vi.fn());
const mockGenerateOpaqueToken = vi.hoisted(() => vi.fn());
const mockHashToken = vi.hoisted(() => vi.fn());

vi.mock("@orcamento/shared", () => ({
  env: {
    JWT_REFRESH_EXPIRES_IN: "7d"
  }
}));

vi.mock("./passwordService", () => ({
  verifyPassword: mockVerifyPassword
}));

vi.mock("../utils/jwt", () => ({
  issueAccessToken: mockIssueAccessToken
}));

vi.mock("../utils/hashing", () => ({
  generateOpaqueToken: mockGenerateOpaqueToken,
  hashToken: mockHashToken
}));

import { AuthService } from "./authService";

function createRepositoryMock(): AuthRepository {
  return {
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
    updateLastLogin: vi.fn(),
    createSession: vi.fn(),
    findSessionById: vi.fn(),
    findSessionByRefreshTokenHash: vi.fn(),
    revokeSession: vi.fn(),
    rotateSessionRefreshToken: vi.fn(),
    resolveMe: vi.fn()
  };
}

function createAuditLoggerMock(): AuthAuditLogger {
  return {
    logSuccess: vi.fn(),
    logFailure: vi.fn()
  };
}

function createAuthUser(): AuthUser {
  return {
    id: "usr_1",
    tenantId: "ten_1",
    name: "Maria",
    email: "maria@empresa.com",
    passwordHash: "hash_atual",
    status: "active",
    lastLoginAt: null,
    tenant: {
      id: "ten_1",
      name: "Empresa X",
      slug: "empresa-x"
    },
    roles: ["owner"]
  };
}

function createSession(): AuthSession {
  return {
    id: "ses_1",
    tenantId: "ten_1",
    userId: "usr_1",
    refreshTokenHash: "hash_refresh",
    userAgent: "vitest",
    ipAddress: "127.0.0.1",
    expiresAt: new Date("2099-01-01T00:00:00.000Z"),
    revokedAt: null,
    createdAt: new Date("2099-01-01T00:00:00.000Z")
  };
}

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyPassword.mockResolvedValue(true);
    mockIssueAccessToken.mockReturnValue({
      accessToken: "access_token",
      expiresIn: 900
    });
    mockGenerateOpaqueToken.mockReturnValue("refresh_token");
    mockHashToken.mockReturnValue("refresh_token_hash");
  });

  it("audita e bloqueia login com usuário inexistente", async () => {
    const repository = createRepositoryMock();
    const auditLogger = createAuditLoggerMock();
    const service = new AuthService(repository, auditLogger);

    vi.mocked(repository.findUserByEmail).mockResolvedValue(null);

    await expect(
      service.login({
        email: "naoexiste@empresa.com",
        password: "senha123"
      })
    ).rejects.toBeInstanceOf(AuthError);

    expect(auditLogger.logFailure).toHaveBeenCalledWith("login", {
      email: "naoexiste@empresa.com",
      reason: "user_not_found"
    });
    expect(repository.createSession).not.toHaveBeenCalled();
  });

  it("executa login válido, cria sessão e audita sucesso", async () => {
    const repository = createRepositoryMock();
    const auditLogger = createAuditLoggerMock();
    const service = new AuthService(repository, auditLogger);
    const user = createAuthUser();
    const session = createSession();

    vi.mocked(repository.findUserByEmail).mockResolvedValue(user);
    vi.mocked(repository.createSession).mockResolvedValue(session);
    vi.mocked(repository.updateLastLogin).mockResolvedValue();

    const response = await service.login({
      email: user.email,
      password: "senha123",
      metadata: {
        userAgent: "vitest",
        ipAddress: "127.0.0.1"
      }
    });

    expect(mockVerifyPassword).toHaveBeenCalledWith("senha123", user.passwordHash);
    expect(repository.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: user.tenantId,
        userId: user.id,
        refreshTokenHash: "refresh_token_hash"
      })
    );
    expect(repository.updateLastLogin).toHaveBeenCalledTimes(1);
    expect(auditLogger.logSuccess).toHaveBeenCalledWith("login", {
      userId: user.id,
      tenantId: user.tenantId,
      sessionId: session.id
    });
    expect(response).toEqual({
      accessToken: "access_token",
      refreshToken: "refresh_token",
      expiresIn: 900,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status
      },
      tenant: user.tenant,
      roles: user.roles
    });
  });

  it("audita falha de refresh com sessão revogada", async () => {
    const repository = createRepositoryMock();
    const auditLogger = createAuditLoggerMock();
    const service = new AuthService(repository, auditLogger);
    const session = {
      ...createSession(),
      revokedAt: new Date("2099-01-02T00:00:00.000Z")
    };

    vi.mocked(repository.findSessionByRefreshTokenHash).mockResolvedValue(session);

    await expect(
      service.refresh({
        refreshToken: "refresh_token"
      })
    ).rejects.toMatchObject({
      code: "authentication_error",
      statusCode: 401
    });

    expect(repository.findSessionByRefreshTokenHash).toHaveBeenCalledWith(
      "refresh_token_hash"
    );
    expect(auditLogger.logFailure).toHaveBeenCalledWith("refresh", {
      userId: session.userId,
      tenantId: session.tenantId,
      sessionId: session.id,
      reason: "session_revoked"
    });
  });

  it("revoga a sessão atual e audita logout", async () => {
    const repository = createRepositoryMock();
    const auditLogger = createAuditLoggerMock();
    const service = new AuthService(repository, auditLogger);
    const context: AuthContext = {
      userId: "usr_1",
      tenantId: "ten_1",
      sessionId: "ses_1",
      roles: ["owner"]
    };

    vi.mocked(repository.revokeSession).mockResolvedValue();

    await service.logout(context);

    expect(repository.revokeSession).toHaveBeenCalledTimes(1);
    expect(auditLogger.logSuccess).toHaveBeenCalledWith("logout", {
      userId: context.userId,
      tenantId: context.tenantId,
      sessionId: context.sessionId
    });
  });
});
