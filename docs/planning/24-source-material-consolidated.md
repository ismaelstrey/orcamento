# Source Material Consolidated

## Objetivo

Registrar em um único documento a origem do projeto, preservando o contexto que veio:

- da conversa inicial que originou a ideia;
- do PRD original criado a partir dessa ideia.

Este arquivo substitui a necessidade de manter os arquivos brutos na raiz do repositório.

## Origem do projeto

O projeto nasceu de uma dor operacional real: montar orçamentos de hardware e TI de forma recorrente, com pesquisa manual, comparação fragmentada e necessidade de envio rápido ao cliente.

A conversa inicial consolidou três pontos centrais:

- o problema é real e recorrente;
- existe valor imediato em transformar esse fluxo em produto;
- a ideia deve começar pequena, com um MVP operacional antes de avançar para IA e automações mais complexas.

## Síntese da conversa original

### Problema percebido

- pesquisar peças manualmente;
- comparar opções entre lojas;
- montar proposta para cliente;
- revisar preços quando mudam;
- repetir esse processo muitas vezes.

### Oportunidade identificada

Transformar a rotina de montagem de orçamento em um micro SaaS com:

- criação de orçamentos;
- importação JSON;
- PDF;
- compartilhamento por link;
- evolução futura para IA, comparação de preços e monitoramento.

### Direção estratégica extraída da conversa

- começar pelo problema operacional, não pela automação mais complexa;
- não depender de IA no MVP;
- tratar o produto como SaaS profissional, não como experimento;
- investir pesado em documentação para orientar desenvolvimento com agentes.

## Síntese do PRD original

### Visão original

Criar uma plataforma SaaS inteligente para geração de orçamentos com:

- IA;
- comparação automática de preços;
- monitoramento de promoções;
- compartilhamento profissional;
- PDFs;
- evolução para assistente inteligente de compras.

### MVP originalmente listado

- login;
- multiempresa;
- dashboard;
- clientes;
- produtos;
- categorias;
- orçamentos;
- compartilhamento;
- PDF;
- importação JSON;
- exportação JSON.

### Roadmap original

- V1: CRUD, compartilhamento, PDF e JSON;
- V2: IA, comparador e alternativas;
- V3: histórico de preços e dashboard;
- V4: monitoramento e alertas;
- V5: mobile;
- V6: marketplace.

## O que foi mantido na documentação atual

- foco em geração de orçamentos;
- PDF como artefato central do valor;
- link público como diferencial do MVP;
- importação e exportação JSON;
- arquitetura preparada para IA, pricing e monitoramento;
- visão de monorepo modular;
- foco em documentação forte para execução assistida por IA.

## O que foi ajustado em relação ao material original

### Escopo do MVP

O material original sugeria uma visão ampla. A documentação atual reduziu isso para um MVP realista e operacional.

### IA no MVP

A visão original destacava IA desde cedo, mas a decisão consolidada foi:

- MVP sem dependência de IA;
- IA entra em V2 como acelerador de input e sugestão.

### Multiempresa

O PRD colocava multiempresa no MVP. A documentação atual ajustou para:

- arquitetura tenant-aware desde o início;
- complexidade comercial de multiempresa completa podendo entrar por fase.

### Comparação de preços e monitoramento

Mantidos como visão de produto, mas retirados do primeiro ciclo de implementação.

## Decisões finais herdadas dos materiais-base

- o produto nasce de uma dor real;
- o foco inicial é hardware/TI;
- `quote` e `quoteVersion` são centrais;
- PDF e compartilhamento público são parte do core;
- documentação é a fonte de verdade para pessoas e agentes;
- execução deve seguir slices pequenas e controladas.

## Situação dos arquivos brutos

Os arquivos brutos de origem foram consolidados nesta documentação e podem ser removidos da raiz do projeto para manter o repositório limpo.

## Referência prática

Para entendimento atual do projeto, os documentos principais passam a ser:

- `00-master-index.md`
- `01-product-and-scope.md`
- `10-tad-initial.md`
- `11-prisma-data-model.md`
- `12-api-spec.md`
- `18-implementation-slices-for-agents.md`
- `23-first-agent-execution-pack.md`
