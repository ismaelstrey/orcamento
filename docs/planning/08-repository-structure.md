# Repository Structure

## Objetivo

Definir a organização prevista do repositório antes de iniciar a implementação.

## Estrutura alvo

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
  planning/
agents/
```

## Responsabilidade por diretório

### apps

Aplicações executáveis do produto.

### packages

Módulos reutilizáveis, regras compartilhadas e integrações desacopladas.

### workers

Processos assíncronos para tarefas agendadas e eventos fora do request principal.

### docs

Fonte de verdade de planejamento, decisões e operação.

### agents

Playbooks e contratos de trabalho para agentes de IA.

## Política de crescimento

- Criar novos diretórios apenas quando houver responsabilidade clara.
- Evitar misturar domínio com integração externa.
- Evitar utilitários genéricos sem dono claro.
- Toda nova área importante deve nascer documentada.

## Regra para implementação futura

Se um novo módulo não puder ser descrito em uma frase simples, ele ainda não está bem delimitado o suficiente para ser criado.
