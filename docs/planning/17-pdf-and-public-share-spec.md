# Pdf And Public Share Spec

## Objetivo

Definir como o MVP deve tratar geração de PDF e compartilhamento público para preservar consistência, segurança e valor comercial.

## Princípio central

PDF e link público sempre devem representar uma versão específica do orçamento.

Nunca devem depender do estado mutável atual do catálogo.

## PDF

### Objetivo do PDF

- servir como proposta comercial profissional;
- representar um snapshot confiável;
- permitir envio por e-mail, mensagem e arquivo;
- reforçar percepção de valor do produto.

### Fonte de dados

O PDF deve ser gerado a partir de:

- uma `quoteVersion` específica;
- seus `quoteItems` congelados;
- metadados públicos do orçamento.

### Conteúdo mínimo do PDF

- título do orçamento;
- identificação do cliente;
- data de emissão;
- número ou identificação da versão;
- lista de itens;
- quantidade;
- valor unitário;
- valor total por item;
- subtotal;
- desconto, se existir;
- total geral;
- moeda;
- notas públicas;
- validade comercial, se definida.

### Conteúdo proibido no PDF público/comercial

- notas internas;
- dados administrativos do tenant;
- auditoria;
- dados de sessão;
- informações não aprovadas para o cliente.

### Regras de geração

- o usuário pode gerar a partir da versão atual ou escolhida;
- o PDF deve registrar qual `quoteVersionId` originou o arquivo;
- falha de geração deve retornar erro específico;
- o layout deve ser estável e reutilizável.

### Estratégia operacional sugerida

- geração síncrona no MVP, se o desempenho permitir;
- fallback para job assíncrono em fase futura;
- storage inicial pode ser simples, desde que o contrato permaneça igual.

## Link público

### Objetivo

- compartilhar proposta sem exigir login;
- facilitar revisão pelo cliente;
- reduzir fricção de reenvio;
- complementar ou substituir o PDF em alguns casos.

### Estrutura do link

- vinculado a uma `quoteVersion`;
- identificado por `slug` aleatório;
- com `status` controlado;
- com expiração opcional;
- com revogação explícita.

### Estados

- active
- revoked
- expired

### Política recomendada do MVP

- expiração opcional;
- default de 15 dias quando não houver regra diferente;
- um novo compartilhamento gera novo slug;
- revogação é lógica.

## Payload público

### Deve exibir

- título;
- identificação resumida do cliente, se aprovada;
- itens;
- totais;
- moeda;
- notas públicas;
- referência da versão;
- validade, se existir;
- link para PDF, se permitido.

### Não deve exibir

- internalNotes;
- tenantId;
- createdByUserId;
- payloads de importação;
- auditoria;
- qualquer informação administrativa.

## Fluxo de publicação

1. usuário abre orçamento;
2. escolhe uma versão;
3. clica em publicar link;
4. informa validade opcional;
5. sistema cria `QuoteShareLink`;
6. sistema retorna URL pública;
7. usuário copia e envia ao cliente.

## Fluxo de revogação

1. usuário acessa lista de links;
2. seleciona link ativo;
3. confirma revogação;
4. sistema marca `status = revoked`;
5. rota pública passa a responder com estado revogado.

## Fluxo de acesso público

1. cliente abre URL;
2. sistema localiza slug;
3. valida existência;
4. valida status;
5. valida expiração;
6. monta payload público da versão;
7. renderiza página.

## Mensagens públicas mínimas

### Link ativo

- mostrar orçamento com leitura simples.

### Link expirado

- mensagem clara de indisponibilidade;
- sem exposição de dados internos.

### Link revogado

- mensagem clara de indisponibilidade;
- sem exposição de dados internos.

### Link inexistente

- mensagem neutra;
- evitar revelar detalhes internos.

## Relação entre PDF e página pública

- ambos partem da mesma `quoteVersion`;
- ambos devem compartilhar os mesmos dados públicos centrais;
- diferenças permitidas são apenas de formato e apresentação.

## Regras de consistência

- se uma versão for compartilhada, o link deve apontar exatamente para ela;
- se um PDF for gerado para uma versão, o identificador da versão deve ficar explícito;
- mudar o orçamento depois não altera retroativamente o PDF e nem o link de uma versão já publicada;
- publicação e PDF devem ser auditados.

## Requisitos de UX

- ação de gerar PDF visível no detalhe da versão;
- ação de publicar link visível e rápida;
- cópia da URL em um clique;
- status do link facilmente identificável;
- feedback claro em sucesso e falha.

## Campos recomendados para template visual

- logo ou identidade do tenant em fase futura;
- bloco de cabeçalho;
- bloco de cliente;
- tabela de itens;
- resumo financeiro;
- observações finais;
- rodapé com validade e referência da versão.

## Decisões pendentes

- preview interno de PDF no MVP ou apenas geração;
- storage inicial local ou externo;
- exibir nome completo do cliente na página pública por padrão ou de forma opcional;
- permitir download do PDF diretamente na página pública.
