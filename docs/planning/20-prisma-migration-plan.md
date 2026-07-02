# Prisma Migration Plan

## Objetivo

Definir como o banco deve evoluir por etapas usando Prisma, reduzindo risco de retrabalho e mantendo aderência aos slices planejados.

## Princípios

- migrar em camadas pequenas;
- refletir os slices do MVP;
- evitar criar tabelas de futuras fases cedo demais;
- manter seeds idempotentes;
- revisar constraints e índices a cada etapa.

## Estratégia geral

O banco deve evoluir em ondas:

1. core de tenant e auth;
2. cadastros base;
3. núcleo de orçamento;
4. compartilhamento e auditoria;
5. refinamentos e otimizações.

## Migração 001 - Core tenant e auth

### Inclui

- Tenant
- User
- Role
- UserRole
- AuthSession

### Objetivo

Habilitar autenticação, sessão persistida e isolamento multiempresa desde o início.

### Seeds

- roles base: `owner`, `admin`, `seller`

### Validações

- unicidade de e-mail por tenant;
- roles por tenant;
- sessão vinculada a usuário e tenant.

## Migração 002 - Cadastros base

### Inclui

- Customer
- Category
- Brand
- Product
- ProductSpecification

### Objetivo

Habilitar catálogo e cadastro reutilizável para montagem de orçamento.

### Validações

- slug único por tenant em categoria e marca;
- produto sempre associado a categoria;
- especificações sempre associadas a produto.

## Migração 003 - Núcleo de orçamentos

### Inclui

- Quote
- QuoteVersion
- QuoteItem

### Objetivo

Habilitar criação, cálculo e versionamento do orçamento.

### Validações

- `versionNumber` único por orçamento;
- itens pertencendo à versão;
- dados monetários em centavos;
- relacionamentos tenant-aware.

## Migração 004 - Compartilhamento e auditoria

### Inclui

- QuoteShareLink
- AuditLog

### Objetivo

Habilitar link público, revogação, expiração e rastreabilidade mínima.

### Validações

- `slug` globalmente único;
- status coerente;
- logs gravando ação, ator e entidade.

## Migração 005 - Ajustes e índices

### Inclui

- índices adicionais;
- otimizações de consulta;
- possíveis soft deletes, se aprovados;
- refinamentos de constraints.

### Objetivo

Melhorar performance e robustez depois que os fluxos centrais já estiverem estáveis.

## Ordem recomendada de execução

1. `001_core_auth_tenant`
2. `002_catalog_and_customers`
3. `003_quotes_and_versions`
4. `004_share_and_audit`
5. `005_indexes_and_refinements`

## Política de seed

- seeds devem ser reexecutáveis;
- roles devem ser criadas sem duplicação;
- seed inicial não deve popular dados de negócio reais;
- seed de desenvolvimento pode incluir tenant admin exemplo em fase posterior.

## Convenções de migração

- nomear migrações com prefixo numérico e responsabilidade clara;
- evitar migrações enormes;
- revisar SQL gerado antes de aplicar em ambientes compartilhados;
- nunca misturar mudança de schema com correção de dados ambígua sem plano explícito.

## Gates por migração

### Para toda migração

- `prisma validate`
- `prisma generate`
- migração sobe em banco vazio;
- migração roda sem erro em ambiente local;
- schema documentado se houve mudança estrutural.

### Para migrações críticas

- testar constraints principais;
- testar relações por tenant;
- testar seeds associadas.

## Riscos a evitar

- antecipar tabelas de IA, pricing ou scraping cedo demais;
- criar nullable demais sem razão;
- esquecer índices por `tenantId`;
- amarrar PDF ou link público diretamente à quote em vez da versão;
- misturar mudança de schema com lógica de aplicação ainda não aprovada.

## Checklist operacional

- modelo revisado no documento de dados;
- nomes coerentes com Prisma;
- enums aprovados;
- índices principais definidos;
- seed revisada;
- contrato dos campos monetários mantido.

## Decisões pendentes

- persistir ou inferir `currentVersionId`;
- adotar soft delete em `Product` e `Customer`;
- tenant-scoped roles puras ou seed híbrida inicial.
