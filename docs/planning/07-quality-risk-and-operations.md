# Quality Risk And Operations

## Objetivo

Registrar critérios mínimos de qualidade, riscos relevantes e preocupações operacionais antes da implementação.

## Qualidade esperada

- tipagem forte em TypeScript;
- ausência de `any`;
- validação de dados de entrada;
- separação clara de responsabilidades;
- documentação atualizada;
- testes proporcionais ao risco;
- observabilidade mínima desde cedo.

## Qualidade funcional

Os fluxos mais sensíveis do MVP são:

- autenticação;
- isolamento por tenant;
- criação de orçamento;
- geração de versão;
- publicação de link;
- geração de PDF;
- importação e exportação JSON.

## Estrategia de testes

### Essenciais

- testes de regras de negócio;
- testes de schema;
- testes de autorização;
- testes de contratos principais;
- testes dos fluxos críticos do orçamento.

### Evolução

- testes integrados por módulo;
- e2e dos fluxos centrais;
- testes de regressão para IA e importação;
- testes de resiliência para integrações.

## Observabilidade minima

- logs estruturados;
- correlação por requisição;
- rastreio de erros;
- métricas de uso do produto;
- visibilidade de jobs assíncronos.

## Riscos prioritarios

### Risco 1 - Escopo excessivo

Misturar MVP, IA, scraping, billing e monitoramento cedo demais aumenta a chance de paralisia e retrabalho.

### Risco 2 - Vazamento multiempresa

Qualquer falha de autorização pode expor dados entre tenants.

### Risco 3 - IA sem validação

Saídas imprecisas podem gerar orçamento incorreto, item incompatível ou dado mal estruturado.

### Risco 4 - Scraping frágil

Mudanças externas podem quebrar coleta e comprometer confiança do produto.

### Risco 5 - Documento desatualizado

Se a execução avançar sem refletir nas docs, os agentes passam a trabalhar com contexto errado.

## Mitigacoes

- cortar escopo do MVP;
- usar ADR para decisões críticas;
- validar IA com schema e regras;
- isolar integrações por adapters;
- revisar docs ao fim de cada entrega relevante;
- manter tasks pequenas e rastreáveis.

## Operacao futura

O produto deve nascer com visão operacional de:

- ambientes separados;
- gestão por variáveis de ambiente;
- controle de processos;
- rollback simples;
- rastreabilidade de falhas;
- crescimento gradual de custo.

## Criterios de prontidao para iniciar codigo

- docs-base revisadas;
- MVP fechado;
- entidades principais mapeadas;
- ADRs iniciais registradas;
- backlog de fase 1 definido;
- fluxo com agentes aceito.
