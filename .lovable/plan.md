

## Plano: Corrigir Cadastro de Usuários e Salvamento de Pedidos

### Problema 1 — Cadastro falha com "usuário já existe"

Os logs mostram erros `400: Unable to validate email address: invalid format`. O sistema mapeia o nome de usuário para email (`usuario@7estrivos.app`), mas nomes com espaços ou caracteres especiais geram emails inválidos (ex: `joão silva@7estrivos.app`).

**Solução em `src/contexts/AuthContext.tsx` → `register()`:**
- Sanitizar o `nomeUsuario` antes de criar o email: remover espaços, acentos e caracteres especiais
- Adicionar melhor tratamento de erro para mostrar mensagens mais claras ao usuário

**Solução em `src/pages/RegisterPage.tsx`:**
- Sanitizar o campo `nomeUsuario` em tempo real no input (remover espaços, forçar lowercase, só alfanuméricos)

### Problema 2 — Pedidos não são salvos

As funções `confirmOrder` em `OrderPage.tsx`, `BeltOrderPage.tsx` e `ExtrasPage.tsx` chamam `addOrder()` (que é `async`) **sem `await`**. O código navega para `/relatorios` imediatamente, antes do INSERT no banco completar. Se houver erro, é silenciosamente ignorado.

**Solução nos 3 arquivos:**
- Tornar `confirmOrder` `async` e fazer `await addOrder(...)`
- Só navegar e mostrar toast de sucesso se o pedido foi salvo
- Mostrar toast de erro se falhar
- `addOrder` no AuthContext precisa retornar um boolean indicando sucesso/falha

### Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/contexts/AuthContext.tsx` | Sanitizar username no register; addOrder retornar boolean |
| `src/pages/RegisterPage.tsx` | Sanitizar input de nomeUsuario em tempo real |
| `src/pages/OrderPage.tsx` | `await addOrder()` + tratamento de erro |
| `src/pages/BeltOrderPage.tsx` | `await addOrder()` + tratamento de erro |
| `src/pages/ExtrasPage.tsx` | `await addOrder()` + tratamento de erro |

