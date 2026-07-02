# Agents

## Objetivo

Este diretório define como agentes de IA devem ser usados no projeto.

O foco é evitar:

- tarefas vagas;
- mudanças grandes demais;
- divergência de padrão;
- perda de contexto arquitetural;
- retrabalho entre módulos.

## Papéis recomendados

- Produto e documentação
- Arquitetura técnica
- Prisma e dados
- Backend e API
- Frontend e UX
- Pricing e scraping
- QA e revisão

## Regras de uso

- Cada agente recebe uma tarefa pequena e objetiva.
- Toda tarefa deve citar os documentos de referência.
- Toda tarefa deve declarar claramente o que está fora do escopo.
- Toda saída deve incluir riscos e checklist de aceite.
- Decisões novas relevantes devem voltar para `docs/planning/adr/`.

## Ordem recomendada

1. Agente de produto/documentação
2. Agente de arquitetura
3. Agente de dados e contratos
4. Agente de implementação
5. Agente de QA/revisão

## Fonte de contexto

Antes de executar qualquer tarefa, o agente deve considerar:

- `docs/planning/00-master-index.md`
- `docs/planning/01-product-and-scope.md`
- `docs/planning/02-technical-architecture.md`
- `docs/planning/03-data-api-and-integrations.md`
- `docs/planning/04-ai-and-agent-strategy.md`
- `docs/planning/adr/0001-core-decisions.md`
