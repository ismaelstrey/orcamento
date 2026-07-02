# Prisma Data Model

## Objetivo

Definir a modelagem conceitual detalhada do banco para o MVP, alinhada com Prisma, PostgreSQL e com a necessidade de nascer multiempresa.

## Princípios de modelagem

- `tenantId` obrigatório nas entidades internas relevantes;
- `quote` como agregado principal;
- `quoteVersion` como snapshot histórico;
- `quoteItem` congelado por versão;
- valores monetários em centavos;
- schemas preparados para evolução sem depender de reestruturação profunda.

## Entidades do MVP

### Tenant

Representa a empresa ou conta dona do espaço lógico de dados.

Campos esperados:

- id
- name
- slug
- createdAt
- updatedAt

## User

Representa o usuário autenticado vinculado a um tenant.

Campos esperados:

- id
- tenantId
- name
- email
- passwordHash
- status
- lastLoginAt
- createdAt
- updatedAt

Regras:

- e-mail único dentro do tenant;
- senha sempre armazenada como hash;
- usuário desabilitado não autentica.

## Role

Representa papéis de acesso do tenant.

Campos esperados:

- id
- tenantId
- code
- name

## UserRole

Tabela de junção entre usuário e papel.

Chave composta:

- userId
- roleId

## AuthSession

Representa sessão de refresh token.

Campos esperados:

- id
- tenantId
- userId
- refreshTokenHash
- userAgent
- ipAddress
- expiresAt
- revokedAt
- createdAt

## Customer

Representa o cliente final do orçamento.

Campos esperados:

- id
- tenantId
- name
- email
- phone
- document
- notes
- createdAt
- updatedAt

## Category

Representa categoria do catálogo.

Campos esperados:

- id
- tenantId
- name
- slug
- createdAt

## Brand

Representa marca de produto.

Campos esperados:

- id
- tenantId
- name
- slug

## Product

Representa item reutilizável do catálogo.

Campos esperados:

- id
- tenantId
- categoryId
- brandId
- name
- sku
- description
- basePriceCents
- currency
- isActive
- createdAt
- updatedAt

## ProductSpecification

Representa especificações técnicas estruturadas.

Campos esperados:

- id
- productId
- key
- value

## Quote

Representa o cabeçalho do orçamento.

Campos esperados:

- id
- tenantId
- customerId
- createdByUserId
- title
- status
- currentVersionId
- publicNotes
- internalNotes
- createdAt
- updatedAt

## QuoteVersion

Representa snapshot versionado do orçamento.

Campos esperados:

- id
- tenantId
- quoteId
- versionNumber
- label
- currency
- subtotalCents
- discountCents
- totalCents
- sourceType
- importPayloadJson
- snapshotJson
- createdByUserId
- createdAt

## QuoteItem

Representa item congelado dentro de uma versão.

Campos esperados:

- id
- tenantId
- quoteVersionId
- productId
- categoryName
- brandName
- productName
- productDescription
- sku
- quantity
- unitPriceCents
- totalPriceCents
- specificationsJson

## QuoteShareLink

Representa o vínculo público com uma versão compartilhada.

Campos esperados:

- id
- tenantId
- quoteId
- quoteVersionId
- slug
- status
- expiresAt
- revokedAt
- createdByUserId
- createdAt

## AuditLog

Representa trilha de auditoria.

Campos esperados:

- id
- tenantId
- actorUserId
- action
- entityType
- entityId
- payloadJson
- createdAt

## Entidades previstas para evolução futura

- store
- storeOffer
- priceHistory
- watchlist
- notificationChannel

## Relacionamentos principais

- Tenant `1:N` User
- Tenant `1:N` Role
- Tenant `1:N` Customer
- Tenant `1:N` Category
- Tenant `1:N` Brand
- Tenant `1:N` Product
- Tenant `1:N` Quote
- User `N:N` Role via UserRole
- Product `N:1` Category
- Product `N:1` Brand
- Product `1:N` ProductSpecification
- Quote `N:1` Customer
- Quote `N:1` User como criador
- Quote `1:N` QuoteVersion
- QuoteVersion `1:N` QuoteItem
- Quote `1:N` QuoteShareLink

## Enums recomendados

### UserStatus

- active
- invited
- disabled

### QuoteStatus

- draft
- published
- archived

### ShareLinkStatus

- active
- revoked
- expired

### QuoteSourceType

- manual
- import_json
- ai_future

## Regras de consistência

### Tenant

- um registro não pode acessar dados de outro tenant;
- unicidades críticas devem considerar o tenant quando aplicável.

### Quote

- pertence sempre a um tenant;
- possui cliente obrigatório;
- possui ao menos uma versão para ser operacionalmente útil.

### QuoteVersion

- `versionNumber` é único por orçamento;
- representa snapshot utilizável para PDF, compartilhamento e exportação;
- não deve depender do estado mutável do catálogo.

### QuoteItem

- deve preservar nome, preço e dados relevantes do momento da versão;
- pode ter `productId` opcional para rastreio, mas não deve depender dele para reconstrução histórica.

### QuoteShareLink

- deve apontar para uma versão específica;
- deve poder ser revogado;
- deve ter possibilidade de expiração.

## Índices prioritários

- índice por `tenantId` em entidades centrais;
- `@@unique([tenantId, email])` em User;
- `@@unique([tenantId, slug])` em Category;
- `@@unique([tenantId, slug])` em Brand;
- `@@index([tenantId, name])` em Product;
- `@@index([tenantId, status, createdAt])` em Quote;
- `@@unique([quoteId, versionNumber])` em QuoteVersion;
- `slug @unique` em QuoteShareLink.

## Observações de design

### ProductSpecification separado

Foi mantido separado para facilitar busca e evolução posterior no domínio de hardware.

### currentVersionId

Pode existir em `Quote` por conveniência, mas a aplicação também pode determinar a versão atual pela maior `versionNumber` até essa decisão ser fechada.

### snapshotJson

Pode armazenar representação estruturada adicional da versão para simplificar exportação, PDF e auditoria.

## Schema Prisma conceitual

```prisma
enum UserStatus {
  active
  invited
  disabled
}

enum QuoteStatus {
  draft
  published
  archived
}

enum ShareLinkStatus {
  active
  revoked
  expired
}

model Tenant {
  id          String      @id @default(cuid())
  name        String
  slug        String      @unique
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  users       User[]
  customers   Customer[]
  categories  Category[]
  brands      Brand[]
  products    Product[]
  quotes      Quote[]
  roles       Role[]
  sessions    AuthSession[]
  auditLogs   AuditLog[]
}

model User {
  id             String        @id @default(cuid())
  tenantId       String
  name           String
  email          String
  passwordHash   String
  status         UserStatus    @default(active)
  lastLoginAt    DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  tenant         Tenant        @relation(fields: [tenantId], references: [id])
  roles          UserRole[]
  createdQuotes  Quote[]       @relation("QuoteCreatedBy")

  @@unique([tenantId, email])
  @@index([tenantId])
}

model Role {
  id          String      @id @default(cuid())
  tenantId    String
  code        String
  name        String

  tenant      Tenant      @relation(fields: [tenantId], references: [id])
  users       UserRole[]

  @@unique([tenantId, code])
  @@index([tenantId])
}

model UserRole {
  userId      String
  roleId      String

  user        User        @relation(fields: [userId], references: [id])
  role        Role        @relation(fields: [roleId], references: [id])

  @@id([userId, roleId])
}

model AuthSession {
  id               String      @id @default(cuid())
  tenantId         String
  userId           String
  refreshTokenHash String
  userAgent        String?
  ipAddress        String?
  expiresAt        DateTime
  revokedAt        DateTime?
  createdAt        DateTime    @default(now())

  tenant           Tenant      @relation(fields: [tenantId], references: [id])

  @@index([tenantId, userId])
}

model Customer {
  id          String      @id @default(cuid())
  tenantId    String
  name        String
  email       String?
  phone       String?
  document    String?
  notes       String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  tenant      Tenant      @relation(fields: [tenantId], references: [id])
  quotes      Quote[]

  @@index([tenantId, name])
}

model Category {
  id          String      @id @default(cuid())
  tenantId    String
  name        String
  slug        String
  createdAt   DateTime    @default(now())

  tenant      Tenant      @relation(fields: [tenantId], references: [id])
  products    Product[]

  @@unique([tenantId, slug])
  @@index([tenantId, name])
}

model Brand {
  id          String      @id @default(cuid())
  tenantId    String
  name        String
  slug        String

  tenant      Tenant      @relation(fields: [tenantId], references: [id])
  products    Product[]

  @@unique([tenantId, slug])
  @@index([tenantId])
}

model Product {
  id              String                 @id @default(cuid())
  tenantId        String
  categoryId      String
  brandId         String?
  name            String
  sku             String?
  description     String?
  basePriceCents  Int
  currency        String                 @default("BRL")
  isActive        Boolean                @default(true)
  createdAt       DateTime               @default(now())
  updatedAt       DateTime               @updatedAt

  tenant          Tenant                 @relation(fields: [tenantId], references: [id])
  category        Category               @relation(fields: [categoryId], references: [id])
  brand           Brand?                 @relation(fields: [brandId], references: [id])
  specifications  ProductSpecification[]

  @@index([tenantId, categoryId])
  @@index([tenantId, name])
}

model ProductSpecification {
  id          String      @id @default(cuid())
  productId   String
  key         String
  value       String

  product     Product     @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
}

model Quote {
  id               String           @id @default(cuid())
  tenantId         String
  customerId       String
  createdByUserId  String
  title            String
  status           QuoteStatus      @default(draft)
  currentVersionId String?
  publicNotes      String?
  internalNotes    String?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  tenant           Tenant           @relation(fields: [tenantId], references: [id])
  customer         Customer         @relation(fields: [customerId], references: [id])
  createdBy        User             @relation("QuoteCreatedBy", fields: [createdByUserId], references: [id])
  versions         QuoteVersion[]
  shareLinks       QuoteShareLink[]

  @@index([tenantId, customerId])
  @@index([tenantId, status, createdAt])
}

model QuoteVersion {
  id                String       @id @default(cuid())
  tenantId          String
  quoteId           String
  versionNumber     Int
  label             String?
  currency          String       @default("BRL")
  subtotalCents     Int
  discountCents     Int          @default(0)
  totalCents        Int
  sourceType        String
  importPayloadJson Json?
  snapshotJson      Json?
  createdByUserId   String
  createdAt         DateTime     @default(now())

  quote             Quote        @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  items             QuoteItem[]

  @@unique([quoteId, versionNumber])
  @@index([tenantId, quoteId])
}

model QuoteItem {
  id                  String       @id @default(cuid())
  tenantId            String
  quoteVersionId      String
  productId           String?
  categoryName        String?
  brandName           String?
  productName         String
  productDescription  String?
  sku                 String?
  quantity            Int
  unitPriceCents      Int
  totalPriceCents     Int
  specificationsJson  Json?

  quoteVersion        QuoteVersion @relation(fields: [quoteVersionId], references: [id], onDelete: Cascade)

  @@index([tenantId, quoteVersionId])
}

model QuoteShareLink {
  id              String           @id @default(cuid())
  tenantId        String
  quoteId         String
  quoteVersionId  String
  slug            String           @unique
  status          ShareLinkStatus  @default(active)
  expiresAt       DateTime?
  revokedAt       DateTime?
  createdByUserId String
  createdAt       DateTime         @default(now())

  quote           Quote            @relation(fields: [quoteId], references: [id], onDelete: Cascade)

  @@index([tenantId, quoteId])
}

model AuditLog {
  id           String      @id @default(cuid())
  tenantId     String
  actorUserId  String?
  action       String
  entityType   String
  entityId     String
  payloadJson  Json?
  createdAt    DateTime    @default(now())

  tenant       Tenant      @relation(fields: [tenantId], references: [id])

  @@index([tenantId, entityType, entityId])
}
```

## Decisões pendentes

- definir se `currentVersionId` será persistido ou inferido;
- definir se `ProductSpecification` seguirá tabela própria ou JSON direto no MVP;
- definir política de soft delete para catálogo e clientes;
- definir se `Role` será tenant-scoped ou parcialmente global no seed inicial.
