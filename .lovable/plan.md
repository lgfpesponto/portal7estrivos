

## Plano: Corrigir carregamento infinito na página de Usuários

### Problema

A página `UsersManagementPage` não espera o estado de autenticação carregar. Quando monta, `isLoggedIn` ainda é `false` (auth carregando), então `isJuliana` é `false`, e o useEffect redireciona para `/` antes do auth terminar. Mesmo se não redirecionar, o componente retorna `null` prematuramente.

### Solução

**Arquivo: `src/pages/UsersManagementPage.tsx`**

1. Importar `loading` do `useAuth()`
2. Enquanto `loading` for `true`, exibir spinner de carregamento (não redirecionar nem retornar null)
3. Só verificar `isLoggedIn` e `isJuliana` após `loading === false`
4. No useEffect, adicionar `loading` como dependência e só executar lógica quando `loading === false`

```typescript
const { isLoggedIn, user, loading: authLoading } = useAuth();

useEffect(() => {
  if (authLoading) return; // esperar auth carregar
  if (!isLoggedIn || !isJuliana) {
    navigate('/');
    return;
  }
  fetchProfiles();
}, [isLoggedIn, isJuliana, authLoading]);

if (authLoading) {
  return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;
}
if (!isLoggedIn || !isJuliana) return null;
```

### Arquivo alterado

| Arquivo | Alteração |
|---|---|
| `src/pages/UsersManagementPage.tsx` | Aguardar `loading` do auth antes de verificar permissões |

