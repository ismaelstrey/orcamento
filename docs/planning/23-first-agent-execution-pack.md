# First Agent Execution Pack

## Objetivo

Preparar o primeiro pacote real de execução para agentes, com ordem, escopo, referências, critérios de aceite e limites claros.

## Estratégia

O primeiro ciclo de execução deve cobrir apenas a fundação técnica e o core auth/tenant.

Não deve entrar ainda em:

- catálogo;
- quotes;
- PDF;
- share link;
- dashboard;
- IA.

## Slices cobertos neste pacote

- Slice 01
- Slice 02
- Slice 03
- Slice 04
- Slice 05

## Ordem de execução recomendada

1. bootstrap do repositório
2. contrato de ambiente
3. Prisma core auth/tenant
4. autenticação JWT + sessão
5. autorização RBAC

## Task Pack 01 - Bootstrap do repositório

### Objetivo

Criar a base física do monorepo e do workspace.

### Referências

- `19-repository-bootstrap-plan.md`
- `02-technical-architecture.md`
- `08-repository-structure.md`

### Entregáveis

- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `eslint.config.js`
- `.gitignore`
- `apps/web`
- `packages/shared`
- `packages/auth`
- `prisma/`

### Critérios de aceite

- `pnpm install` funciona;
- `pnpm lint` funciona;
- `pnpm typecheck` funciona;
- `pnpm dev` sobe a app principal.

### Fora do escopo

- regras de negócio;
- Prisma final do domínio;
- telas além da base do app.

## Task Pack 02 - Contrato de ambiente

### Objetivo

Formalizar variáveis e leitura tipada de config.

### Referências

- `19-repository-bootstrap-plan.md`
- `14-zod-and-dto-spec.md`

### Entregáveis

- `.env.example`
- `packages/shared/src/config/env.ts`
- documentação curta das variáveis

### Critérios de aceite

- env inválida falha rápido;
- env válida carrega corretamente;
- nenhuma variável crítica fica implícita.

### Fora do escopo

- secrets de produção reais;
- integrações futuras ainda não usadas.

## Task Pack 03 - Prisma core auth/tenant

### Objetivo

Modelar as entidades iniciais do núcleo de acesso.

### Referências

- `11-prisma-data-model.md`
- `20-prisma-migration-plan.md`
- `16-rbac-and-security-spec.md`

### Entregáveis

- `prisma/schema.prisma`
- primeira migração
- seed de roles base

### Critérios de aceite

- `prisma validate`;
- `prisma generate`;
- migração aplicável;
- seed idempotente.

### Fora do escopo

- Customer;
- Product;
- Quote;
- QuoteVersion;
- QuoteItem.

## Task Pack 04 - Auth JWT e sessão

### Objetivo

Implementar login, refresh, logout e `me`.

### Referências

- `12-api-spec.md`
- `14-zod-and-dto-spec.md`
- `16-rbac-and-security-spec.md`

### Entregáveis

- rotas de auth;
- schemas Zod;
- serviços de token;
- sessão persistida;
- middleware `authenticate`.

### Critérios de aceite

- login válido retorna tokens;
- refresh rotaciona sessão;
- logout revoga sessão;
- `me` retorna contexto autenticado.

### Fora do escopo

- recuperação de senha;
- convite completo;
- MFA;
- SSO.

## Task Pack 05 - RBAC e autorização

### Objetivo

Garantir acesso por papel e por tenant.

### Referências

- `16-rbac-and-security-spec.md`
- `22-testing-strategy-by-slice.md`

### Entregáveis

- middleware `authorize`;
- guards por role;
- filtro por tenant;
- testes de acesso permitido e negado.

### Critérios de aceite

- `owner`, `admin` e `seller` respeitados;
- acesso cross-tenant bloqueado;
- 401 e 403 coerentes.

### Fora do escopo

- escopo fino por recurso do vendedor;
- dashboard com permissão diferenciada.

## Template operacional de task para agentes

```text
Nome:
Objetivo:
Referências:
Arquivos esperados:
Critérios de aceite:
Validações:
Fora do escopo:
```

## Regras do primeiro ciclo

- não misturar mais de um task pack por agente sem necessidade;
- revisar contratos antes de implementar;
- toda alteração de contrato atualiza documentação correspondente;
- qualquer divergência com arquitetura deve voltar para ADR.

## Gates do pacote

- bootstrap funcional;
- config tipada funcional;
- Prisma core auth/tenant validado;
- auth funcional;
- RBAC funcional;
- testes P0 deste pacote verdes.

## Saída esperada do primeiro ciclo

Ao final deste pacote, o projeto deve estar pronto para iniciar:

- Slice 06 - clientes;
- Slice 07 - catálogo;
- Slice 08 - núcleo de quotes.

## Próximo pacote após este

- Customers
- Catalog
- Quote core
- Quote listing/detail
- Versioning
