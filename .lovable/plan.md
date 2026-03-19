

## Plano: Corrigir lentidão e travamento no login

### Diagnóstico

O `AuthContext.tsx` tem um problema de race condition e bloqueio na inicialização:

1. **Carregamento duplicado**: Tanto `onAuthStateChange` quanto `getSession` disparam ao mesmo tempo no mount, ambos chamando `loadProfile` + `loadOrders` — dobrando as queries ao banco.

2. **`await` dentro de `onAuthStateChange`**: Isso bloqueia o processamento de eventos de autenticação subsequentes, causando deadlock. A documentação do Supabase avisa explicitamente para NÃO usar await dentro desse listener.

3. **`setLoading(false)` em dois lugares**: Pode ser chamado antes dos dados estarem prontos, ou nunca ser chamado se uma das promises travar.

### Solução

Reestruturar o `useEffect` de autenticação seguindo o padrão recomendado:

**`src/contexts/AuthContext.tsx`** — Reescrever o listener de auth:

```typescript
useEffect(() => {
  let isMounted = true;

  // 1. Restaurar sessão do storage PRIMEIRO
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (!isMounted) return;
    if (session?.user) {
      const result = await loadProfile(session.user.id);
      if (result && isMounted) await loadOrders(result);
    }
    if (isMounted) setLoading(false);
  });

  // 2. Listener para mudanças SUBSEQUENTES (login/logout)
  //    NÃO usar await — fire-and-forget
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_IN' && session?.user) {
        // Fire-and-forget — sem await
        loadProfile(session.user.id).then(result => {
          if (result && isMounted) loadOrders(result);
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        setOrders([]);
        setAllOrders([]);
      }
    }
  );

  return () => {
    isMounted = false;
    subscription.unsubscribe();
  };
}, [loadProfile, loadOrders]);
```

Mudanças-chave:
- `getSession` roda primeiro para restaurar sessão existente
- `onAuthStateChange` só reage a eventos novos (`SIGNED_IN`, `SIGNED_OUT`), sem `await`
- Flag `isMounted` previne updates em componente desmontado
- `setLoading(false)` chamado em um único lugar

### Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/contexts/AuthContext.tsx` | Reescrever useEffect de auth (linhas 434-458) |

