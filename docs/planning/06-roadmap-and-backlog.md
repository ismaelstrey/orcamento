# Roadmap And Backlog

## Roadmap macro

### Fase 0 - Planejamento

- consolidar documentação;
- aprovar decisões centrais;
- definir estrutura do repositório;
- preparar backlog executável.

### Fase 1 - MVP operacional

- autenticação;
- empresa e usuário;
- clientes;
- categorias;
- produtos;
- orçamento;
- versão;
- PDF;
- link público;
- importação e exportação JSON;
- dashboard simples.

### Fase 2 - Qualidade de uso

- melhoria de UX;
- regras de compatibilidade;
- filtros e busca melhores;
- métricas básicas;
- revisão de performance;
- cobertura de testes mais crítica.

### Fase 3 - IA assistiva

- entrada em linguagem natural;
- conversão texto -> draft;
- sugestões de itens;
- alternativas;
- resumos para cliente.

### Fase 4 - Pricing intelligence

- lojas;
- ofertas;
- histórico de preços;
- comparação;
- score de melhor compra.

### Fase 5 - Monitoramento e automação

- watchlist;
- jobs periódicos;
- alertas;
- notificações;
- integrações com automação.

### Fase 6 - Escala comercial

- billing completo;
- times;
- multiempresa ampliado;
- API externa;
- webhooks;
- white-label;
- expansão de verticais.

## Backlog inicial priorizado

### Bloco A - Base documental

- aprovar escopo do MVP;
- aprovar ADRs iniciais;
- aprovar entidades principais;
- aprovar fluxo com agentes.

### Bloco B - Núcleo do domínio

- modelar tenant, user e role;
- modelar customer;
- modelar category e product;
- modelar quote, quoteVersion e quoteItem;
- modelar share link.

### Bloco C - Fluxo de orçamento

- criar orçamento manual;
- editar orçamento;
- salvar versão;
- visualizar histórico;
- gerar PDF;
- gerar link público.

### Bloco D - Entrada estruturada

- schema de importação JSON;
- parser de importação;
- exportação JSON;
- validações;
- mensagens de erro consistentes.

### Bloco E - Governança técnica

- autenticação e autorização;
- observabilidade mínima;
- documentação Swagger;
- convenções de hooks de API;
- estratégia de testes.

## Entregas que maximizam validacao cedo

- orçamento criado do zero;
- orçamento importado via JSON;
- PDF enviado ao cliente;
- link público acessível;
- nova versão gerada rapidamente.

## Itens explicitamente adiados

- scraping pesado;
- monitoramento de promoções;
- múltiplos agentes em produção;
- marketplace;
- mobile;
- white-label completo.

## Critério de priorizacao

Priorizar o que aumenta:

- tempo economizado;
- valor percebido pelo cliente;
- capacidade de demonstrar o produto;
- segurança da arquitetura futura.
