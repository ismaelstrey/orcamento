import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { loadEnvFile } from "node:process";
import { PrismaClient, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();
const require = createRequire(import.meta.url);

loadEnvFile(".env");

type BcryptModule = {
  hash(password: string, saltRounds: number): Promise<string>;
};

function getBootstrapConfig() {
  return {
    tenantName: process.env.BOOTSTRAP_TENANT_NAME?.trim() || "Bootstrap Tenant",
    tenantSlug: process.env.BOOTSTRAP_TENANT_SLUG?.trim() || "bootstrap-tenant",
    ownerName: process.env.BOOTSTRAP_OWNER_NAME?.trim() || "Owner Bootstrap",
    ownerEmail:
      process.env.BOOTSTRAP_OWNER_EMAIL?.trim().toLowerCase() ||
      "owner@bootstrap.local",
    ownerPassword:
      process.env.BOOTSTRAP_OWNER_PASSWORD?.trim() || "ChangeMe123456!"
  };
}

function getBcryptSaltRounds(): number {
  const rawSaltRounds = process.env.BCRYPT_SALT_ROUNDS?.trim() || "12";
  const saltRounds = Number(rawSaltRounds);

  if (!Number.isInteger(saltRounds) || saltRounds < 8 || saltRounds > 14) {
    throw new Error("BCRYPT_SALT_ROUNDS deve ser um inteiro entre 8 e 14.");
  }

  return saltRounds;
}

function getBcryptModule(): BcryptModule {
  try {
    return require("bcrypt") as BcryptModule;
  } catch {
    const pnpmDirectory = join(process.cwd(), "node_modules", ".pnpm");
    const bcryptPackageDirectory = readdirSync(pnpmDirectory).find((entry) =>
      entry.startsWith("bcrypt@")
    );

    if (!bcryptPackageDirectory) {
      throw new Error("Pacote bcrypt nao encontrado no workspace.");
    }

    return require(
      join(pnpmDirectory, bcryptPackageDirectory, "node_modules", "bcrypt")
    ) as BcryptModule;
  }
}

/**
 * Gera o hash da senha inicial usando a mesma estratégia do fluxo de autenticação.
 */
async function hashBootstrapPassword(password: string): Promise<string> {
  const bcrypt = getBcryptModule();

  return bcrypt.hash(password, getBcryptSaltRounds());
}

const baseRoles = [
  { code: "owner", name: "Owner" },
  { code: "admin", name: "Admin" },
  { code: "seller", name: "Seller" }
] as const;

/**
 * Cria o tenant base de desenvolvimento, os papéis mínimos do MVP e o usuário owner inicial.
 */
async function main(): Promise<void> {
  const bootstrapConfig = getBootstrapConfig();

  const tenant = await prisma.tenant.upsert({
    where: { slug: bootstrapConfig.tenantSlug },
    update: { name: bootstrapConfig.tenantName },
    create: {
      name: bootstrapConfig.tenantName,
      slug: bootstrapConfig.tenantSlug
    }
  });

  for (const role of baseRoles) {
    await prisma.role.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: role.code
        }
      },
      update: {
        name: role.name
      },
      create: {
        tenantId: tenant.id,
        code: role.code,
        name: role.name
      }
    });
  }

  const ownerRole = await prisma.role.findUniqueOrThrow({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: "owner"
      }
    }
  });

  const existingUser = await prisma.user.findUnique({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: bootstrapConfig.ownerEmail
      }
    }
  });

  const passwordHash = await hashBootstrapPassword(
    bootstrapConfig.ownerPassword
  );

  const ownerUser = existingUser
    ? await prisma.user.update({
        where: {
          id: existingUser.id
        },
        data: {
          name: bootstrapConfig.ownerName,
          passwordHash,
          status: UserStatus.active
        }
      })
    : await prisma.user.create({
        data: {
          tenantId: tenant.id,
          name: bootstrapConfig.ownerName,
          email: bootstrapConfig.ownerEmail,
          passwordHash,
          status: UserStatus.active
        }
      });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: ownerUser.id,
        roleId: ownerRole.id
      }
    },
    update: {},
    create: {
      userId: ownerUser.id,
      roleId: ownerRole.id
    }
  });

  console.log("Seed inicial concluido com tenant, roles e owner.");
  console.log(
    JSON.stringify(
      {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug
        },
        owner: {
          id: ownerUser.id,
          name: ownerUser.name,
          email: ownerUser.email
        }
      },
      null,
      2
    )
  );
}

main()
  .catch((error: unknown) => {
    console.error("Falha ao executar seed inicial.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
