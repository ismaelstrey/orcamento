import { defineConfig } from "vitest/config";

/**
 * Configura os testes unitários do pacote de autenticação.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
