import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Configura os testes unitários do app web com suporte ao alias local `@/`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
