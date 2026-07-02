# TAD Initial

## Objetivo do documento

Este TAD inicial define a base técnica do IQP para a fase de MVP, com foco em decisões práticas que permitam iniciar a implementação com consistência e baixo retrabalho.

## Contexto

O IQP é um SaaS para criar, versionar, compartilhar e evoluir orçamentos técnicos com foco inicial em hardware e serviços relacionados de TI.

O sistema precisa resolver no MVP:

- criação rápida de orçamento;
- reaproveitamento de catálogo;
- importação e exportação JSON;
- geração de PDF;
- compartilhamento por link público;
- histórico e versionamento.

## Escopo arquitetural do MVP

### Inclui

- autenticação com JWT + bcrypt;
- tenant, usuários e papéis base;
- clientes;
- categorias, marcas e produtos;
- orçamento com itens;
- versionamento de orçamento;
- importação JSON;
- exportação JSON;
- link público compartilhável;
- geração de PDF;
- dashboard simples;
- trilha de auditoria mínima.

### Não inclui

- IA como fluxo principal;
- comparador multi-loja em tempo real;
- monitoramento de promoções;
- billing avançado;
- white-label;
- mobile;
- marketplace.

## Stack oficial

- Next.js 16
- React
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- framer-motion
- Prisma
- PostgreSQL
- Redis
- JWT
- bcrypt
- Swagger
- Zod
- pnpm
- PM2
- dotenv

## Direção arquitetural

O projeto deve seguir uma estrutura de monorepo modular com camadas internas bem definidas.

### Macroestrutura

```text
apps/
  web/
packages/
  shared/
  auth/
  ai/
  pricing/
  pdf/
  scraper/
workers/
  price-monitor/
  notifications/
docs/
agents/
```

### Estrutura lógica do backend

Mesmo que a implementação fique inicialmente dentro do app web, a organização conceitual deve respeitar:

- `src/controllers`
- `src/routes`
- `src/services`
- `src/repositories`
- `src/middlewares`
- `src/utils`
- `src/validators`
- `src/docs`
- `src/server.ts`

## Camadas

### Apresentação

Responsável por interface, páginas, dashboard, componentes, formulários e proteção de rotas.

### Aplicação

Responsável por casos de uso:

- autenticar usuário;
- cadastrar cliente;
- cadastrar produto;
- criar orçamento;
- criar nova versão;
- importar JSON;
- exportar JSON;
- gerar PDF;
- publicar ou revogar link.

### Domínio

Responsável por:

- entidades centrais;
- invariantes do negócio;
- composição do orçamento;
- regras de versionamento;
- regras de compartilhamento;
- futuras regras de compatibilidade.

### Infraestrutura

Responsável por:

- persistência via Prisma;
- PostgreSQL;
- Redis;
- geração de PDF;
- autenticação;
- observabilidade;
- integrações externas futuras.

## Módulos principais do MVP

### Auth

Gerencia login, refresh, logout, sessão e contexto do usuário autenticado.

### Organization

Gerencia tenant, usuários, papéis e regras básicas de acesso.

### Customers

Gerencia clientes usados nos orçamentos.

### Catalog

Gerencia categorias, marcas, produtos e especificações.

### Quotes

Gerencia orçamento, versões, itens, exportação, importação e cálculo de totais.

### Public Sharing

Gerencia publicação, consulta pública e revogação de links.

### PDF

Gerencia transformação da versão do orçamento em documento profissional.

### Dashboard

Gerencia KPIs básicos de uso do sistema.

### Audit

Gerencia registro de ações sensíveis.

## Multiempresa

O sistema nasce tenant-aware.

### Regras obrigatórias

- entidades internas relevantes devem possuir `tenantId`;
- consultas devem sempre aplicar filtro por tenant;
- o contexto autenticado deve determinar o tenant ativo;
- rotas públicas não podem expor dados além do explicitamente publicado;
- eventos sensíveis devem ser auditáveis.

### Objetivo

Permitir evolução futura para planos multiempresa e times sem reestruturação profunda do domínio.

## Autenticação e autorização

### Autenticação

- login com e-mail e senha;
- senha armazenada com `bcrypt`;
- `accessToken` de curta duração;
- `refreshToken` persistido como sessão;
- logout com revogação da sessão.

### Autorização

RBAC inicial simples, com papéis como:

- owner
- admin
- seller

### Ações sensíveis

Devem ser auditadas:

- login;
- criação e edição de orçamento;
- criação de nova versão;
- publicação de link;
- revogação de link;
- criação e alteração de usuários.

## Modelo de domínio

### Agregado principal

`quote` é o agregado central do domínio.

### Regras centrais

- um orçamento pertence a um tenant;
- um orçamento pertence a um cliente;
- um orçamento possui uma ou mais versões;
- uma versão possui itens congelados historicamente;
- um link público referencia uma versão específica;
- o PDF deve ser gerado com base em uma versão, não em dados mutáveis do catálogo.

## Versionamento

### Estratégia

Cada alteração relevante no orçamento deve gerar ou poder gerar uma `quoteVersion`.

### Razões

- manter histórico claro;
- comparar revisões;
- preservar o que foi enviado ao cliente;
- permitir exportação e PDF consistentes.

## Dados monetários

### Regra

Valores monetários devem ser armazenados em centavos com moeda explícita.

### Objetivo

Evitar erros de precisão e padronizar cálculos.

## Importação e exportação JSON

### Importação

Deve receber um schema validado, preferencialmente versionado.

### Exportação

Deve produzir um snapshot reimportável e auditável.

### Guardrails

- schema validado com Zod;
- campos desconhecidos tratados explicitamente;
- mensagens de erro claras;
- persistência só após normalização.

## Link público

O link público é um recurso do domínio.

### Deve prever

- slug ou token seguro;
- status ativo, revogado ou expirado;
- validade opcional;
- vínculo com versão específica;
- controle do conteúdo público exibido.

## PDF

### Premissas

- PDF deve partir da versão publicada ou selecionada;
- layout deve ser profissional e reaproveitável;
- o documento não deve depender de estado mutável do catálogo.

## APIs

### Padrões

- prefixo `/api/v1`;
- autenticação centralizada;
- paginação consistente;
- erros padronizados;
- request e response com schemas explícitos;
- Swagger como contrato vivo.

### Domínios principais

- auth
- organization
- customers
- catalog
- quotes
- public
- dashboard

## Observabilidade

### Mínimo para o MVP

- logs estruturados;
- registro de erros;
- health check;
- visibilidade das ações críticas;
- rastreio de falhas em geração de PDF e importação JSON.

## Testes

### Prioridade

- regras de domínio;
- autenticação;
- autorização por tenant;
- importação e exportação JSON;
- criação de orçamento;
- versionamento;
- publicação e revogação de link.

## Redis e jobs

No MVP, Redis entra como base para:

- cache simples;
- evolução futura para filas;
- suporte a jobs assíncronos sem alterar a arquitetura depois.

Workers dedicados ficam para fases posteriores.

## Integrações futuras

### IA

Entrará atrás de adapters, com validação determinística antes da persistência.

### Pricing e scraping

Entrará após validação do MVP.

### Pagamentos

Será tratado como módulo futuro separado do core operacional.

## Riscos e trade-offs

### Escopo excessivo

O principal risco é tentar incluir IA, scraping e billing cedo demais.

### Multiempresa

Projetar tenant-aware desde o início aumenta o cuidado necessário, mas reduz retrabalho futuro.

### Versionamento

Modelar versões corretamente desde o começo adiciona complexidade, mas é essencial para PDF, histórico e link público.

## Decisões pendentes

- formato final do PDF;
- política padrão de expiração de links;
- granularidade final do RBAC do MVP;
- uso inicial de storage local ou externo para PDFs;
- estratégia exata de current version no domínio.
