# Implementation Slices For Agents

## Objetivo

Quebrar a implementação do MVP em slices pequenas, independentes e adequadas para execução por agentes com baixo risco de inconsistência.

## Regras para usar este documento

- cada slice deve virar uma tarefa separada;
- cada tarefa deve referenciar os documentos relevantes;
- evitar juntar backend, frontend e decisões novas sem delimitação;
- atualizar documentação sempre que uma decisão mudar.

## Slice 01 - Estrutura base do workspace

### Objetivo

Inicializar a estrutura do monorepo e convenções mínimas.

### Resultado esperado

- workspace configurado;
- scripts básicos definidos;
- estrutura de diretórios criada;
- lint e TypeScript configurados.

### Referências

- `02-technical-architecture.md`
- `08-repository-structure.md`
- `13-technical-backlog.md`

## Slice 02 - Configuração base de ambiente

### Objetivo

Criar o contrato de variáveis de ambiente e bootstrap técnico.

### Resultado esperado

- `.env.example`;
- contrato de configuração central;
- leitura tipada de ambiente;
- documentação de variáveis.

### Referências

- `02-technical-architecture.md`
- `07-quality-risk-and-operations.md`

## Slice 03 - Prisma inicial do core auth e tenant

### Objetivo

Modelar Tenant, User, Role, UserRole e AuthSession.

### Resultado esperado

- schema Prisma inicial;
- primeira migração;
- seeds mínimos de roles;
- documentação dos modelos.

### Referências

- `11-prisma-data-model.md`
- `16-rbac-and-security-spec.md`

## Slice 04 - Middleware de autenticação

### Objetivo

Criar o núcleo de JWT, sessão e contexto autenticado.

### Resultado esperado

- emissão de access token;
- refresh token com sessão;
- middleware `authenticate`;
- contexto `authContext`.

### Referências

- `12-api-spec.md`
- `14-zod-and-dto-spec.md`
- `16-rbac-and-security-spec.md`

## Slice 05 - Middleware de autorização

### Objetivo

Criar RBAC básico por papel.

### Resultado esperado

- middleware `authorize`;
- utilitários de role checking;
- cobertura básica de testes para acesso permitido e negado.

### Referências

- `16-rbac-and-security-spec.md`

## Slice 06 - Módulo de clientes

### Objetivo

Entregar CRUD de clientes.

### Resultado esperado

- modelo e repositório;
- schemas Zod;
- endpoints;
- hooks frontend;
- listagem e formulário.

### Referências

- `12-api-spec.md`
- `14-zod-and-dto-spec.md`
- `15-frontend-ux-flows.md`

## Slice 07 - Módulo de catálogo base

### Objetivo

Entregar categorias, marcas e produtos.

### Resultado esperado

- modelos Prisma;
- endpoints de catálogo;
- schemas e DTOs;
- páginas básicas de listagem e cadastro.

### Referências

- `11-prisma-data-model.md`
- `12-api-spec.md`
- `14-zod-and-dto-spec.md`
- `15-frontend-ux-flows.md`

## Slice 08 - Núcleo de quote

### Objetivo

Entregar criação de orçamento com primeira versão.

### Resultado esperado

- modelos Quote, QuoteVersion e QuoteItem;
- cálculo de totais;
- endpoint de criação;
- detalhe inicial do orçamento;
- testes de regra principal.

### Referências

- `10-tad-initial.md`
- `11-prisma-data-model.md`
- `12-api-spec.md`
- `14-zod-and-dto-spec.md`

## Slice 09 - Listagem e detalhe de orçamentos

### Objetivo

Dar visibilidade operacional aos orçamentos criados.

### Resultado esperado

- listagem com paginação;
- detalhe com resumo da versão atual;
- hooks de consulta;
- estado vazio e mensagens principais.

### Referências

- `12-api-spec.md`
- `15-frontend-ux-flows.md`

## Slice 10 - Versionamento

### Objetivo

Permitir nova revisão do orçamento.

### Resultado esperado

- endpoint de nova versão;
- histórico de versões;
- UI básica da timeline;
- congelamento correto dos itens.

### Referências

- `10-tad-initial.md`
- `11-prisma-data-model.md`
- `12-api-spec.md`
- `15-frontend-ux-flows.md`

## Slice 11 - Importação JSON

### Objetivo

Criar fluxo de importação estruturada com validação.

### Resultado esperado

- schema Zod;
- parser;
- retorno de warnings;
- tela de importação;
- criação de draft revisável.

### Referências

- `12-api-spec.md`
- `14-zod-and-dto-spec.md`
- `15-frontend-ux-flows.md`

## Slice 12 - Exportação JSON

### Objetivo

Permitir extração versionada e reimportável.

### Resultado esperado

- endpoint de exportação;
- serializer estável;
- cobertura de contrato;
- ação no detalhe do orçamento.

### Referências

- `12-api-spec.md`
- `14-zod-and-dto-spec.md`

## Slice 13 - Geração de PDF

### Objetivo

Entregar PDF comercial baseado em versão.

### Resultado esperado

- serviço de PDF;
- endpoint de geração;
- resposta com `fileUrl`;
- feedback de sucesso e erro na UI.

### Referências

- `12-api-spec.md`
- `17-pdf-and-public-share-spec.md`
- `15-frontend-ux-flows.md`

## Slice 14 - Share link público

### Objetivo

Entregar compartilhamento público seguro.

### Resultado esperado

- modelo e endpoint de share link;
- revogação;
- página pública;
- estados ativo, expirado e revogado.

### Referências

- `12-api-spec.md`
- `16-rbac-and-security-spec.md`
- `17-pdf-and-public-share-spec.md`
- `15-frontend-ux-flows.md`

## Slice 15 - Dashboard do MVP

### Objetivo

Entregar visão inicial de uso do sistema.

### Resultado esperado

- endpoint de resumo;
- cards principais;
- listagem de recentes;
- estados vazios coerentes.

### Referências

- `12-api-spec.md`
- `15-frontend-ux-flows.md`

## Slice 16 - Auditoria mínima

### Objetivo

Registrar ações sensíveis do MVP.

### Resultado esperado

- modelo AuditLog operacional;
- helpers de audit;
- eventos de login, quote, versão e share link.

### Referências

- `10-tad-initial.md`
- `11-prisma-data-model.md`
- `16-rbac-and-security-spec.md`

## Slice 17 - Testes críticos do MVP

### Objetivo

Cobrir os fluxos mais sensíveis antes de evoluir o produto.

### Resultado esperado

- testes de auth;
- testes de tenant isolation;
- testes de quote creation;
- testes de versionamento;
- testes de share link;
- testes de importação JSON.

### Referências

- `07-quality-risk-and-operations.md`
- `13-technical-backlog.md`
- `16-rbac-and-security-spec.md`

## Modelo de tarefa recomendado para cada slice

```text
Objetivo:
Escopo:
Arquivos esperados:
Restrições:
Critérios de aceite:
Fora do escopo:
Validações:
```

## Anti-padrões para agentes

- tentar implementar múltiplos slices grandes em uma única tarefa;
- mudar contrato de API sem atualizar documentação;
- criar acesso sem filtro de tenant;
- tratar PDF e link público como recursos da quote viva, em vez da versão;
- deixar validação apenas no frontend.

## Ordem sugerida

1. Slice 01
2. Slice 02
3. Slice 03
4. Slice 04
5. Slice 05
6. Slice 06
7. Slice 07
8. Slice 08
9. Slice 09
10. Slice 10
11. Slice 11
12. Slice 12
13. Slice 13
14. Slice 14
15. Slice 15
16. Slice 16
17. Slice 17
