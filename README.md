# Orcamento

Repositório de planejamento do projeto **IQP - Intelligent Quote Platform**, uma plataforma SaaS para geração, versionamento, compartilhamento e evolução de orçamentos com suporte a IA.

## Estado Atual

Este repositório já possui **planejamento consolidado, monorepo bootstrapado e slices centrais do MVP implementados**.

Neste momento, a base validada inclui:

- autenticação JWT com refresh token e RBAC tenant-aware;
- CRUD de clientes;
- catálogo base com categorias, marcas, produtos e especificações;
- orçamentos com versionamento, compartilhamento público e exportação/importação JSON;
- geração de PDF por `quoteVersion`;
- dashboard inicial, auditoria mínima e testes críticos;
- frontend com login separado, área autenticada e primeira tela CRUD operacional de clientes;
- migration inicial aplicada em banco real e seed bootstrap validado.

## Fontes de origem

Os materiais-base que originaram este planejamento foram consolidados em:

- `docs/planning/24-source-material-consolidated.md`

## Estrutura criada

```text
docs/
  README.md
  planning/
    00-master-index.md
    01-product-and-scope.md
    02-technical-architecture.md
    03-data-api-and-integrations.md
    04-ai-and-agent-strategy.md
    05-delivery-workflow.md
    06-roadmap-and-backlog.md
    07-quality-risk-and-operations.md
    08-repository-structure.md
    09-open-questions.md
    10-tad-initial.md
    11-prisma-data-model.md
    12-api-spec.md
    13-technical-backlog.md
    14-zod-and-dto-spec.md
    15-frontend-ux-flows.md
    16-rbac-and-security-spec.md
    17-pdf-and-public-share-spec.md
    18-implementation-slices-for-agents.md
    19-repository-bootstrap-plan.md
    20-prisma-migration-plan.md
    21-swagger-organization-plan.md
    22-testing-strategy-by-slice.md
    23-first-agent-execution-pack.md
    24-source-material-consolidated.md
    adr/
      README.md
      0001-core-decisions.md
agents/
  README.md
  task-template.md
```

## Como usar esta documentação

Ordem recomendada de leitura:

1. `docs/planning/00-master-index.md`
2. `docs/planning/01-product-and-scope.md`
3. `docs/planning/02-technical-architecture.md`
4. `docs/planning/03-data-api-and-integrations.md`
5. `docs/planning/04-ai-and-agent-strategy.md`
6. `docs/planning/05-delivery-workflow.md`
7. `docs/planning/06-roadmap-and-backlog.md`
8. `docs/planning/07-quality-risk-and-operations.md`
9. `docs/planning/08-repository-structure.md`
10. `docs/planning/09-open-questions.md`
11. `docs/planning/10-tad-initial.md`
12. `docs/planning/11-prisma-data-model.md`
13. `docs/planning/12-api-spec.md`
14. `docs/planning/13-technical-backlog.md`
15. `docs/planning/14-zod-and-dto-spec.md`
16. `docs/planning/15-frontend-ux-flows.md`
17. `docs/planning/16-rbac-and-security-spec.md`
18. `docs/planning/17-pdf-and-public-share-spec.md`
19. `docs/planning/18-implementation-slices-for-agents.md`
20. `docs/planning/19-repository-bootstrap-plan.md`
21. `docs/planning/20-prisma-migration-plan.md`
22. `docs/planning/21-swagger-organization-plan.md`
23. `docs/planning/22-testing-strategy-by-slice.md`
24. `docs/planning/23-first-agent-execution-pack.md`
25. `docs/planning/24-source-material-consolidated.md`
26. `docs/planning/adr/0001-core-decisions.md`

## Direção estratégica consolidada

- O produto nasce para resolver uma dor operacional real de montagem de orçamentos.
- O primeiro foco é **hardware/TI**, evitando começar como solução genérica para qualquer mercado.
- O **MVP não depende de IA** para existir e gerar valor.
- A IA entra como acelerador de entrada, recomendação e evolução do produto nas fases seguintes.
- A arquitetura já nasce **tenant-aware**, mas a complexidade comercial de multiempresa completa pode ser liberada por fase.
- A documentação é tratada como fonte de verdade para orientar pessoas e agentes de IA.

## Scripts de qualidade

Comandos principais do workspace:

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm db:generate`
- `corepack pnpm db:migrate`
- `corepack pnpm db:seed`

Cobertura atualmente adicionada:

- testes unitários do `@orcamento/auth`;
- testes críticos de `quotes` no app `web`;
- estratégia de testes detalhada em `docs/planning/22-testing-strategy-by-slice.md`.

## Bootstrap do banco

O seed inicial cria ou atualiza os registros base do ambiente:

- `Tenant` bootstrap com slug configurável;
- roles `owner`, `admin` e `seller`;
- usuário owner inicial com senha hash;
- vínculo do owner com a role `owner`.

Variáveis de ambiente documentadas em `.env.example`:

- `BOOTSTRAP_TENANT_NAME`
- `BOOTSTRAP_TENANT_SLUG`
- `BOOTSTRAP_OWNER_NAME`
- `BOOTSTRAP_OWNER_EMAIL`
- `BOOTSTRAP_OWNER_PASSWORD`

Valores padrão do bootstrap:

- tenant: `Bootstrap Tenant`
- slug: `bootstrap-tenant`
- owner: `Owner Bootstrap`
- email: `owner@bootstrap.local`

## Observações operacionais

- O `prisma/seed.ts` carrega `.env` explicitamente para funcionar fora do runtime do Next.js.
- O ambiente Windows exigiu `pnpm` com `--store-dir .pnpm-store` e `--config.package-import-method=copy`.
- Para evitar inconsistências de linking no workspace, a reinstalação mais estável foi com `--node-linker=hoisted`.

## Rotas de UI disponíveis

Fluxos de interface já entregues no app `web`:

- `/login` para autenticação do usuário bootstrap e restauração de sessão no navegador;
- `/dashboard` para a visão operacional autenticada do tenant;
- `/customers` para listagem, busca, cadastro e edição de clientes;
- `/` redirecionando automaticamente para `/dashboard`.

## Próximo passo recomendado

Com a base operacional validada, o próximo passo mais útil é:

- expandir a área autenticada para catálogo e orçamentos usando a mesma base de navegação;
- adaptar `useCatalog` e `useQuotes` para consumo autenticado na UI;
- validar os próximos CRUDs no navegador e consolidar a navegação do MVP.
