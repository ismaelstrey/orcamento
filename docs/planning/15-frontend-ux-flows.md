# Frontend Ux Flows

## Objetivo

Definir as telas, jornadas, estados e comportamentos mínimos do frontend do MVP para orientar implementação e priorização de UX.

## Princípios de UX

- reduzir tempo para montar orçamento;
- deixar histórico e versões fáceis de entender;
- tornar PDF e link público ações rápidas;
- evitar bloqueios quando o catálogo ainda estiver vazio;
- fornecer feedback claro em importação JSON e compartilhamento.

## Sitemap inicial

```text
/login
/dashboard
/customers
/customers/new
/customers/:id
/catalog/categories
/catalog/brands
/catalog/products
/catalog/products/new
/catalog/products/:id
/quotes
/quotes/new
/quotes/:id
/quotes/:id/versions/:versionId
/quotes/import-json
/settings/users
/public/quotes/:slug
```

## Telas mínimas

### Login

Objetivo:

- autenticar usuário;
- iniciar contexto do tenant.

Componentes mínimos:

- campo e-mail;
- campo senha;
- botão entrar;
- mensagens de erro claras.

### Dashboard

Objetivo:

- mostrar visão rápida do uso;
- ser o principal ponto de entrada para criar orçamento.

Componentes mínimos:

- cards de KPI;
- CTA `Novo orçamento`;
- CTA `Importar JSON`;
- lista curta de orçamentos recentes.

### Lista de clientes

Objetivo:

- gerenciar clientes usados nos orçamentos.

Componentes mínimos:

- tabela ou lista paginada;
- busca;
- CTA `Novo cliente`;
- ação de editar.

### Lista de produtos

Objetivo:

- tornar o catálogo reutilizável no fluxo comercial.

Componentes mínimos:

- busca;
- filtros básicos;
- lista paginada;
- CTA `Novo produto`;
- status ativo/inativo.

### Lista de orçamentos

Objetivo:

- localizar rapidamente orçamentos e suas versões.

Componentes mínimos:

- busca;
- lista com cliente, status, versão atual, total e atualização;
- ações rápidas para abrir, gerar PDF e publicar link;
- CTA `Novo orçamento`;
- CTA `Importar JSON`.

### Editor de orçamento

Objetivo:

- criar ou revisar orçamento com baixa fricção.

Componentes mínimos:

- seleção de cliente;
- título;
- notas públicas;
- notas internas;
- lista de itens;
- suporte a produto do catálogo;
- suporte a item manual;
- resumo financeiro fixo;
- ações principais no topo e rodapé.

### Histórico de versões

Objetivo:

- dar clareza sobre revisões comerciais.

Componentes mínimos:

- lista cronológica;
- label opcional;
- total por versão;
- data;
- ação para abrir, gerar PDF e publicar link.

### Importação JSON

Objetivo:

- acelerar criação de draft com base estruturada.

Componentes mínimos:

- textarea ou uploader textual;
- preview de validação;
- lista de warnings;
- CTA `Criar draft revisável`.

### Compartilhamento

Objetivo:

- gerar e gerenciar links públicos.

Componentes mínimos:

- lista de links ativos e anteriores;
- status do link;
- validade;
- ação copiar;
- ação revogar.

### Página pública

Objetivo:

- apresentar orçamento ao cliente sem autenticação.

Componentes mínimos:

- cabeçalho do orçamento;
- resumo financeiro;
- itens;
- notas públicas;
- status do documento;
- ação opcional para baixar PDF se permitido.

## Jornadas principais

### Jornada 1 - Primeiro orçamento manual

1. usuário entra no dashboard;
2. clica em `Novo orçamento`;
3. escolhe cliente;
4. adiciona itens do catálogo ou manuais;
5. revisa total;
6. salva draft;
7. gera PDF ou publica link.

### Jornada 2 - Importação JSON

1. usuário entra em `Importar JSON`;
2. cola payload;
3. sistema valida e mostra warnings;
4. usuário confirma criação do draft;
5. revisa e ajusta;
6. salva;
7. gera PDF ou link.

### Jornada 3 - Revisão comercial

1. usuário abre orçamento existente;
2. cria nova versão;
3. altera itens;
4. sistema congela nova revisão;
5. usuário gera novo PDF ou novo link.

### Jornada 4 - Compartilhamento

1. usuário abre versão desejada;
2. publica link;
3. copia URL;
4. acompanha status do compartilhamento;
5. revoga quando necessário.

### Jornada 5 - Consumo pelo cliente

1. cliente acessa o link;
2. sistema valida status e expiração;
3. cliente visualiza versão pública;
4. cliente compartilha ou baixa PDF, se disponível.

## Estados vazios

### Sem orçamentos

- mensagem principal: `Você ainda não criou nenhum orçamento.`
- CTA 1: `Novo orçamento`
- CTA 2: `Importar JSON`

### Sem clientes

- mensagem principal: `Cadastre um cliente para vincular seu orçamento.`
- CTA: `Novo cliente`

### Sem produtos

- mensagem principal: `Seu catálogo está vazio.`
- CTA 1: `Cadastrar produto`
- CTA 2: `Adicionar item manual`

### Sem versões adicionais

- mensagem principal: `Esta é a primeira versão deste orçamento.`
- CTA: `Criar nova versão`

### Sem PDF

- mensagem principal: `Nenhum PDF foi gerado para esta versão.`
- CTA: `Gerar PDF`

### Sem links públicos

- mensagem principal: `Este orçamento ainda não foi compartilhado por link.`
- CTA: `Publicar link`

## Estados de erro e atenção

### Importação JSON inválida

- mostrar erros por campo ou bloco;
- evitar mensagens genéricas;
- oferecer ação de revisão.

### Link expirado

- mensagem pública clara;
- não exibir dados internos.

### Link revogado

- mensagem pública clara;
- não exibir dados internos.

### Falha ao gerar PDF

- mostrar retorno simples;
- permitir tentar novamente;
- registrar orientação curta ao usuário.

## Layout lógico do editor de orçamento

```text
Cabeçalho
  título
  cliente
  ações principais

Bloco central
  itens do orçamento
  busca no catálogo
  inclusão de item manual

Lateral ou rodapé fixo
  subtotal
  desconto
  total
  ações de salvar, PDF, link, exportar
```

## Componentes reutilizáveis previstos

- customerSelect
- productSearchSelect
- quoteItemTable
- moneySummaryCard
- versionTimeline
- shareLinkList
- importJsonValidator
- publicQuoteView

## Regras funcionais para o frontend

- toda consulta à API deve passar por hooks dedicados;
- o frontend não calcula regras críticas sem confirmação do backend;
- a versão atual deve ficar sempre evidente na UI;
- link público e PDF devem apontar para a versão correta;
- mensagens de erro devem ser amigáveis, mas compatíveis com códigos técnicos.

## Priorização visual

- velocidade do fluxo de orçamento;
- clareza de revisão por versão;
- compartilhamento sem atrito;
- boa leitura da proposta;
- simplicidade de navegação.

## Decisões pendentes

- definir wireframe final do dashboard;
- definir se PDF terá preview interno;
- definir se página pública permitirá download do PDF;
- definir se lista de orçamentos terá visão em cards ou tabela por padrão.
