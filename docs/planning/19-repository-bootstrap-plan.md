# Repository Bootstrap Plan

## Objetivo

Definir a sequência exata de preparação do repositório para iniciar o primeiro ciclo de implementação com baixo retrabalho.

## Resultado esperado

Ao final do bootstrap, o projeto deve ter:

- repositório Git local inicializado;
- workspace pnpm funcionando;
- app principal `apps/web` criado;
- `packages/shared` e `packages/auth` preparados;
- TypeScript base configurado;
- ESLint configurado;
- contrato de ambiente preparado;
- Prisma preparado para o próximo slice;
- scripts padronizados na raiz.

## Ordem de execução

### Etapa 1 - Inicialização local do repositório

- inicializar Git local;
- garantir branch principal definida;
- criar `.gitignore`;
- revisar README principal.

### Etapa 2 - Workspace raiz

- criar `package.json` raiz com `private: true`;
- criar `pnpm-workspace.yaml`;
- criar `.npmrc` se necessário;
- padronizar scripts globais.

### Etapa 3 - TypeScript e lint base

- criar `tsconfig.base.json`;
- configurar ESLint compartilhado;
- ativar regras de TypeScript estrito;
- bloquear `any`.

### Etapa 4 - Aplicação principal

- criar `apps/web` com Next.js 16;
- habilitar Tailwind v4;
- habilitar ESLint;
- validar scripts `dev`, `build`, `lint` e `typecheck`.

### Etapa 5 - Pacotes compartilhados iniciais

- criar `packages/shared`;
- criar `packages/auth`;
- preparar `src/` em ambos;
- configurar exports mínimos.

### Etapa 6 - Ambiente e config

- criar `.env.example`;
- criar validador tipado de ambiente;
- mapear segredos do MVP;
- separar variáveis de app, banco, auth e cache.

### Etapa 7 - Prisma base

- instalar `prisma` e `@prisma/client`;
- criar pasta `prisma/`;
- criar `schema.prisma` inicial vazio ou mínimo;
- validar `prisma generate`.

### Etapa 8 - Verificação final do bootstrap

- rodar `pnpm install`;
- rodar `pnpm lint`;
- rodar `pnpm typecheck`;
- rodar `pnpm dev`;
- confirmar coerência da árvore criada.

## Árvore mínima ao final

```text
apps/
  web/
packages/
  shared/
  auth/
workers/
  price-monitor/
  notifications/
prisma/
docs/
agents/
package.json
pnpm-workspace.yaml
tsconfig.base.json
eslint.config.js
.env.example
```

## Arquivos prioritários

### Root

- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `eslint.config.js`
- `.gitignore`
- `.env.example`

### App

- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/src/app/...`

### Shared

- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/config/env.ts`

### Auth

- `packages/auth/package.json`
- `packages/auth/tsconfig.json`
- `packages/auth/src/...`

### Prisma

- `prisma/schema.prisma`
- `prisma/seed.ts`

## Scripts recomendados na raiz

```json
{
  "scripts": {
    "dev": "pnpm --filter web dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "db:generate": "prisma generate --schema ./prisma/schema.prisma",
    "db:migrate": "prisma migrate dev --schema ./prisma/schema.prisma",
    "db:seed": "prisma db seed --schema ./prisma/schema.prisma"
  }
}
```

## Regras de bootstrap

- não implementar regras de negócio nesta fase;
- não criar módulos vazios sem responsabilidade clara;
- não adicionar integrações futuras sem necessidade imediata;
- manter tudo estrito, tipado e validável.

## Critério de pronto

O bootstrap estará pronto quando:

- workspace subir corretamente;
- scripts principais funcionarem;
- estrutura ficar consistente com a documentação;
- o repositório estiver pronto para o Slice 03.

## Dependências imediatas após bootstrap

- Slice 03: Prisma core auth/tenant;
- Slice 04: autenticação;
- Slice 05: autorização.
