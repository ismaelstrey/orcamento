# Data Api And Integrations

## Objetivo

Mapear os principais blocos de dados, contratos de API e integrações externas antes da implementação.

## Entidades principais

- tenant
- user
- role
- customer
- category
- brand
- product
- productSpecification
- quote
- quoteVersion
- quoteItem
- quoteShareLink
- store
- storeOffer
- priceHistory
- watchlist
- notificationChannel
- auditLog

## Regras basicas de modelagem

- Toda entidade de negócio interna deve considerar contexto de tenant quando aplicável.
- `quote` deve representar o agregado principal.
- `quoteVersion` deve guardar snapshots revisáveis.
- `quoteItem` deve ter dados suficientes para manter coerência histórica, mesmo que o catálogo mude depois.
- `storeOffer` e `priceHistory` devem ser pensados para evolução posterior, mesmo se não forem usados no MVP.

## Contratos de entrada relevantes

### Importacao JSON

Contrato inicial herdado do material-base:

```json
{
  "categoria": "Computador",
  "orcamento_maximo": 5000,
  "itens": [
    {
      "tipo": "cpu",
      "modelo": "Ryzen 7600"
    }
  ]
}
```

Evolução recomendada do contrato:

- versão do schema;
- moeda;
- contexto de uso;
- lista de itens com quantidade;
- observações;
- restrições;
- preferências de marca;
- limite de orçamento.

### Exportacao JSON

Deve servir para:

- reimportação;
- integração com IA;
- versionamento externo;
- auditoria humana.

## APIs do MVP

### Autenticacao

- login
- refresh
- logout
- perfil atual

### Organizacao

- empresa atual
- usuários
- papéis

### Cadastro

- clientes
- categorias
- produtos

### Orcamentos

- criar
- listar
- detalhar
- atualizar
- gerar nova versão
- exportar JSON
- importar JSON
- publicar link
- gerar PDF

### Publico

- visualizar orçamento compartilhado

## Padroes de API

- versionamento desde o início;
- paginação consistente;
- erros padronizados;
- autenticação centralizada;
- schemas explícitos de request/response;
- documentação Swagger como contrato de consulta.

## Integracoes previstas

### IA

- OpenAI
- Gemini
- Claude
- OpenRouter

### Pagamentos

- Stripe
- Mercado Pago

### Automacao

- n8n

### Canais de notificacao futuros

- e-mail
- Telegram
- WhatsApp
- push

## Pricing e scraping

No MVP, a estratégia recomendada é:

- catálogo manual;
- importação JSON;
- possíveis ofertas cadastradas ou importadas de forma controlada.

Depois da validação:

- conectores por loja;
- normalização de preço;
- histórico por produto;
- regras de melhor oferta;
- monitoramento periódico com workers.

## Riscos de integracao

- scraping quebrar por mudança de layout;
- preços inconsistentes entre lojas;
- limitação ou bloqueio de acesso;
- custo crescente de IA;
- inconsistência entre saída de IA e schema interno.

## Guardrails

- IA nunca grava direto sem validação;
- dados críticos passam por schema e regras determinísticas;
- integrações devem ficar atrás de adapters;
- contratos precisam ser versionados;
- campos monetários devem seguir padrão único de armazenamento.
