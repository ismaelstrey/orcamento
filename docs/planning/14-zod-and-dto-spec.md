# Zod And Dto Spec

## Objetivo

Definir os DTOs conceituais e os schemas de validação prioritários do MVP para orientar backend, frontend, Swagger e futuras implementações com Zod.

## Princípios

- todo request relevante deve ter schema explícito;
- toda response importante deve ter shape previsível;
- erros de validação devem ser claros;
- schemas devem refletir regras do domínio e do contrato de API;
- o frontend deve reutilizar tipos e contratos sempre que possível.

## Convenções

### Nomenclatura

- `xxxRequestSchema`
- `xxxResponseSchema`
- `xxxParamsSchema`
- `xxxQuerySchema`

### Campos monetários

- usar `Int` em centavos no backend;
- expor em DTOs como `number` inteiro;
- incluir `currency` sempre que relevante.

### IDs

- tratar como `string`;
- validar presença;
- não confiar em formato visual como regra de segurança.

## Envelope de erro

Schema conceitual:

```ts
const errorResponseSchema = z.object({
  error: z.string(),
  details: z
    .object({
      field: z.string().optional(),
      message: z.string(),
    })
    .optional(),
});
```

## Auth

### loginRequestSchema

```ts
const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
});
```

### loginResponseSchema

```ts
const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  user: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
  }),
  tenant: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    slug: z.string().min(1),
  }),
  roles: z.array(z.enum(["owner", "admin", "seller"])).min(1),
});
```

### refreshRequestSchema

Se o refresh for por body:

```ts
const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});
```

### meResponseSchema

```ts
const meResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    status: z.enum(["active", "invited", "disabled"]),
  }),
  tenant: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
  roles: z.array(z.enum(["owner", "admin", "seller"])),
});
```

## Users

### createUserRequestSchema

```ts
const createUserRequestSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  roles: z.array(z.enum(["owner", "admin", "seller"])).min(1),
});
```

### userResponseSchema

```ts
const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  status: z.enum(["active", "invited", "disabled"]),
  roles: z.array(z.enum(["owner", "admin", "seller"])),
  createdAt: z.string(),
});
```

## Customers

### createCustomerRequestSchema

```ts
const createCustomerRequestSchema = z.object({
  name: z.string().min(2).max(160),
  email: z.string().email().optional(),
  phone: z.string().min(8).max(30).optional(),
  document: z.string().min(3).max(30).optional(),
  notes: z.string().max(2000).optional(),
});
```

### updateCustomerRequestSchema

```ts
const updateCustomerRequestSchema = createCustomerRequestSchema.partial();
```

### customerResponseSchema

```ts
const customerResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  document: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
```

## Catalog

### createCategoryRequestSchema

```ts
const createCategoryRequestSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120),
});
```

### createBrandRequestSchema

```ts
const createBrandRequestSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120),
});
```

### productSpecificationSchema

```ts
const productSpecificationSchema = z.object({
  key: z.string().min(1).max(120),
  value: z.string().min(1).max(500),
});
```

### createProductRequestSchema

```ts
const createProductRequestSchema = z.object({
  categoryId: z.string().min(1),
  brandId: z.string().min(1).optional(),
  name: z.string().min(2).max(180),
  sku: z.string().max(120).optional(),
  description: z.string().max(4000).optional(),
  basePriceCents: z.number().int().nonnegative(),
  currency: z.string().length(3),
  specifications: z.array(productSpecificationSchema).default([]),
});
```

### updateProductRequestSchema

```ts
const updateProductRequestSchema = createProductRequestSchema.partial();
```

### productResponseSchema

```ts
const productResponseSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  brandId: z.string().nullable().optional(),
  name: z.string(),
  sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  basePriceCents: z.number().int(),
  currency: z.string(),
  isActive: z.boolean(),
  specifications: z.array(productSpecificationSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
```

## Quotes

### quoteItemInputSchema

```ts
const quoteItemInputSchema = z
  .object({
    productId: z.string().min(1).optional(),
    productName: z.string().min(2).max(180).optional(),
    productDescription: z.string().max(4000).optional(),
    quantity: z.number().int().positive(),
    unitPriceCents: z.number().int().nonnegative().optional(),
  })
  .superRefine((value, ctx) => {
    const hasProduct = Boolean(value.productId);
    const hasManual = Boolean(value.productName && value.unitPriceCents !== undefined);

    if (!hasProduct && !hasManual) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe productId ou item manual com productName e unitPriceCents.",
      });
    }
  });
```

### createQuoteRequestSchema

```ts
const createQuoteRequestSchema = z.object({
  customerId: z.string().min(1),
  title: z.string().min(2).max(180),
  publicNotes: z.string().max(4000).optional(),
  internalNotes: z.string().max(4000).optional(),
  items: z.array(quoteItemInputSchema).min(1),
});
```

### updateQuoteRequestSchema

```ts
const updateQuoteRequestSchema = z.object({
  title: z.string().min(2).max(180).optional(),
  publicNotes: z.string().max(4000).optional(),
  internalNotes: z.string().max(4000).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});
```

### createQuoteVersionRequestSchema

```ts
const createQuoteVersionRequestSchema = z.object({
  label: z.string().max(160).optional(),
  items: z.array(quoteItemInputSchema).min(1),
});
```

### quoteSummarySchema

```ts
const quoteSummarySchema = z.object({
  id: z.string(),
  status: z.enum(["draft", "published", "archived"]),
  currentVersion: z.object({
    id: z.string(),
    versionNumber: z.number().int().positive(),
    subtotalCents: z.number().int().nonnegative(),
    discountCents: z.number().int().nonnegative(),
    totalCents: z.number().int().nonnegative(),
    currency: z.string(),
  }),
});
```

### quoteVersionResponseSchema

```ts
const quoteVersionResponseSchema = z.object({
  id: z.string(),
  versionNumber: z.number().int().positive(),
  label: z.string().nullable().optional(),
  currency: z.string(),
  subtotalCents: z.number().int(),
  discountCents: z.number().int(),
  totalCents: z.number().int(),
  sourceType: z.enum(["manual", "import_json", "ai_future"]),
  createdAt: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
      productId: z.string().nullable().optional(),
      productName: z.string(),
      productDescription: z.string().nullable().optional(),
      quantity: z.number().int().positive(),
      unitPriceCents: z.number().int().nonnegative(),
      totalPriceCents: z.number().int().nonnegative(),
    }),
  ),
});
```

## Importação JSON

### importQuoteJsonItemSchema

```ts
const importQuoteJsonItemSchema = z.object({
  type: z.string().min(1).max(120),
  model: z.string().min(1).max(180),
  quantity: z.number().int().positive().default(1),
});
```

### importQuoteJsonRequestSchema

```ts
const importQuoteJsonRequestSchema = z.object({
  customerId: z.string().min(1),
  schemaVersion: z.string().min(1),
  currency: z.string().length(3),
  category: z.string().min(1).max(120),
  budgetMaxCents: z.number().int().positive().optional(),
  usageContext: z.string().max(500).optional(),
  items: z.array(importQuoteJsonItemSchema).min(1),
  notes: z.string().max(4000).optional(),
});
```

### importQuoteJsonResponseSchema

```ts
const importQuoteJsonResponseSchema = z.object({
  quoteId: z.string(),
  versionId: z.string(),
  warnings: z.array(z.string()).default([]),
  normalizedItems: z.array(
    z.object({
      inputType: z.string(),
      inputModel: z.string(),
      matchedProductId: z.string().optional(),
      resolvedName: z.string(),
      quantity: z.number().int().positive(),
    }),
  ),
});
```

### exportQuoteJsonResponseSchema

```ts
const exportQuoteJsonResponseSchema = z.object({
  schemaVersion: z.string(),
  quote: z.object({
    id: z.string(),
    title: z.string(),
  }),
  version: z.object({
    id: z.string(),
    versionNumber: z.number().int().positive(),
    currency: z.string(),
    totalCents: z.number().int().nonnegative(),
  }),
  items: z.array(
    z.object({
      productName: z.string(),
      quantity: z.number().int().positive(),
      unitPriceCents: z.number().int().nonnegative(),
    }),
  ),
});
```

## Share links

### createShareLinkRequestSchema

```ts
const createShareLinkRequestSchema = z.object({
  quoteVersionId: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
});
```

### shareLinkResponseSchema

```ts
const shareLinkResponseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  url: z.string().url(),
  status: z.enum(["active", "revoked", "expired"]),
  expiresAt: z.string().datetime().nullable().optional(),
});
```

## PDF

### generatePdfRequestSchema

```ts
const generatePdfRequestSchema = z.object({
  quoteVersionId: z.string().min(1).optional(),
});
```

### pdfResponseSchema

```ts
const pdfResponseSchema = z.object({
  fileUrl: z.string().url(),
  quoteVersionId: z.string(),
});
```

## Dashboard

### dashboardSummaryResponseSchema

```ts
const dashboardSummaryResponseSchema = z.object({
  totalQuotes: z.number().int().nonnegative(),
  quotesThisMonth: z.number().int().nonnegative(),
  activeCustomers: z.number().int().nonnegative(),
  publishedLinks: z.number().int().nonnegative(),
  topProducts: z.array(
    z.object({
      productId: z.string().optional(),
      productName: z.string(),
      uses: z.number().int().nonnegative(),
    }),
  ),
});
```

## Query params comuns

### paginationQuerySchema

```ts
const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().max(200).optional(),
  sortBy: z.string().max(100).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});
```

## Regras de validação críticas

- `seller` não deve definir `tenantId` em payload nenhum;
- `tenantId` vem do contexto autenticado;
- `createQuoteRequestSchema` deve recusar lista vazia de itens;
- item manual exige `productName` e `unitPriceCents`;
- importação JSON sem itens válidos deve falhar;
- `expiresAt` em share link deve ser futuro;
- campos longos devem ter limites conservadores.

## Organização futura sugerida

```text
packages/shared/src/schemas/
  auth/
  users/
  customers/
  catalog/
  quotes/
  public/
  dashboard/
```

## Decisões pendentes

- padronizar datas como ISO string em todas as responses;
- decidir se refresh token ficará em body ou exclusivamente em cookie;
- decidir se responses usarão envelope de sucesso ou objeto direto.
