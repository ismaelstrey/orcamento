---
alwaysApply: true
scene: git_message
---

Escreva suas regras aqui para personalizar o estilo das mensagens de commit geradas por IA. Siga o padrão estruturado abaixo para manter commits organizados e documentação consistente:

# Padrão de Mensagens de Commit
1. Estrutura obrigatória: <tipo>(<escopo>): <descrição curta>
   - Tipos permitidos: feat (nova funcionalidade), fix (correção de bug), docs (alterações em documentação), refactor (refatoração de código), test (adição/alteração de testes), chore (ajustes em ferramentas/build), perf (melhorias de performance)
   - Escopo: área do projeto afetada (ex: auth, checkout, usuario-service)
   - Descrição: use verbo no imperativo, máximo de 72 caracteres, sem letra maiúscula no início, sem ponto final

2. Corpo da mensagem (obrigatório para alterações complexas):
   - Explique o motivo da alteração, o que foi mudado e quais impactos geram
   - Separe do cabeçalho por uma linha em branco
   - Mencione issues relacionadas usando a sintaxe: Fixes #123 ou Closes #456

3. Exemplo de commit válido:
   feat(usuario-perfil): adiciona campo de data de nascimento no formulário de cadastro
   
   Inclui validação de idade mínima e persistência no banco de dados. Implementa regra de bloqueio para menores de 18 anos.
   Closes #789
