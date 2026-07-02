import type {
  AuthContext,
  AuthSession,
  AuthUser,
  MeResponse,
  RoleCode,
  UserStatus
} from "../types/auth";
import type { AuthRepository, CreateSessionInput } from "./authRepository";
import { roleCodes, userStatuses } from "../types/auth";
import type { PrismaClient, Role, Tenant, User, UserRole } from "@prisma/client";

type UserWithRelations = User & {
  tenant: Tenant;
  roles: Array<
    UserRole & {
      role: Role;
    }
  >;
};

/**
 * Garante que apenas os papéis conhecidos do domínio sejam retornados.
 */
function mapRoleCodes(
  relations: Array<
    UserRole & {
      role: Role;
    }
  >
): RoleCode[] {
  return relations
    .map((relation) => relation.role.code)
    .filter((code): code is RoleCode =>
      roleCodes.includes(code as RoleCode)
    );
}

/**
 * Normaliza o status do usuário a partir do enum persistido no banco.
 */
function mapUserStatus(status: string): UserStatus {
  if (userStatuses.includes(status as UserStatus)) {
    return status as UserStatus;
  }

  return "disabled";
}

/**
 * Mapeia a entidade do Prisma para o contrato interno do módulo auth.
 */
function mapAuthUser(user: UserWithRelations): AuthUser {
  return {
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    status: mapUserStatus(user.status),
    lastLoginAt: user.lastLoginAt,
    tenant: {
      id: user.tenant.id,
      name: user.tenant.name,
      slug: user.tenant.slug
    },
    roles: mapRoleCodes(user.roles)
  };
}

/**
 * Mapeia a sessão persistida para o contrato interno reutilizável.
 */
function mapAuthSession(session: {
  id: string;
  tenantId: string;
  userId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}): AuthSession {
  return {
    id: session.id,
    tenantId: session.tenantId,
    userId: session.userId,
    refreshTokenHash: session.refreshTokenHash,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    expiresAt: session.expiresAt,
    revokedAt: session.revokedAt,
    createdAt: session.createdAt
  };
}

/**
 * Cria a implementação Prisma do repositório de autenticação.
 */
export function createPrismaAuthRepository(
  prisma: PrismaClient
): AuthRepository {
  return {
    async findUserByEmail(email: string): Promise<AuthUser | null> {
      const user = await prisma.user.findFirst({
        where: {
          email
        },
        include: {
          tenant: true,
          roles: {
            include: {
              role: true
            }
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      });

      return user ? mapAuthUser(user) : null;
    },

    async findUserById(userId: string): Promise<AuthUser | null> {
      const user = await prisma.user.findUnique({
        where: {
          id: userId
        },
        include: {
          tenant: true,
          roles: {
            include: {
              role: true
            }
          }
        }
      });

      return user ? mapAuthUser(user) : null;
    },

    async updateLastLogin(userId: string, loginAt: Date): Promise<void> {
      await prisma.user.update({
        where: {
          id: userId
        },
        data: {
          lastLoginAt: loginAt
        }
      });
    },

    async createSession(input: CreateSessionInput): Promise<AuthSession> {
      const session = await prisma.authSession.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          refreshTokenHash: input.refreshTokenHash,
          userAgent: input.metadata?.userAgent ?? null,
          ipAddress: input.metadata?.ipAddress ?? null,
          expiresAt: input.expiresAt
        }
      });

      return mapAuthSession(session);
    },

    async findSessionById(sessionId: string): Promise<AuthSession | null> {
      const session = await prisma.authSession.findUnique({
        where: {
          id: sessionId
        }
      });

      return session ? mapAuthSession(session) : null;
    },

    async findSessionByRefreshTokenHash(
      refreshTokenHash: string
    ): Promise<AuthSession | null> {
      const session = await prisma.authSession.findFirst({
        where: {
          refreshTokenHash
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      return session ? mapAuthSession(session) : null;
    },

    async revokeSession(sessionId: string, revokedAt: Date): Promise<void> {
      await prisma.authSession.update({
        where: {
          id: sessionId
        },
        data: {
          revokedAt
        }
      });
    },

    async rotateSessionRefreshToken(
      sessionId: string,
      refreshTokenHash: string,
      expiresAt: Date,
      metadata
    ): Promise<AuthSession> {
      const session = await prisma.authSession.update({
        where: {
          id: sessionId
        },
        data: {
          refreshTokenHash,
          expiresAt,
          revokedAt: null,
          userAgent: metadata?.userAgent ?? null,
          ipAddress: metadata?.ipAddress ?? null
        }
      });

      return mapAuthSession(session);
    },

    async resolveMe(context: AuthContext): Promise<MeResponse | null> {
      const user = await prisma.user.findFirst({
        where: {
          id: context.userId,
          tenantId: context.tenantId
        },
        include: {
          tenant: true,
          roles: {
            include: {
              role: true
            }
          }
        }
      });

      if (!user) {
        return null;
      }

      const mappedUser = mapAuthUser(user);

      return {
        user: {
          id: mappedUser.id,
          name: mappedUser.name,
          email: mappedUser.email,
          status: mappedUser.status
        },
        tenant: mappedUser.tenant,
        roles: mappedUser.roles
      };
    }
  };
}
