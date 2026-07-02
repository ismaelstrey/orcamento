# Rbac And Security Spec

## Objetivo

Fechar as regras práticas de autenticação, autorização, sessões, share links e isolamento multiempresa para o MVP.

## Papéis do MVP

- owner
- admin
- seller

## Responsabilidades por papel

### owner

- gerencia usuários e papéis;
- gerencia catálogo;
- gerencia clientes;
- cria, edita e versiona orçamentos;
- gera PDF;
- cria e revoga links;
- acessa dashboard completo.

### admin

- opera quase tudo no tenant;
- não promove ou remove o último owner;
- não altera governança crítica do tenant.

### seller

- consulta clientes e catálogo;
- cria e edita orçamentos;
- cria novas versões;
- gera PDF;
- cria e revoga links;
- não gerencia usuários;
- não administra estrutura do catálogo.

## Matriz resumida

```text
Recurso                  owner   admin   seller
auth me/logout           sim     sim     sim
organization current     sim     sim     sim
users read               sim     sim     nao
users write              sim     sim     nao
roles read               sim     sim     nao
customers read           sim     sim     sim
customers write          sim     sim     sim
catalog read             sim     sim     sim
catalog write            sim     sim     nao
quotes read              sim     sim     sim
quotes write             sim     sim     sim
quote versions           sim     sim     sim
pdf                      sim     sim     sim
share links              sim     sim     sim
dashboard                sim     sim     opcional
public quote             publico publico publico
```

## Política de autenticação

### Login

- autenticação por e-mail e senha;
- senha comparada com `bcrypt`;
- usuário com status `disabled` não autentica;
- usuário `invited` só autentica após ativação.

### Tokens

- `accessToken` com vida curta;
- `refreshToken` persistido por sessão;
- rotação de refresh token em cada renovação.

### Defaults recomendados

- access token: 15 minutos;
- refresh token: 7 dias;
- bcrypt cost: 12.

## Sessões

Cada login deve gerar uma sessão própria com:

- userId;
- tenantId;
- refreshTokenHash;
- userAgent;
- ipAddress;
- expiresAt;
- revokedAt.

## Política de refresh

- validar se sessão existe;
- validar se sessão não expirou;
- validar se sessão não foi revogada;
- rotacionar refresh token;
- emitir novo access token.

## Política de logout

- revogar somente a sessão atual no MVP;
- logout global pode ser evolução posterior.

## Claims recomendadas do JWT

```json
{
  "sub": "usr_1",
  "tenantId": "ten_1",
  "sessionId": "ses_1",
  "roles": ["admin"],
  "type": "access"
}
```

## Isolamento multiempresa

### Regra central

Toda rota autenticada deve operar exclusivamente dentro do tenant do usuário autenticado.

### Regras obrigatórias

- `tenantId` nunca vem do body;
- `tenantId` nunca vem da query;
- `tenantId` vem do contexto autenticado;
- toda consulta precisa filtrar por `tenantId`;
- toda relação criada deve pertencer ao mesmo tenant.

### Exemplos de validação

- `customerId` deve pertencer ao tenant atual;
- `productId` deve pertencer ao tenant atual;
- `quoteId` deve pertencer ao tenant atual;
- `quoteVersionId` deve pertencer ao tenant atual.

## Middleware sugerido

### authenticate

Responsável por:

- validar token;
- extrair `userId`, `tenantId`, `sessionId` e `roles`;
- montar `authContext`.

### authorize

Responsável por:

- validar os papéis permitidos;
- bloquear acesso fora da regra de RBAC.

### tenantScopedResource

Responsável por:

- garantir que o recurso solicitado pertence ao tenant atual.

## Share links públicos

### Regras centrais

- todo link aponta para uma `quoteVersion`;
- o slug é aleatório e único;
- o link pode estar ativo, expirado ou revogado;
- link público nunca expõe dados internos do tenant.

### Política recomendada

- expiração opcional;
- default operacional de 15 dias;
- revogação lógica, nunca exclusão física.

### Payload público permitido

- título do orçamento;
- versão;
- itens;
- totais;
- moeda;
- notas públicas;
- PDF associado, se liberado.

### Payload público proibido

- tenantId;
- internalNotes;
- createdByUserId;
- logs;
- dados de sessão;
- dados administrativos.

## Rate limiting

Obrigatório nas rotas:

- `/auth/login`
- `/auth/refresh`
- `/public/quotes/:slug`

## Headers e políticas mínimas

- CORS restrito ao domínio do app;
- `X-Content-Type-Options`;
- `Referrer-Policy`;
- `Content-Security-Policy` compatível com o frontend;
- cookies `httpOnly`, `secure` e `sameSite=lax` quando usados.

## Auditoria mínima

Devem ser auditados:

- login bem-sucedido;
- login negado;
- refresh;
- logout;
- criação de orçamento;
- edição de orçamento;
- criação de versão;
- publicação de link;
- revogação de link;
- criação e alteração de usuário.

## Códigos de erro prioritários

- `authentication_error`
- `authorization_error`
- `tenant_scope_error`
- `share_link_expired`
- `share_link_revoked`

## Regras operacionais para implementação

- repositórios não devem aceitar consultas sem tenant;
- rotas públicas não devem reutilizar serializers internos sem filtro;
- dados sensíveis não devem entrar em logs brutos;
- falhas de autenticação devem ser rastreáveis sem revelar segredos.

## Decisões pendentes

- seller acessa dashboard completo ou resumido;
- refresh token exclusivamente em cookie ou body + cookie;
- política final de expiração padrão de link público.
