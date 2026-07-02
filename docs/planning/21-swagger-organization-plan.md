# Swagger Organization Plan

## Objetivo

Definir como a documentação Swagger/OpenAPI deve ser organizada para acompanhar a implementação sem virar artefato desatualizado.

## Princípios

- Swagger é contrato vivo;
- toda rota relevante do MVP deve nascer documentada;
- DTOs, Zod e Swagger devem permanecer coerentes;
- mudanças de contrato exigem atualização documental na mesma entrega.

## Domínios da API

Os endpoints devem ser organizados em grupos:

- auth
- organization
- users
- customers
- categories
- brands
- products
- quotes
- quoteVersions
- importExport
- shareLinks
- public
- dashboard

## Estrutura sugerida

### Se documentação for centralizada por módulo

```text
src/docs/
  openapi/
    index.ts
    schemas/
    paths/
```

### Se a documentação acompanhar módulos

```text
src/
  controllers/
  routes/
  services/
  validators/
  docs/
    auth/
    customers/
    catalog/
    quotes/
    public/
```

## Padrão de documentação por rota

Cada rota relevante deve documentar:

- resumo;
- descrição curta;
- autenticação exigida ou pública;
- parâmetros de path;
- query params;
- body;
- responses de sucesso;
- responses de erro;
- exemplos.

## Schemas prioritários

- loginRequest
- loginResponse
- meResponse
- createUserRequest
- createCustomerRequest
- customerResponse
- createCategoryRequest
- createBrandRequest
- createProductRequest
- productResponse
- createQuoteRequest
- quoteResponse
- createQuoteVersionRequest
- quoteVersionResponse
- importQuoteJsonRequest
- exportQuoteJsonResponse
- createShareLinkRequest
- shareLinkResponse
- pdfResponse
- dashboardSummaryResponse
- errorResponse

## Política de versionamento

- usar `/api/v1` desde o início;
- não quebrar contratos silenciosamente;
- se um contrato mudar, atualizar exemplos, schemas e referências.

## Organização por slice

### Slice 04 e 05

Documentar:

- login
- refresh
- logout
- me

### Slice 06

Documentar:

- customers list
- customers create
- customers detail
- customers update

### Slice 07

Documentar:

- categories
- brands
- products

### Slice 08 a 10

Documentar:

- create quote
- list quotes
- quote detail
- create quote version
- list versions
- version detail

### Slice 11 e 12

Documentar:

- import JSON
- export JSON

### Slice 13 e 14

Documentar:

- generate PDF
- create share link
- revoke share link
- public quote

### Slice 15

Documentar:

- dashboard summary

## Erros padronizados

Swagger deve documentar, no mínimo:

- `validation_error`
- `authentication_error`
- `authorization_error`
- `not_found`
- `tenant_scope_error`
- `share_link_expired`
- `share_link_revoked`
- `import_schema_error`
- `pdf_generation_error`

## Boas práticas

- usar exemplos reais do domínio de orçamento;
- documentar campos monetários em centavos;
- deixar claro quando o payload pertence a uma `quoteVersion`;
- documentar rotas públicas separadas das autenticadas;
- não duplicar descrições contraditórias com Zod e DTOs.

## Critério de pronto por módulo

Um módulo só deve ser considerado bem entregue quando:

- rota existir;
- validação existir;
- contrato Swagger existir;
- exemplos de request/response existirem;
- erros principais estiverem documentados.

## Decisões pendentes

- ferramenta final de geração OpenAPI a partir de código ou documentação manual assistida;
- centralização única do spec ou composição modular;
- padronização de envelope de sucesso.
