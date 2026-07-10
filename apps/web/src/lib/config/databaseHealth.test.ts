import { AuthError, type AuthContext } from "@orcamento/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDatabaseHealth } from "./databaseHealth";

const mockPrisma = vi.hoisted(() => ({
  $queryRaw: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma
}));

const ownerContext: AuthContext = {
  userId: "user-1",
  tenantId: "tenant-1",
  sessionId: "session-1",
  roles: ["owner"]
};

const sellerContext: AuthContext = {
  ...ownerContext,
  roles: ["seller"]
};

describe("config/databaseHealth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna healthy quando Prisma executa consulta curta", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ ok: 1 }]);

    await expect(
      getDatabaseHealth(ownerContext, () => new Date("2026-07-10T10:00:00.000Z"))
    ).resolves.toMatchObject({
      status: "healthy",
      checkedAt: "2026-07-10T10:00:00.000Z",
      provider: "prisma",
      message: "Prisma conseguiu executar uma consulta curta no banco."
    });
    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it("retorna unhealthy sem vazar mensagem bruta quando banco falha", async () => {
    mockPrisma.$queryRaw.mockRejectedValue(
      new Error("Can't reach database server at `secret-host:5432`")
    );

    await expect(getDatabaseHealth(ownerContext)).resolves.toMatchObject({
      status: "unhealthy",
      provider: "prisma",
      message: "Banco indisponivel ou lento para o Prisma neste ambiente."
    });
  });

  it("bloqueia perfil sem permissao administrativa", async () => {
    await expect(getDatabaseHealth(sellerContext)).rejects.toBeInstanceOf(AuthError);
    expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
  });
});
