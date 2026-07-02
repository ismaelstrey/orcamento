# Technical Architecture

## Objetivo

Definir uma base técnica estável para que o projeto evolua com consistência, inclusive quando partes da implementação forem produzidas com apoio de IA/agentes.

## Stack-alvo

- Frontend: Next.js 16, React, TypeScript, Tailwind CSS v4, shadcn/ui, framer-motion.
- Backend: Next.js com camada de aplicação clara e módulos desacoplados.
- Persistência: PostgreSQL + Prisma.
- Cache e jobs: Redis.
- Autenticação: JWT + bcrypt.
- Documentação de API: Swagger.
- Validação: Zod.
- Gerenciador de pacotes: pnpm.
- Processo e execução: PM2.
- Configuração: dotenv.

## Direcao arquitetural

O projeto deve seguir **monorepo modular**, mas cada área de backend precisa respeitar **arquitetura em camadas**.

Isso preserva:

- a visão de expansão apresentada no PRD;
- a organização técnica pedida nas regras do projeto;
- a clareza necessária para agentes trabalharem por contexto limitado.

## Estrutura-alvo do repositório

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

## Estrutura logica dentro de modulos backend

Mesmo que a implementação futura use monorepo, o backend deve ser organizado conceitualmente em:

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

### Apresentacao

Responsável por telas, componentes, formulários, dashboard, navegação e proteção de rotas.

### Aplicacao

Responsável por casos de uso como:

- criar orçamento;
- versionar orçamento;
- gerar PDF;
- publicar link;
- importar JSON;
- consultar histórico.

### Dominio

Responsável por:

- entidades;
- regras de compatibilidade;
- cálculo e composição de orçamento;
- políticas de permissão;
- invariantes do negócio.

### Infraestrutura

Responsável por:

- Prisma;
- banco de dados;
- Redis;
- filas;
- integrações externas;
- provedores de IA;
- geração de PDF;
- scraping;
- notificações.

## Principios de composicao

- Casos de uso não podem depender diretamente da interface.
- Regras críticas não podem ficar espalhadas em componentes.
- Repositórios devem encapsular persistência.
- Integrações externas devem ficar atrás de adapters claros.
- Toda entrada externa relevante deve ser validada com schema.

## Multiempresa

A arquitetura deve nascer **tenant-aware**.

Isso significa:

- entidades centrais associadas a tenant;
- autorização sempre contextualizada;
- filtros por tenant obrigatórios;
- trilha de auditoria para ações sensíveis;
- prevenção explícita contra vazamento entre empresas.

## Link publico

O link público do orçamento deve ser tratado como recurso próprio do domínio, não como simples rota improvisada.

Deve prever:

- token ou slug seguro;
- estado de publicação;
- validade opcional;
- possibilidade de revogação;
- controle do que é exibido ao convidado.

## Evolucao planejada

Arquitetura preparada para incluir, sem ruptura:

- IA conversacional;
- comparação de preços;
- histórico de preços;
- monitoramento e alertas;
- integrações com pagamentos;
- webhooks;
- API pública.

## Decisoes operacionais

- O frontend deve consumir dados via hooks dedicados.
- O domínio deve permanecer bem tipado e sem `any`.
- Comentários de código futuros devem ser curtos e em pt-BR quando agregarem clareza.
- Convenções de nome devem seguir camelCase para arquivos, funções e variáveis.
