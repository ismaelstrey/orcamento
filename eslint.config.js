import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["packages/**/*.{ts,tsx}", "workers/**/*.{ts,tsx}", "prisma/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error"
    }
  },
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**"
    ]
  }
];
