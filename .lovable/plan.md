

## Plano: Corrigir pedidos que não são criados (sem mensagem de erro)

### Diagnóstico

O problema é uma combinação de dois fatores:

1. **Sessão expirada silenciosa**: Os logs de autenticação mostram "Invalid Refresh Token: Refresh Token Not Found". Quando o token expira, o Supabase rejeita o INSERT por RLS, mas o erro não chega ao usuário.

2. **Sem try-catch**: A função `confirmOrder` nas páginas (OrderPage, BeltOrderPage, ExtrasPage) chama `await addOrder(...)` sem try-catch. Se `addOrder` lançar uma exceção (em vez de retornar `false`), a promise é rejeitada silenciosamente — nenhum toast aparece.

3. **`addOrder` sem tratamento robusto**: A função `addOrder` no AuthContext não tem try-catch. Se qualquer operação Supabase falhar de forma inesperada, a exceção sobe sem tratamento.

### Solução

**1. `src/contexts/AuthContext.tsx`** — Envolver `addOrder` em try-catch:
- Adicionar try-catch completo ao redor de toda a lógica
- No catch: `console.error` + retornar `false`
- Verificar sessão ativa antes de inserir: `const { data: { session } } = await supabase.auth.getSession()` — se não houver sessão, forçar logout e retornar `false`

**2. `src/pages/OrderPage.tsx`** — Envolver `confirmOrder` em try-catch:
- Adicionar try-catch com toast de erro no catch
- Adicionar `console.error` para debug

**3. `src/pages/BeltOrderPage.tsx`** — Mesmo tratamento

**4. `src/pages/ExtrasPage.tsx`** — Mesmo tratamento

### Mudanças específicas

```typescript
// AuthContext.tsx - addOrder
const addOrder = useCallback(async (orderData: ...): Promise<boolean> => {
  try {
    if (!user) {
      console.error('addOrder: user is null');
      return false;
    }
    // Verificar sessão válida
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('addOrder: session expired');
      await logout();
      return false;
    }
    // ... resto da lógica existente ...
  } catch (err) {
    console.error('addOrder exception:', err);
    return false;
  }
}, [user, logout]);
```

```typescript
// OrderPage.tsx, BeltOrderPage.tsx - confirmOrder
const confirmOrder = async () => {
  try {
    const success = await addOrder({ ... });
    if (success) { ... }
    else { toast.error('Erro ao salvar. Faça login novamente e tente.'); }
  } catch (err) {
    console.error('confirmOrder error:', err);
    toast.error('Erro inesperado ao salvar o pedido.');
  }
};
```

| Arquivo | Alteração |
|---|---|
| `src/contexts/AuthContext.tsx` | Try-catch + verificação de sessão em `addOrder` |
| `src/pages/OrderPage.tsx` | Try-catch em `confirmOrder` |
| `src/pages/BeltOrderPage.tsx` | Try-catch em `confirmOrder` |
| `src/pages/ExtrasPage.tsx` | Try-catch no submit |

