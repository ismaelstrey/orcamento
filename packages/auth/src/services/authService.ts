import { env } from "@orcamento/shared";
import {
  loginInputSchema,
  meResponseSchema,
  refreshInputSchema
} from "../validators/authSchemas";
import type {
  AuthContext,
  AuthResponse,
  LoginInput,
  MeResponse,
  RefreshInput,
  SessionMetadata
} from "../types/auth";
import type {
  AuthAuditLogger,
  AuthRepository,
  CreateSessionInput
} from "../repositories/authRepository";
import { verifyPassword } from "./passwordService";
import { AuthError } from "../utils/authErrors";
import { createFutureDate, durationToSeconds } from "../utils/duration";
import { generateOpaqueToken, hashToken } from "../utils/hashing";
import { issueAccessToken } from "../utils/jwt";

const refreshTokenTtlSeconds = durationToSeconds(env.JWT_REFRESH_EXPIRES_IN);

function normalizeSessionMetadata(
  metadata?: LoginInput["metadata"]
): SessionMetadata | undefined {
  if (!metadata) {
    return undefined;
  }

  const normalizedMetadata: SessionMetadata = {};

  if (metadata.userAgent !== undefined) {
    normalizedMetadata.userAgent = metadata.userAgent;
  }

  if (metadata.ipAddress !== undefined) {
    normalizedMetadata.ipAddress = metadata.ipAddress;
  }

  return Object.keys(normalizedMetadata).length > 0
    ? normalizedMetadata
    : undefined;
}

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly auditLogger?: AuthAuditLogger
  ) {}

  /**
   * Executa login com validação de senha, criação de sessão e emissão de tokens.
   */
  async login(rawInput: LoginInput): Promise<AuthResponse> {
    const input = loginInputSchema.parse(rawInput);
    const user = await this.repository.findUserByEmail(input.email);

    if (!user) {
      await this.auditLogger?.logFailure("login", {
        email: input.email,
        reason: "user_not_found"
      });
      throw new AuthError(
        "authentication_error",
        "Credenciais inválidas.",
        401
      );
    }

    if (user.status === "disabled") {
      await this.auditLogger?.logFailure("login", {
        userId: user.id,
        tenantId: user.tenantId,
        reason: "user_disabled"
      });
      throw new AuthError(
        "authentication_error",
        "Usuário desabilitado.",
        401
      );
    }

    if (user.status === "invited") {
      await this.auditLogger?.logFailure("login", {
        userId: user.id,
        tenantId: user.tenantId,
        reason: "user_invited"
      });
      throw new AuthError(
        "authentication_error",
        "Usuário ainda não está ativo para login.",
        401
      );
    }

    const passwordMatches = await verifyPassword(input.password, user.passwordHash);

    if (!passwordMatches) {
      await this.auditLogger?.logFailure("login", {
        userId: user.id,
        tenantId: user.tenantId,
        reason: "invalid_password"
      });
      throw new AuthError(
        "authentication_error",
        "Credenciais inválidas.",
        401
      );
    }

    const refreshToken = generateOpaqueToken();
    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = createFutureDate(refreshTokenTtlSeconds);
    const metadata = normalizeSessionMetadata(input.metadata);

    const createSessionInput: CreateSessionInput = {
      tenantId: user.tenantId,
      userId: user.id,
      refreshTokenHash,
      expiresAt
    };

    if (metadata) {
      createSessionInput.metadata = metadata;
    }

    const session = await this.repository.createSession(createSessionInput);

    const { accessToken, expiresIn } = issueAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      sessionId: session.id,
      roles: user.roles
    });

    await this.repository.updateLastLogin(user.id, new Date());
    await this.auditLogger?.logSuccess("login", {
      userId: user.id,
      tenantId: user.tenantId,
      sessionId: session.id
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status
      },
      tenant: user.tenant,
      roles: user.roles
    };
  }

  /**
   * Renova a sessão atual, rotacionando o refresh token.
   */
  async refresh(rawInput: RefreshInput): Promise<AuthResponse> {
    const input = refreshInputSchema.parse(rawInput);
    const currentHash = hashToken(input.refreshToken);
    const session = await this.repository.findSessionByRefreshTokenHash(currentHash);

    if (!session) {
      await this.auditLogger?.logFailure("refresh", {
        reason: "session_not_found"
      });
      throw new AuthError(
        "authentication_error",
        "Sessão inválida para refresh.",
        401
      );
    }

    if (session.revokedAt) {
      await this.auditLogger?.logFailure("refresh", {
        userId: session.userId,
        tenantId: session.tenantId,
        sessionId: session.id,
        reason: "session_revoked"
      });
      throw new AuthError(
        "authentication_error",
        "Sessão revogada.",
        401
      );
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.auditLogger?.logFailure("refresh", {
        userId: session.userId,
        tenantId: session.tenantId,
        sessionId: session.id,
        reason: "session_expired"
      });
      throw new AuthError(
        "authentication_error",
        "Sessão expirada.",
        401
      );
    }

    const user = await this.repository.findUserById(session.userId);

    if (!user || user.status !== "active") {
      await this.auditLogger?.logFailure("refresh", {
        userId: session.userId,
        tenantId: session.tenantId,
        sessionId: session.id,
        reason: "user_unavailable"
      });
      throw new AuthError(
        "authentication_error",
        "Usuário indisponível para refresh.",
        401
      );
    }

    const nextRefreshToken = generateOpaqueToken();
    const nextRefreshTokenHash = hashToken(nextRefreshToken);
    const nextExpiresAt = createFutureDate(refreshTokenTtlSeconds);
    const metadata = normalizeSessionMetadata(input.metadata);

    const rotatedSession = metadata
      ? await this.repository.rotateSessionRefreshToken(
          session.id,
          nextRefreshTokenHash,
          nextExpiresAt,
          metadata
        )
      : await this.repository.rotateSessionRefreshToken(
          session.id,
          nextRefreshTokenHash,
          nextExpiresAt
        );

    const { accessToken, expiresIn } = issueAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      sessionId: rotatedSession.id,
      roles: user.roles
    });

    await this.auditLogger?.logSuccess("refresh", {
      userId: user.id,
      tenantId: user.tenantId,
      sessionId: rotatedSession.id
    });

    return {
      accessToken,
      refreshToken: nextRefreshToken,
      expiresIn,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status
      },
      tenant: user.tenant,
      roles: user.roles
    };
  }

  /**
   * Revoga a sessão atual do usuário autenticado.
   */
  async logout(context: AuthContext): Promise<void> {
    await this.repository.revokeSession(context.sessionId, new Date());
    await this.auditLogger?.logSuccess("logout", {
      userId: context.userId,
      tenantId: context.tenantId,
      sessionId: context.sessionId
    });
  }

  /**
   * Resolve o payload do endpoint /me a partir do contexto autenticado.
   */
  async me(context: AuthContext): Promise<MeResponse> {
    const me = await this.repository.resolveMe(context);

    if (!me) {
      throw new AuthError(
        "authentication_error",
        "Usuário autenticado não encontrado.",
        401
      );
    }

    return meResponseSchema.parse(me);
  }
}
