# Technical Backlog

## Objetivo

Organizar a execução técnica em épicos e entregas pequenas, alinhadas ao planejamento documental já aprovado.

## Critérios de priorização

Priorizar o que aumenta:

- valor percebido cedo;
- velocidade de validação;
- segurança da arquitetura;
- reaproveitamento futuro;
- clareza para execução com agentes.

## Épico 0 - Fundação do repositório

### Objetivo

Preparar a base do monorepo e as convenções mínimas do projeto.

### Entregas

- inicializar repositório Git local;
- criar estrutura do monorepo;
- configurar `pnpm workspace`;
- configurar lint;
- configurar TypeScript base;
- configurar variáveis de ambiente;
- definir convenções de scripts;
- preparar README operacional do repositório.

### Critério de aceite

- estrutura inicial validada;
- comandos principais padronizados;
- documentação local refletindo a estrutura real.

## Épico 1 - Base de autenticação e tenant

### Objetivo

Criar o núcleo de acesso e isolamento do sistema.

### Entregas

- modelar Tenant, User, Role, UserRole e AuthSession;
- implementar login;
- implementar refresh;
- implementar logout;
- implementar endpoint `me`;
- aplicar middleware de autenticação;
- aplicar contexto de tenant na request;
- registrar auditoria de autenticação.

### Critério de aceite

- usuário autentica com segurança;
- sessão pode ser renovada;
- requisições protegidas respeitam tenant;
- acesso não autorizado é bloqueado.

## Épico 2 - Cadastros base

### Objetivo

Disponibilizar entidades necessárias para montar orçamento com reutilização.

### Entregas

- CRUD de clientes;
- CRUD de categorias;
- CRUD de marcas;
- CRUD de produtos;
- suporte a especificações do produto;
- busca e paginação básicas;
- hooks de API no frontend.

### Critério de aceite

- catálogo fica utilizável;
- dados respeitam tenant;
- produtos podem ser reaproveitados em orçamento.

## Épico 3 - Núcleo de orçamento

### Objetivo

Entregar o fluxo principal do produto.

### Entregas

- modelar Quote, QuoteVersion e QuoteItem;
- implementar criação de orçamento;
- implementar listagem;
- implementar detalhamento;
- implementar cálculo de subtotal, desconto e total;
- implementar nova versão;
- implementar histórico de versões;
- registrar auditoria do fluxo.

### Critério de aceite

- orçamento pode ser criado e revisado;
- versões preservam histórico;
- itens mantêm coerência histórica.

## Épico 4 - Importação e exportação JSON

### Objetivo

Permitir entrada e saída estruturada do orçamento.

### Entregas

- definir schemas Zod de importação;
- implementar parsing e normalização;
- mapear inconsistências;
- criar fluxo de criação por importação;
- implementar exportação versionada;
- documentar contrato Swagger.

### Critério de aceite

- arquivo JSON válido cria draft utilizável;
- erros de schema são claros;
- exportação pode ser reimportada.

## Épico 5 - PDF e compartilhamento público

### Objetivo

Entregar a capacidade comercial de envio do orçamento.

### Entregas

- modelar QuoteShareLink;
- criar publicação por link;
- criar revogação;
- implementar rota pública;
- definir payload público;
- implementar geração de PDF;
- vincular PDF à versão correta;
- registrar auditoria de publicação.

### Critério de aceite

- orçamento pode ser compartilhado com segurança;
- PDF representa a versão esperada;
- link público respeita status e validade.

## Épico 6 - Dashboard do MVP

### Objetivo

Dar visibilidade mínima de uso do sistema.

### Entregas

- definir KPIs do MVP;
- implementar consultas agregadas;
- criar endpoint de resumo;
- criar cards iniciais no frontend;
- validar performance básica.

### Critério de aceite

- dashboard mostra indicadores úteis;
- dados respeitam tenant;
- não compromete o desempenho do fluxo principal.

## Épico 7 - Observabilidade e qualidade

### Objetivo

Adicionar capacidade mínima de operação segura.

### Entregas

- logs estruturados;
- tratamento centralizado de erro;
- health checks;
- auditoria mínima;
- testes de domínio;
- testes de autenticação;
- testes de autorização;
- testes de importação;
- testes de share link.

### Critério de aceite

- falhas principais são rastreáveis;
- fluxos críticos têm validação automatizada proporcional ao risco.

## Épico 8 - Base para IA futura

### Objetivo

Preparar a arquitetura para V2 sem acoplar IA ao core do MVP.

### Entregas

- definir interfaces para providers;
- definir contrato de input estruturado;
- criar espaço para prompt library;
- definir validação determinística das saídas;
- registrar métricas de custo futuro.

### Critério de aceite

- IA pode ser adicionada depois sem reescrever o domínio.

## Sequência recomendada de execução

1. Épico 0
2. Épico 1
3. Épico 2
4. Épico 3
5. Épico 4
6. Épico 5
7. Épico 6
8. Épico 7
9. Épico 8

## Fatiamento ideal para agentes

### Tamanho da tarefa

Cada tarefa deve alterar poucos arquivos e resolver uma única responsabilidade central.

### Exemplo de boa fatia

- modelar entidade `Customer` no Prisma;
- criar schema Zod de criação de cliente;
- criar endpoint `POST /customers`;
- criar hook correspondente;
- documentar contrato.

### Exemplo de má fatia

- “implementar todo o sistema de orçamento com PDF, IA e dashboard”.

## Dependências principais

- autenticação antes de rotas protegidas;
- tenant e papéis antes de autorização;
- catálogo antes de orçamento com reaproveitamento;
- orçamento antes de PDF e share link;
- versionamento antes de exportação robusta;
- observabilidade antes de integrações sensíveis.

## Itens explicitamente adiados

- scraping multi-loja;
- monitoramento de preços;
- alertas automáticos;
- pagamentos;
- white-label;
- app mobile;
- marketplace.

## Critério para abrir próxima fase

A próxima fase só deve começar quando:

- a fase atual estiver documentada;
- os fluxos centrais estiverem estáveis;
- riscos principais tiverem mitigação definida;
- o backlog seguinte estiver refinado em tarefas menores.
