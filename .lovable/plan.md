

## Plano: Atualizações no Portal 7ESTRIVOS

Este plano cobre 11 alterações no sistema. São mudanças apenas de código — nenhuma alteração de banco de dados é necessária.

---

### 1. Seletor de Vendedor para ADM na ficha de produção

**Arquivos:** `src/pages/OrderPage.tsx`, `src/pages/BeltOrderPage.tsx`, `src/pages/ExtrasPage.tsx`, `src/contexts/AuthContext.tsx`

- Nos formulários de criação de pedido, quando o usuário for ADM, exibir um `<Select>` com a lista de todos os perfis (vendedores) cadastrados no sistema, buscados da tabela `profiles`.
- Quando o ADM selecionar um vendedor, o `vendedor` do pedido será o nome do vendedor selecionado.
- O `user_id` do pedido continuará sendo o do ADM logado (pois RLS exige `user_id = auth.uid()` no INSERT). Para que o pedido apareça no portal do vendedor selecionado, a filtragem de pedidos por vendedor será feita pelo campo `vendedor` (texto) e não pelo `user_id`.
- **Impacto na visualização do vendedor:** Atualmente `loadOrders` retorna todos os pedidos do usuário via RLS. Para vendedores verem pedidos criados por ADMs em seu nome, é necessário ajustar a RLS da tabela `orders` para SELECT: adicionar condição que permita ao usuário ver pedidos onde `vendedor` corresponde ao seu `nome_completo` no perfil.
- **Migração de banco necessária:** Adicionar policy RLS para SELECT que permite leitura quando o campo `vendedor` do pedido corresponde ao `nome_completo` do perfil do usuário autenticado.

**SQL migration:**
```sql
CREATE OR REPLACE FUNCTION public.get_user_full_name(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT nome_completo FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

DROP POLICY IF EXISTS "Users read own orders or admin reads all" ON public.orders;
CREATE POLICY "Users read own orders or admin reads all" ON public.orders
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR vendedor = public.get_user_full_name(auth.uid())
  );
```

- No `AuthContext`, adicionar estado `allProfiles` e função `loadAllProfiles` para ADMs carregarem a lista de vendedores.
- Expor `allProfiles` no contexto para uso nos formulários.

---

### 2. Relatório de Bordados — novo layout e filtro de progresso

**Arquivo:** `src/components/SpecializedReports.tsx`

- O filtro de progresso já existe para Bordados (`needsProgressFilter` inclui `bordados`). O `progressOptions` já lista `BORDADO_STATUSES`. Precisa expandir para listar **todos** os status de produção, não só os de bordado, pois o requisito é "progresso de produção selecionado".
- Reescrever `generateBordadosPDF()`:
  - **Colunas:** Nº Pedido | Descrição do bordado (todas as infos) | QR Code (do link da foto) | Receita (campo em branco)
  - Descrição inclui: bordado cano, cor bordado cano, bordado gáspea, cor bordado gáspea, bordado taloneira, cor bordado taloneira, nome bordado, descrição nome bordado, observação.
  - Sem valores, apenas descrições.
  - QR Code gerado a partir do link da foto (`order.fotos[0]`) usando biblioteca `qrcode` (adicionar como dependência) ou canvas-based.
  - Coluna "Receita": campo grande em branco (rect vazio).
  - Listar todos os pedidos individualmente, sem agrupar.

---

### 3. Relatório de Expedição — substituir código de barras por composição

**Arquivo:** `src/components/SpecializedReports.tsx`

- Em `generateExpedicaoPDF()`, substituir a coluna "CÓD. BARRAS" por "COMPOSIÇÃO".
- O conteúdo da composição é o mesmo usado no relatório de Cobrança (a lógica de `priceItems` já existe lá).
- Extrair a lógica de composição para uma função reutilizável.

---

### 4. Coluna "Data do pedido" nos relatórios de Expedição e Cobrança

**Arquivo:** `src/components/SpecializedReports.tsx`

- Adicionar coluna "DATA" em ambos os relatórios, mostrando `order.dataCriacao` formatado como DD/MM/AAAA.
- Ajustar larguras das colunas para acomodar.

---

### 5. Relatório Pesponto → Metais

**Arquivo:** `src/components/SpecializedReports.tsx`

- Renomear label `pesponto: 'Pesponto'` → `pesponto: 'Metais'` no `REPORT_LABELS`.
- Adicionar filtro de progresso (todos os status de produção).
- Reescrever `generatePespontoPDF()`:
  - **Colunas:** Nº Pedido | Descrição de metais | QR Code (foto)
  - Descrição: todos os campos de metais preenchidos (área metal, tipo metal, cor metal, strass qtd, cruz metal qtd, bridão metal qtd).
  - Filtrar: só pedidos que tenham algum campo de metais preenchido.
  - QR Code do link da foto.

---

### 6. Seleção múltipla de pedidos na página detalhada (ADM)

**Arquivo:** `src/pages/OrderDetailPage.tsx`, possivelmente um novo contexto ou hook para estado global de seleção.

- Criar um estado global (Context ou Zustand) para armazenar IDs de pedidos selecionados, persistindo entre navegações.
- Na página de detalhes, ADM vê:
  - Checkbox ao lado do botão "Escanear" para marcar/desmarcar o pedido atual.
  - Indicador de quantos pedidos estão selecionados.
  - Botão "Mudar progresso de produção" com seletor de status, que aplica a mudança em todos os selecionados via `updateOrderStatus`.
- Ao escanear e navegar para outro pedido, seleções anteriores permanecem.

---

### 7. Remover "Pendente" do dashboard do usuário "Site"

**Arquivo:** `src/pages/Index.tsx`

- No `renderVendedorDashboard()`, esconder o card "Pendente" quando `user?.nomeUsuario?.toLowerCase() === 'site'`.

---

### 8. Gráfico "Botas Vendidas" → "Quantidade de vendas"

**Arquivo:** `src/pages/Index.tsx`

- Renomear título de "Botas Vendidas" para "Quantidade de vendas".
- Incluir na contagem pedidos de tipo: Bota (sem `tipoExtra`), Regata (`tipoExtra === 'regata'`), Bota Pronta Entrega (`tipoExtra === 'bota_pronta_entrega'`).
- Adicionar filtro de produto (Bota, Regata, Bota Pronta Entrega, Todos).
- Quando "Todos": somar todos os 3 tipos.

---

### 9. Filtro de Vendedor no gráfico (ADM)

**Arquivo:** `src/pages/Index.tsx`

- Adicionar `<Select>` de vendedor no gráfico "Quantidade de vendas", visível apenas para ADM.
- Sem filtro: soma de todos. Com filtro: apenas pedidos daquele vendedor.

---

### 10. Regras de visualização (já implementado)

- Vendedores já veem apenas seus pedidos; ADMs já veem todos. O ajuste da RLS do item 1 garante que vendedores vejam pedidos criados por ADMs em seu nome.

---

### 11. Valores apenas em Expedição e Cobrança

**Arquivo:** `src/components/SpecializedReports.tsx`

- Verificar que os relatórios Escalação, Forro, Bordados (novo layout) e Metais (novo Pesponto) não exibem valores — já é o caso para Escalação e Forro. Os novos layouts de Bordados e Metais já não incluirão valores.

---

### Resumo de arquivos alterados

| Arquivo | Alterações |
|---|---|
| `src/contexts/AuthContext.tsx` | Carregar lista de perfis para ADM; expor `allProfiles` |
| `src/pages/OrderPage.tsx` | Seletor de vendedor para ADM |
| `src/pages/BeltOrderPage.tsx` | Seletor de vendedor para ADM |
| `src/pages/ExtrasPage.tsx` | Seletor de vendedor para ADM |
| `src/pages/Index.tsx` | Renomear gráfico, filtros de produto/vendedor, esconder Pendente para "Site" |
| `src/pages/OrderDetailPage.tsx` | Checkbox de seleção + ação em lote |
| `src/components/SpecializedReports.tsx` | Bordados, Expedição, Cobrança, Pesponto→Metais |
| `src/hooks/useSelectedOrders.tsx` | Novo hook/context para seleção múltipla de pedidos |
| **Migration SQL** | Nova function `get_user_full_name` + policy RLS atualizada para orders SELECT |
| **Dependência** | Adicionar `qrcode` para geração de QR codes nos PDFs |

### Ordem de implementação

1. Migration SQL (RLS + function)
2. AuthContext (allProfiles)
3. Seletor de vendedor nos formulários (OrderPage, BeltOrderPage, ExtrasPage)
4. Dashboard (Index.tsx) — gráfico, filtros, Pendente
5. Relatórios (SpecializedReports.tsx) — Bordados, Metais, Expedição, Cobrança
6. Seleção múltipla (OrderDetailPage + hook)

