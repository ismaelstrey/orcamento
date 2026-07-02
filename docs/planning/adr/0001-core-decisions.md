# ADR 0001 - Core Decisions

## Status

Aprovado para iniciar planejamento detalhado.

## Contexto

O projeto surgiu de uma dor real de geração recorrente de orçamentos e já possui um PRD-base com visão ampla. Ao mesmo tempo, há risco de iniciar implementação cedo demais com escopo excessivo e sem regras claras para desenvolvimento assistido por IA.

## Decisao 1 - Documentation-first

O projeto não começará pela implementação.

Primeiro, serão aprovados:

- escopo do MVP;
- arquitetura macro;
- entidades principais;
- estratégia de IA;
- fluxo de trabalho com agentes.

## Decisao 2 - Foco inicial em hardware/TI

O posicionamento inicial do produto será especializado em hardware e serviços relacionados de TI.

Isso reduz ambiguidade, melhora comunicação e facilita curadoria do domínio.

## Decisao 3 - MVP sem IA obrigatoria

O MVP precisa gerar valor sem IA.

A IA entra depois para:

- acelerar entrada;
- montar drafts;
- sugerir alternativas;
- enriquecer o fluxo.

## Decisao 4 - Arquitetura tenant-aware desde o núcleo

Mesmo que o multiempresa comercial completo seja liberado depois, o modelo base de dados e autorização já deve nascer preparado para tenant.

## Decisao 5 - Monorepo modular com backend em camadas

A estrutura futura será pensada como monorepo, mas o backend deve manter organização em camadas compatível com as regras do projeto.

## Decisao 6 - Regras críticas não dependem só de IA

Compatibilidade, autorização, cálculo monetário, publicação e persistência crítica devem ser garantidos por regras determinísticas e validação.

## Consequencias

- Haverá mais investimento inicial em documentação.
- O início do código ficará mais lento, mas com menos retrabalho.
- As tarefas para agentes ficarão menores e mais previsíveis.
- A evolução para IA, scraping e monitoramento ocorrerá sobre uma base mais confiável.

## Alternativas consideradas

### Comecar com IA já no MVP

Rejeitada, porque aumenta custo, ambiguidade e risco antes da validação do fluxo base.

### Comecar como produto genérico para qualquer orçamento

Rejeitada, porque dilui posicionamento e amplia demais o domínio logo no início.

### Implementar sem ADR e sem contratos definidos

Rejeitada, porque prejudica consistência, especialmente em execução com agentes.
