import { loadEnvFile } from "node:process";
import { z } from "zod";

/**
 * Valida e expõe as variáveis de ambiente compartilhadas pelo workspace.
 */
function loadKnownWorkspaceEnvFiles(): void {
  const candidateEnvFiles = [
    "../../.env.local",
    "../../.env",
    ".env.local",
    ".env"
  ] as const;

  for (const filePath of candidateEnvFiles) {
    try {
      loadEnvFile(filePath);
    } catch {
      // Ausência de arquivo local é aceitável em CI/produção com env injetado.
    }
  }
}

loadKnownWorkspaceEnvFiles();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(14),
  REDIS_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url()
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(input: NodeJS.ProcessEnv): Env {
  return envSchema.parse(input);
}

export const env = parseEnv(process.env);
