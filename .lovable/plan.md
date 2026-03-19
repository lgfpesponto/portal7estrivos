

## Plano: Gerenciamento de Usuários para Juliana (7estrivos)

### Resumo

Criar uma página de gerenciamento de usuários exclusiva para Juliana (7estrivos), onde ela pode visualizar todos os usuários cadastrados com seus dados, editar informações e excluir usuários.

---

### 1. Migração SQL — Permitir admin atualizar qualquer perfil

Adicionar RLS policy na tabela `profiles` para que admins possam fazer UPDATE em qualquer perfil:

```sql
CREATE POLICY "Admins update any profile"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

---

### 2. Edge Function `delete-user`

Criar `supabase/functions/delete-user/index.ts` que:
- Recebe `{ userId }` no body
- Verifica que o chamador é admin (via `has_role`)
- Usa `supabase.auth.admin.deleteUser(userId)` com service role key
- O CASCADE na FK de profiles apaga automaticamente o perfil e roles

---

### 3. Nova página `src/pages/UsersManagementPage.tsx`

- Busca todos os profiles via `supabase.from('profiles').select('*')` (RLS já permite admin ler todos)
- Exibe tabela com: Nome Completo, Usuário, Email, Telefone, CPF/CNPJ, Data de Cadastro
- Botão **Editar** em cada linha → abre dialog inline para editar campos do perfil (UPDATE via supabase)
- Botão **Excluir** → confirmação → chama Edge Function `delete-user`
- Impedir exclusão dos admins (7estrivos, fernanda) e do demo

---

### 4. Rota e navegação

- `App.tsx`: adicionar `<Route path="/usuarios" element={<UsersManagementPage />} />`
- `Header.tsx`: para Juliana (nomeUsuario === '7estrivos'), adicionar item "USUÁRIOS" no menu
- `Index.tsx`: corrigir check `user?.id === 'admin-1'` para `user?.nomeUsuario?.toLowerCase() === '7estrivos'` nos Pedidos de Alerta

---

### Arquivos alterados

| Arquivo | Alteração |
|---|---|
| Migração SQL | Policy admin update profiles |
| `supabase/functions/delete-user/index.ts` | Edge function para deletar usuário |
| `src/pages/UsersManagementPage.tsx` | Nova página com tabela, edição e exclusão |
| `src/App.tsx` | Nova rota `/usuarios` |
| `src/components/Header.tsx` | Link "USUÁRIOS" para Juliana |
| `src/pages/Index.tsx` | Corrigir check de Juliana de `admin-1` para `nomeUsuario` |

