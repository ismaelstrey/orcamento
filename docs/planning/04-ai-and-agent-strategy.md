# Ai And Agent Strategy

## Objetivo

Definir como a IA entra no produto e como os agentes entram no processo de desenvolvimento.

## Principio central

O projeto usa IA em duas frentes diferentes:

- **IA no produto**, para acelerar input, sugestão, análise e evolução do orçamento.
- **IA no desenvolvimento**, para produzir artefatos e código com maior velocidade e consistência.

Essas duas frentes não devem ser misturadas conceitualmente.

## IA no produto

### Fase correta de entrada

A IA deve entrar de forma forte a partir da V2.

Antes disso, o sistema precisa validar:

- valor do fluxo base;
- estrutura de dados;
- qualidade de PDF e compartilhamento;
- aderência do catálogo;
- necessidade real de automação.

### Papel da IA

- interpretar pedidos em linguagem natural;
- transformar texto em draft estruturado;
- sugerir itens e alternativas;
- justificar recomendações;
- apoiar classificação de produtos;
- resumir orçamentos para apresentação.

### O que a IA nao deve decidir sozinha

- regras de compatibilidade final;
- permissões;
- cálculo monetário oficial;
- estados de publicação;
- acesso multiempresa;
- persistência sem validação.

## Agentes especializados do produto

Agentes previstos para fases futuras:

- hardware
- notebook
- rede
- servidor
- comparador
- pdf
- seo

## Requisitos para usar IA no produto com qualidade

- prompt versionado;
- validação por schema;
- fallback entre provedores;
- rastreabilidade da resposta;
- custo por operação monitorado;
- camada determinística de verificação;
- testes com casos representativos.

## IA no desenvolvimento

### Objetivo

Usar agentes para acelerar entrega sem perder consistência arquitetural.

### Regra de ouro

Nenhum agente deve trabalhar com contexto implícito demais.

Cada tarefa precisa informar claramente:

- objetivo;
- escopo;
- restrições;
- arquivos-alvo;
- critérios de aceite;
- riscos;
- o que está fora do escopo.

## Papéis de agentes recomendados

- agente de produto/documentação;
- agente de arquitetura;
- agente de modelagem Prisma;
- agente de backend/API;
- agente de frontend/UI;
- agente de pricing/scraping;
- agente de QA e revisão.

## Sequencia recomendada de uso dos agentes

1. refinar artefato funcional;
2. formalizar decisão técnica;
3. detalhar contratos e entidades;
4. executar implementação por fatias pequenas;
5. revisar com agente de QA e code review;
6. atualizar documentação.

## Estrutura minima de uma tarefa para agente

- contexto do módulo;
- problema específico;
- referência documental;
- limite de atuação;
- saída esperada;
- checklist de validação.

## Indicadores de maturidade do uso de agentes

- poucas correções por inconsistência de padrão;
- baixa taxa de retrabalho entre frontend e backend;
- documentação sendo atualizada junto da execução;
- decisões repetidas já cobertas por ADR;
- tarefas menores, claras e verificáveis.

## Anti-padroes

- pedir implementação grande demais em um único passo;
- deixar o agente decidir arquitetura sem referência;
- misturar produto, banco, UI e scraping na mesma tarefa;
- iniciar codificação sem critério de aceite;
- confiar na IA sem validação de domínio.
