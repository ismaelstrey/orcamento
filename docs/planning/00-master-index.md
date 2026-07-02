# Master Index

## Objetivo deste conjunto

Este conjunto de arquivos organiza o projeto para uma execução **documentation-first**, com qualidade alta e boa aderência a desenvolvimento orientado por agentes.

Ele consolida:

- a ideia original da conversa-base;
- o PRD existente;
- as regras técnicas já definidas para o projeto;
- uma visão pragmática de MVP, arquitetura e governança.

## Princípios que governam o projeto

- Resolver primeiro a dor real de geração de orçamentos.
- Validar operação antes de automatizar tudo com IA.
- Separar regras determinísticas de comportamentos orientados por IA.
- Evitar escopo excessivo no MVP.
- Registrar decisões importantes antes da implementação.
- Projetar para multiempresa desde o núcleo de dados e autorização.
- Usar agentes com contratos claros, contexto delimitado e critérios de aceite.

## Ordem de leitura

1. `01-product-and-scope.md`
2. `02-technical-architecture.md`
3. `03-data-api-and-integrations.md`
4. `04-ai-and-agent-strategy.md`
5. `05-delivery-workflow.md`
6. `06-roadmap-and-backlog.md`
7. `07-quality-risk-and-operations.md`
8. `08-repository-structure.md`
9. `09-open-questions.md`
10. `10-tad-initial.md`
11. `11-prisma-data-model.md`
12. `12-api-spec.md`
13. `13-technical-backlog.md`
14. `14-zod-and-dto-spec.md`
15. `15-frontend-ux-flows.md`
16. `16-rbac-and-security-spec.md`
17. `17-pdf-and-public-share-spec.md`
18. `18-implementation-slices-for-agents.md`
19. `19-repository-bootstrap-plan.md`
20. `20-prisma-migration-plan.md`
21. `21-swagger-organization-plan.md`
22. `22-testing-strategy-by-slice.md`
23. `23-first-agent-execution-pack.md`
24. `24-source-material-consolidated.md`
25. `adr/0001-core-decisions.md`

## Fonte de verdade por assunto

- Produto: `01-product-and-scope.md`
- Arquitetura macro: `02-technical-architecture.md`
- Dados, API e integrações: `03-data-api-and-integrations.md`
- IA, agentes e prompts: `04-ai-and-agent-strategy.md`
- Execução com times/agentes: `05-delivery-workflow.md`
- Entregas e priorização: `06-roadmap-and-backlog.md`
- Qualidade, risco e operação: `07-quality-risk-and-operations.md`
- Organização do repositório: `08-repository-structure.md`
- Dúvidas abertas: `09-open-questions.md`
- TAD inicial: `10-tad-initial.md`
- Modelagem Prisma: `11-prisma-data-model.md`
- Contratos de API: `12-api-spec.md`
- Backlog técnico: `13-technical-backlog.md`
- DTOs e schemas: `14-zod-and-dto-spec.md`
- Fluxos frontend e UX: `15-frontend-ux-flows.md`
- RBAC e segurança: `16-rbac-and-security-spec.md`
- PDF e compartilhamento: `17-pdf-and-public-share-spec.md`
- Fatias para agentes: `18-implementation-slices-for-agents.md`
- Bootstrap do repositório: `19-repository-bootstrap-plan.md`
- Plano de migrações Prisma: `20-prisma-migration-plan.md`
- Organização Swagger: `21-swagger-organization-plan.md`
- Estratégia de testes por slice: `22-testing-strategy-by-slice.md`
- Primeiro pacote de execução: `23-first-agent-execution-pack.md`
- Origem consolidada do projeto: `24-source-material-consolidated.md`
- Decisões formais: `adr/`

## Decisões estruturantes já assumidas

- O foco inicial do produto é **hardware/TI**.
- O MVP entrega valor sem depender de IA.
- PDF e link público fazem parte do núcleo do valor percebido.
- A arquitetura será organizada para evolução em monorepo.
- O backend futuro deve respeitar arquitetura em camadas.
- Tipagem forte, Zod, Prisma e documentação de API são obrigatórios.
- IA deve sugerir e acelerar; regras críticas não podem depender apenas dela.

## Resultados esperados antes do primeiro código

- visão do MVP aprovada;
- arquitetura macro aprovada;
- entidades principais mapeadas;
- backlog inicial fatiado;
- fluxo de trabalho com agentes definido;
- definição de pronto acordada;
- riscos centrais conhecidos e aceitos.
