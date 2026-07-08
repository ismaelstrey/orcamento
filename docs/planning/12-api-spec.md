# Api Spec

## Objetivo

Definir os contratos prioritários de API para o MVP, orientando backend, frontend, documentação Swagger e futuras tarefas de implementação assistida por IA.

## Convenções globais

### Prefixo

Todas as rotas autenticadas devem usar:

```text
/api/v1
```

### Autenticação

As rotas protegidas devem receber:

```text
Authorization: Bearer <accessToken>
```

### Padrão de paginação

Query params recomendados:

- `page`
- `pageSize`
- `search`
- `sortBy`
- `sortOrder`

### Envelope de erro

```json
{
  "error": "validation_error",
  "details": {
    "field": "email",
    "message": "E-mail inválido"
  }
}
```

### Regras gerais

- validação explícita com schema;
- respostas consistentes;
- erros claros;
- versionamento desde o início;
- documentação Swagger como contrato vivo.

## Auth

### POST /api/v1/auth/login

Autentica usuário.

Request:

```json
{
  "email": "admin@empresa.com",
  "password": "123456"
}
```

Response:

```json
{
  "accessToken": "jwt",
  "refreshToken": "opaque-or-jwt",
  "expiresIn": 900,
  "user": {
    "id": "usr_1",
    "name": "Admin",
    "email": "admin@empresa.com"
  },
  "tenant": {
    "id": "ten_1",
    "name": "Empresa X",
    "slug": "empresa-x"
  },
  "roles": ["owner", "seller"]
}
```

### POST /api/v1/auth/refresh

Renova access token a partir da sessão válida.

### POST /api/v1/auth/logout

Revoga a sessão atual.

### GET /api/v1/auth/me

Retorna usuário autenticado, tenant atual e papéis.

## Organization

### GET /api/v1/organization/current

Retorna informações do tenant atual.

### GET /api/v1/users

Lista usuários do tenant.

### POST /api/v1/users

Cria usuário do tenant.

Request:

```json
{
  "name": "Novo Usuário",
  "email": "novo@empresa.com",
  "password": "senhaForte",
  "roles": ["seller"]
}
```

### GET /api/v1/roles

Lista papéis disponíveis.

## Customers

### GET /api/v1/customers

Lista clientes do tenant.

### POST /api/v1/customers

Cria cliente.

Request:

```json
{
  "name": "Cliente Exemplo",
  "email": "cliente@empresa.com",
  "phone": "5599999999999",
  "document": "00000000000",
  "notes": "Cliente recorrente"
}
```

### GET /api/v1/customers/:id

Detalha cliente.

### PATCH /api/v1/customers/:id

Atualiza cliente.

## Catalog

### Categories

- `GET /api/v1/categories`
- `POST /api/v1/categories`

Request:

```json
{
  "name": "Processadores",
  "slug": "processadores"
}
```

### Brands

- `GET /api/v1/brands`
- `POST /api/v1/brands`

Request:

```json
{
  "name": "AMD",
  "slug": "amd"
}
```

### Products

- `GET /api/v1/products`
- `POST /api/v1/products`
- `GET /api/v1/products/:id`
- `PATCH /api/v1/products/:id`

Request:

```json
{
  "categoryId": "cat_1",
  "brandId": "brd_1",
  "name": "Ryzen 7600",
  "sku": "100-000001015",
  "description": "Processador 6/12 para AM5",
  "basePriceCents": 119900,
  "currency": "BRL",
  "specifications": [
    {
      "key": "socket",
      "value": "AM5"
    },
    {
      "key": "cores",
      "value": "6"
    }
  ]
}
```

## Quotes

### POST /api/v1/quotes

Cria orçamento com primeira versão.

Request:

```json
{
  "customerId": "cus_1",
  "title": "Orçamento PC Escritório",
  "publicNotes": "Validade de 7 dias",
  "internalNotes": "Cliente quer margem para upgrade",
  "items": [
    {
      "productId": "prd_1",
      "quantity": 2
    },
    {
      "productName": "Serviço de instalação",
      "quantity": 1,
      "unitPriceCents": 25000
    }
  ]
}
```

Response:

```json
{
  "id": "quo_1",
  "status": "draft",
  "currentVersion": {
    "id": "qv_1",
    "versionNumber": 1,
    "subtotalCents": 425000,
    "discountCents": 0,
    "totalCents": 425000
  }
}
```

### GET /api/v1/quotes

Lista orçamentos do tenant.

### GET /api/v1/quotes/:id

Detalha orçamento com resumo da versão atual.

### PATCH /api/v1/quotes/:id

Atualiza metadados do orçamento, sem alterar histórico de versões já consolidadas.

### GET /api/v1/quotes/:id/versions

Lista versões do orçamento.

### GET /api/v1/quotes/:id/versions/:versionId

Detalha versão específica.

### POST /api/v1/quotes/:id/versions

Cria nova versão.

Request:

```json
{
  "label": "Revisão com SSD maior",
  "items": [
    {
      "productId": "prd_2",
      "quantity": 1
    },
    {
      "productName": "Serviço adicional",
      "quantity": 1,
      "unitPriceCents": 15000
    }
  ]
}
```

## Importação e exportação JSON

### POST /api/v1/ai/quote-draft

Gera uma revisão de draft de orçamento a partir de briefing em linguagem natural.

Request:

```json
{
  "customerId": "cus_1",
  "userText": "Preciso de tres notebooks corporativos para equipe comercial.",
  "currency": "BRL",
  "budgetMaxCents": 1200000,
  "catalogHints": [
    {
      "productId": "prd_1",
      "name": "Notebook corporativo i5",
      "category": "notebooks"
    }
  ]
}
```

Response esperada:

- payload importável no contrato de `POST /api/v1/quotes/import-json`;
- versão de prompt e schema usados;
- resumo de confiança;
- warnings determinísticos;
- métricas de provider quando houver IA configurada.

Quando nenhum provider estiver configurado, a rota deve responder `503` com:

```json
{
  "error": "provider_error",
  "details": {
    "message": "Nenhum provider de IA configurado para gerar draft."
  }
}
```

Para desenvolvimento e demos sem custo externo, o provider determinístico local
pode ser habilitado com:

```text
AI_QUOTE_DRAFT_PROVIDER=local
```

A geração deve registrar auditoria com metadados seguros (`provider`, versão de
prompt, quantidade de itens, warnings e tamanho do briefing), sem persistir o
texto bruto enviado pelo usuário.

### POST /api/v1/quotes/import-json

Importa um orçamento estruturado e cria draft inicial.

Request:

```json
{
  "customerId": "cus_1",
  "schemaVersion": "1.0.0",
  "currency": "BRL",
  "category": "Computador",
  "budgetMaxCents": 500000,
  "usageContext": "Escritório",
  "items": [
    {
      "type": "cpu",
      "model": "Ryzen 7600",
      "quantity": 1
    }
  ],
  "notes": "Priorizar baixo ruído"
}
```

Response esperada:

- orçamento criado em draft;
- inconsistências retornadas de forma estruturada;
- itens normalizados quando possível.

### GET /api/v1/quotes/:id/export-json

Exporta snapshot reimportável.

Response exemplo:

```json
{
  "schemaVersion": "1.0.0",
  "quote": {
    "id": "quo_1",
    "title": "Orçamento PC Escritório"
  },
  "version": {
    "id": "qv_2",
    "versionNumber": 2,
    "currency": "BRL",
    "totalCents": 450000
  },
  "items": [
    {
      "productName": "Ryzen 7600",
      "quantity": 1,
      "unitPriceCents": 120000
    }
  ]
}
```

## PDF

### POST /api/v1/quotes/:id/pdf

Gera PDF a partir de uma versão informada ou da versão atual.

Response:

```json
{
  "fileUrl": "https://cdn.exemplo.com/quotes/quo_1/qv_2.pdf",
  "quoteVersionId": "qv_2"
}
```

## Share links

### POST /api/v1/quotes/:id/share-links

Publica versão por link.

Request:

```json
{
  "quoteVersionId": "qv_2",
  "expiresAt": "2026-07-15T23:59:59.000Z"
}
```

Response:

```json
{
  "id": "sql_1",
  "slug": "q_k29as81xz",
  "url": "https://app.exemplo.com/public/quotes/q_k29as81xz",
  "status": "active",
  "expiresAt": "2026-07-15T23:59:59.000Z"
}
```

### POST /api/v1/quotes/:id/share-links/:shareLinkId/revoke

Revoga link público.

## Public

### GET /api/v1/public/quotes/:slug

Retorna versão compartilhada para visualização pública.

Regras:

- nunca expor dados internos do tenant;
- respeitar status do link;
- respeitar expiração;
- exibir somente o que foi definido como público.

## Dashboard

### GET /api/v1/dashboard/summary

Retorna indicadores mínimos do MVP:

- total de orçamentos;
- orçamentos no mês;
- clientes ativos;
- links publicados;
- produtos mais usados.

## Códigos de erro prioritários

- `validation_error`
- `authentication_error`
- `authorization_error`
- `not_found`
- `tenant_scope_error`
- `share_link_expired`
- `share_link_revoked`
- `import_schema_error`
- `pdf_generation_error`

## DTOs conceituais prioritários

### Auth

- loginRequest
- loginResponse
- refreshRequest
- meResponse

### Customers

- createCustomerRequest
- updateCustomerRequest
- customerResponse
- customerListResponse

### Catalog

- createCategoryRequest
- createBrandRequest
- createProductRequest
- updateProductRequest
- productResponse

### Quotes

- createQuoteRequest
- quoteResponse
- createQuoteVersionRequest
- quoteVersionResponse
- importQuoteJsonRequest
- exportQuoteJsonResponse
- createShareLinkRequest
- shareLinkResponse
- pdfResponse

## Decisões pendentes

- definir envelope padrão de sucesso ou resposta direta;
- definir padrão final de paginação;
- definir política exata de idempotência em geração de PDF;
- definir se importação JSON cria orçamento automaticamente ou draft revisável por confirmação.
