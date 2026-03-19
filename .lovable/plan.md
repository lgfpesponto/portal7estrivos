

## Plano: Remover verificação e liberar login direto para todos os usuários

### Problema

No `AuthContext.tsx`, duas coisas bloqueiam usuários não-admin:

1. **Linha 441 e 456**: `if (result && result.verificado) await loadOrders(...)` — pedidos só carregam se `verificado === true`. Novos usuários têm `verificado = false`, então ficam presos no loading infinito.

2. **Linha 482**: `return verificado ? 'ok' : 'verify'` — login retorna `'verify'` para não-verificados, redirecionando para `/verificar` (que não funciona sem Twilio/email).

### Solução

**1. `src/contexts/AuthContext.tsx`** — 3 alterações:
- Linhas 441 e 456: remover checagem de `verificado` — sempre carregar pedidos após carregar perfil
- Linha 465-483: simplificar `login()` para retornar apenas `'ok'` ou `'error'`
- Remover `needsVerification` do estado e contexto (ou ignorá-lo)

**2. `src/pages/LoginPage.tsx`** — remover redirecionamento para `/verificar`, sempre navegar para `/`

**3. Migration SQL** — marcar todos os perfis existentes como verificados:
```sql
UPDATE profiles SET verificado = true WHERE verificado IS NOT TRUE;
```

### Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/contexts/AuthContext.tsx` | Remover gates de `verificado` no auth listener e login |
| `src/pages/LoginPage.tsx` | Sempre redirecionar para `/` após login |
| Migration SQL | `UPDATE profiles SET verificado = true` |

