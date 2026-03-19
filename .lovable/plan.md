

## Plano: Migração para Banco de Dados Persistente + Limpeza de Dados

### Resumo

Migrar todo o sistema de armazenamento em memória (React state) para o banco de dados persistente via Lovable Cloud, mantendo o layout, navegação e lógica existentes intactos. Limpar dados mock, manter apenas os 3 usuários especificados, e garantir que todos os novos cadastros e pedidos sejam persistidos.

---

### 1. Criar tabelas no banco de dados

**Tabela `profiles`** — dados do usuário
- `id` (uuid, FK auth.users ON DELETE CASCADE)
- `nome_completo`, `nome_usuario` (unique), `telefone`, `email`, `cpf_cnpj`
- `created_at`

**Tabela `user_roles`** — controle de admin
- `id` (uuid), `user_id` (FK auth.users), `role` (enum: admin, user)
- Unique(user_id, role)

**Tabela `orders`** — pedidos com todos os ~60 campos
- Todas as colunas do tipo `Order` atual como colunas individuais
- `user_id` (FK auth.users) — quem criou o pedido
- `fotos` (jsonb), `historico` (jsonb), `alteracoes` (jsonb), `extra_detalhes` (jsonb)

**Função `has_role`** (security definer) para RLS sem recursão.

**RLS:**
- `profiles`: usuários leem/editam apenas seu próprio perfil; admins leem todos
- `orders`: admins leem/editam todos; revendedores leem/editam apenas seus próprios (via `user_id = auth.uid()`)
- `user_roles`: somente leitura para o próprio usuário

---

### 2. Seed de usuários administradores e demo

Criar via Supabase Auth (com auto-confirm habilitado temporariamente para seed):
1. **7estrivos** → email interno `7estrivos@7estrivos.app`, senha `admin123`, role `admin`
2. **fernanda** → email interno `fernanda@7estrivos.app`, senha `admin123`, role `admin`
3. **demo** → email interno `demo@7estrivos.app`, senha `123456`, role `user`

Inserir profiles correspondentes com os dados atuais (nome completo, telefone, etc.).

---

### 3. Reescrever `AuthContext.tsx`

Manter a mesma interface (`useAuth`) para não alterar nenhuma página consumidora.

**Mudanças internas:**
- `login()`: chama `supabase.auth.signInWithPassword()` usando `username@7estrivos.app` como email
- `register()`: chama `supabase.auth.signUp()` + insere profile
- `logout()`: chama `supabase.auth.signOut()`
- `user`: carregado do profile via `onAuthStateChange`
- `isAdmin`: consultado via `has_role()` ou join com `user_roles`
- `orders` / `allOrders`: queries ao banco com RLS (admin vê tudo, revendedor vê só seus)
- `addOrder()`: INSERT no banco
- `updateOrder()`: UPDATE no banco + registra alterações
- `updateOrderStatus()`: UPDATE status + append historico/alteracoes
- `deleteOrder()`: DELETE no banco
- `updateProfile()`: UPDATE na tabela profiles
- `recoverPassword()`: valida CPF/CNPJ no banco + reset via Supabase Auth

Remover: `generateMockOrders()`, array `registeredUsers`, todo state in-memory.

---

### 4. Ajustar `drafts.ts`

Manter rascunhos em localStorage (já funciona por usuário). Nenhuma mudança necessária — os IDs de usuário continuarão consistentes pois virão do auth.

---

### 5. Validação final

- Verificar que OrderPage, EditOrderPage, BeltOrderPage, ExtrasPage funcionam com as mesmas chamadas (`addOrder`, `updateOrder`)
- Verificar que ReportsPage e SpecializedReports continuam usando `orders` e `allOrders` do contexto
- Verificar que TrackOrderPage, OrderDetailPage, Index, ProfilePage continuam funcionando
- Nenhuma página precisa de alteração além do AuthContext — a interface se mantém idêntica

---

### Arquivos alterados

| Arquivo | Alteração |
|---|---|
| **Migração SQL** | Criar tabelas profiles, user_roles, orders + RLS + função has_role |
| **Edge Function** (seed) | Criar usuários admin e demo no auth + profiles |
| `src/contexts/AuthContext.tsx` | Reescrever para usar Supabase Auth + banco de dados, mantendo a mesma interface |

### Arquivos NÃO alterados

Todas as páginas (OrderPage, EditOrderPage, ReportsPage, Index, TrackOrderPage, etc.) continuam iguais pois consomem a mesma interface `useAuth()`.

---

### Riscos e mitigações

- **Login por username**: Supabase Auth usa email — mapeamos internamente `username@7estrivos.app`
- **Performance**: queries de orders podem ser lentas com muitos pedidos — adicionar índices em `user_id`, `status`, `numero`
- **Fotos**: atualmente armazenadas como base64 no state — serão armazenadas como JSONB (array de strings). Se forem grandes, futuramente migrar para Storage.

