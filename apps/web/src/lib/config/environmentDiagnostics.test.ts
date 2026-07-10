import { describe, expect, it } from "vitest";
import {
  analyzeDatabaseUrl,
  buildEnvironmentDiagnosticSummary
} from "./environmentDiagnostics";

const neonBase =
  "postgresql://user:secret@ep-crimson-recipe-ac7q7ljw-pooler.sa-east-1.aws.neon.tech";

describe("config/environmentDiagnostics", () => {
  it("marca URL ausente como erro sem expor segredo", () => {
    const diagnostic = analyzeDatabaseUrl("DATABASE_URL");

    expect(diagnostic).toMatchObject({
      configured: false,
      status: "error",
      safeUrl: ""
    });
    expect(diagnostic.findings[0]).toContain("DATABASE_URL");
  });

  it("marca URL invalida como erro", () => {
    const diagnostic = analyzeDatabaseUrl("DATABASE_URL", "=require&bad=true");

    expect(diagnostic.status).toBe("error");
    expect(diagnostic.provider).toBe("unknown");
  });

  it("identifica Neon sem hardening recomendado", () => {
    const diagnostic = analyzeDatabaseUrl(
      "DATABASE_URL",
      `${neonBase}/neondb?sslmode=require`
    );

    expect(diagnostic.status).toBe("warning");
    expect(diagnostic.isNeon).toBe(true);
    expect(diagnostic.isPooler).toBe(true);
    expect(diagnostic.safeUrl).toContain("***:***");
    expect(diagnostic.findings).toEqual(
      expect.arrayContaining([
        "Defina a porta 5432 explicitamente para reduzir ambiguidade.",
        "Pooler Neon funciona melhor com connection_limit definido.",
        "Inclua pool_timeout para evitar falhas curtas do Prisma.",
        "Inclua connect_timeout para diagnosticar lentidao de rede."
      ])
    );
  });

  it("aprova URL Neon com porta, SSL e timeouts", () => {
    const diagnostic = analyzeDatabaseUrl(
      "DATABASE_URL",
      `${neonBase}:5432/neondb?sslmode=require&channel_binding=require&connection_limit=1&pool_timeout=30&connect_timeout=30`
    );

    expect(diagnostic.status).toBe("ok");
    expect(diagnostic.host).toContain("neon.tech");
    expect(diagnostic.database).toBe("neondb");
  });

  it("avisa quando ambiente aponta para Postgres local", () => {
    const diagnostic = analyzeDatabaseUrl(
      "DATABASE_URL",
      "postgresql://postgres:postgres@localhost:5432/orcamento"
    );

    expect(diagnostic.status).toBe("warning");
    expect(diagnostic.findings).toContain(
      "Ambiente esta apontando para Postgres local."
    );
  });

  it("resume consistencia geral entre DATABASE_URL e DIRECT_URL", () => {
    const url = `${neonBase}:5432/neondb?sslmode=require&connection_limit=1&pool_timeout=30&connect_timeout=30`;
    const summary = buildEnvironmentDiagnosticSummary({
      DATABASE_URL: url,
      DIRECT_URL: url
    });

    expect(summary.status).toBe("ok");
    expect(summary.databaseUrls).toHaveLength(2);
    expect(summary.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "configured",
          status: "ok"
        }),
        expect.objectContaining({
          id: "same-target",
          status: "ok"
        })
      ])
    );
  });

  it("alerta quando DATABASE_URL e DIRECT_URL apontam para destinos diferentes", () => {
    const summary = buildEnvironmentDiagnosticSummary({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/orcamento",
      DIRECT_URL: `${neonBase}:5432/neondb?sslmode=require&connection_limit=1&pool_timeout=30&connect_timeout=30`
    });

    expect(summary.status).toBe("warning");
    expect(summary.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "same-target",
          status: "warning"
        })
      ])
    );
  });
});
