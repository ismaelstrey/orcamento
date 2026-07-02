# Testing Strategy By Slice

## Objetivo

Definir a estratégia de testes operacional por slice para que a implementação avance com gates compatíveis com o risco de cada entrega.

## Regra geral

Todo slice deve sair com:

- lint e typecheck verdes;
- validação de entrada coberta;
- testes proporcionais ao risco;
- documentação coerente com o que foi entregue.

## Níveis de prioridade

- P0: bloqueia avanço do MVP;
- P1: necessário para MVP utilizável;
- P2: importante, mas com gate mais leve inicialmente.

## Matriz por slice

### Slice 01 - Estrutura base do workspace

- prioridade: P1
- testes mínimos:
  - smoke de scripts
  - lint
  - typecheck
- gate:
  - workspace sobe sem erro

### Slice 02 - Configuração base de ambiente

- prioridade: P0
- testes mínimos:
  - leitura de env válida
  - falha rápida com env inválida
  - contrato `.env.example`
- gate:
  - nenhuma variável obrigatória fica implícita

### Slice 03 - Prisma inicial auth e tenant

- prioridade: P0
- testes mínimos:
  - `prisma validate`
  - `prisma generate`
  - migração em banco vazio
  - seed idempotente
- gate:
  - relações e constraints principais confirmadas

### Slice 04 - Middleware de autenticação

- prioridade: P0
- testes mínimos:
  - login válido
  - login inválido
  - refresh válido
  - refresh com sessão revogada
  - logout
  - `me`
- gate:
  - JWT e sessão funcionam com casos positivos e negativos

### Slice 05 - Middleware de autorização

- prioridade: P0
- testes mínimos:
  - rota permitida por role
  - rota negada por role
  - tentativa sem autenticação
  - tentativa cross-tenant
- gate:
  - 401 e 403 corretos

### Slice 06 - Clientes

- prioridade: P1
- testes mínimos:
  - create customer
  - list customer
  - update customer
  - isolamento por tenant
- gate:
  - CRUD funcional e validado

### Slice 07 - Catálogo

- prioridade: P1
- testes mínimos:
  - create category
  - create brand
  - create product
  - validação de especificações
  - listagem paginada
- gate:
  - catálogo reutilizável e isolado por tenant

### Slice 08 - Núcleo de quote

- prioridade: P0
- testes mínimos:
  - criação de quote
  - cálculo de subtotal
  - cálculo de total
  - item manual
  - item de catálogo
- gate:
  - totais corretos e persistência íntegra

### Slice 09 - Listagem e detalhe de orçamentos

- prioridade: P1
- testes mínimos:
  - listagem paginada
  - detalhe com versão atual
  - estados vazios principais
- gate:
  - detalhe coerente com a versão atual

### Slice 10 - Versionamento

- prioridade: P0
- testes mínimos:
  - criar nova versão
  - preservar versão anterior
  - congelar itens corretamente
  - histórico navegável
- gate:
  - histórico imutável

### Slice 11 - Importação JSON

- prioridade: P0
- testes mínimos:
  - schema válido
  - schema inválido
  - warnings
  - criação de draft
- gate:
  - importação utilizável e segura

### Slice 12 - Exportação JSON

- prioridade: P0
- testes mínimos:
  - contrato de saída
  - round-trip export -> import
  - estabilidade do serializer
- gate:
  - exportação reimportável

### Slice 13 - PDF

- prioridade: P1
- testes mínimos:
  - geração a partir da versão correta
  - resposta com `fileUrl`
  - falha controlada
- gate:
  - PDF coerente com a versão

### Slice 14 - Share link público

- prioridade: P0
- testes mínimos:
  - criação do link
  - acesso público válido
  - revogação
  - expiração
  - payload público seguro
- gate:
  - sem vazamento de dados internos

### Slice 15 - Dashboard

- prioridade: P2
- testes mínimos:
  - KPIs básicos
  - tenant isolation
  - estado vazio
- gate:
  - não degradar fluxo principal

### Slice 16 - Auditoria mínima

- prioridade: P0
- testes mínimos:
  - eventos de login
  - eventos de quote
  - eventos de versão
  - eventos de share link
- gate:
  - rastreabilidade mínima garantida

### Slice 17 - Testes críticos do MVP

- prioridade: P0
- testes mínimos:
  - suíte transversal auth
  - tenant isolation
  - quote
  - versionamento
  - importação
  - share link
- gate:
  - nenhuma falha crítica aberta

## Tipos de teste

### Unitários

- regras de cálculo;
- utilitários de auth;
- serialização;
- helpers de auditoria.

### Integração

- rotas;
- repositórios;
- Prisma;
- middlewares;
- import/export;
- share link.

### Contrato

- Zod;
- DTOs;
- Swagger;
- exportação JSON.

### E2E enxuto

- login;
- criar quote;
- versionar;
- exportar/importar;
- gerar PDF;
- publicar link.

## Gates mínimos para CI

- `lint`
- `typecheck`
- `unit-tests`
- `integration-tests` do slice alterado

## Gates condicionais

### Mudança em auth ou tenant

- testes de segurança;
- testes de sessão;
- testes de autorização.

### Mudança em quote ou versionamento

- testes financeiros;
- testes históricos;
- testes de integridade por versão.

### Mudança em import/export

- testes de contrato;
- round-trip;
- casos inválidos.

### Mudança em PDF ou share link

- testes de binding com versão;
- testes públicos;
- testes de revogação e expiração.

## Dados de teste mínimos

- 2 tenants;
- 1 owner;
- 1 admin;
- 1 seller;
- 1 customer por tenant;
- 2 produtos por tenant;
- 1 orçamento com duas versões;
- 1 share link ativo;
- 1 share link revogado.

## Critério para liberar próxima fase

- gates do slice atual aprovados;
- sem bug crítico aberto no fluxo central;
- documentação atualizada;
- risco principal mitigado.
