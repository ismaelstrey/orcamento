# Orcamento

Repositório de planejamento do projeto **IQP - Intelligent Quote Platform**, uma plataforma SaaS para geração, versionamento, compartilhamento e evolução de orçamentos com suporte a IA.

## Estado Atual

Este repositório está em fase de **planejamento estruturado**.

Neste momento, o foco está em:

- consolidar visão de produto;
- definir escopo realista de MVP;
- formalizar arquitetura técnica;
- preparar documentação para desenvolvimento guiado por IA/agentes;
- reduzir ambiguidade antes do início da implementação.

## Fontes de origem

Os materiais-base que originaram este planejamento estão no diretório raiz:

- `PRD_Intelligent_Quote_Platform.md`
- `converssachatgpt.txt`

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
25. `docs/planning/adr/0001-core-decisions.md`

## Direção estratégica consolidada

- O produto nasce para resolver uma dor operacional real de montagem de orçamentos.
- O primeiro foco é **hardware/TI**, evitando começar como solução genérica para qualquer mercado.
- O **MVP não depende de IA** para existir e gerar valor.
- A IA entra como acelerador de entrada, recomendação e evolução do produto nas fases seguintes.
- A arquitetura já nasce **tenant-aware**, mas a complexidade comercial de multiempresa completa pode ser liberada por fase.
- A documentação é tratada como fonte de verdade para orientar pessoas e agentes de IA.

## Próximo passo recomendado

Antes de iniciar qualquer código, revisar e aprovar:

- escopo do MVP;
- decisões arquiteturais centrais;
- estratégia de dados, scraping e IA;
- fluxo de trabalho com agentes;
- backlog inicial de execução.
