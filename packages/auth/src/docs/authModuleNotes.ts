/**
 * Resume o escopo implementado no slice atual do módulo de autenticação.
 */
export const authModuleNotes = {
  scope: [
    "schemas zod de auth",
    "jwt e refresh token",
    "serviço de login, refresh, logout e me",
    "middleware de authenticate",
    "middleware de authorize",
    "contratos de repositório para persistência"
  ],
  nextStep: [
    "adaptar o AuthRepository para Prisma",
    "plugar controllers e routes na camada HTTP real",
    "adicionar testes automatizados do fluxo de auth"
  ]
} as const;
