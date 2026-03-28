

## Plano: Edição de pedidos Extras com formulário correto

### Problema
Ao clicar no ícone de editar (lápis) em um pedido de Extras, o sistema abre `/pedido/:id/editar` — a ficha de produção de bota. O correto é abrir o formulário específico do produto Extra com os dados já preenchidos.

### Solução

#### 1. Criar página `src/pages/EditExtrasPage.tsx`
- Rota: `/extras/:id/editar`
- Busca o pedido pelo `id`, verifica que é Extra (`tipoExtra` preenchido) e que o usuário é admin
- Pré-popula o formulário com os dados de `order.extraDetalhes` e `order.numeroPedidoBota`
- Reutiliza exatamente o mesmo layout de campos do `ExtrasPage.renderForm()` (campos condicionais por `tipoExtra`)
- Campos editáveis: vendedor (admin), número do pedido, e campos específicos do produto (ex: corTiras para Tiras Laterais, tipoCouro/corCouro/vaiCanivete para Kit Faca, etc.)
- Ao salvar: recalcula o preço com `calcPrice()`, chama `updateOrder()` atualizando `extraDetalhes`, `numeroPedidoBota`, `vendedor`, `preco`
- Botão "Salvar" em vez de "Finalizar Pedido"

#### 2. Registrar rota em `src/App.tsx`
- Adicionar `<Route path="/extras/:id/editar" element={<EditExtrasPage />} />`

#### 3. Atualizar navegação condicional
**`src/pages/OrderDetailPage.tsx` (linha 264):**
```typescript
onClick={() => navigate(order.tipoExtra 
  ? `/extras/${order.id}/editar` 
  : order.tipoExtra === 'cinto' 
    ? `/pedido-cinto/${order.id}/editar` 
    : `/pedido/${order.id}/editar`
)}
```
Simplificado: se `order.tipoExtra` existe e não é `'cinto'`, vai para `/extras/:id/editar`. Caso contrário mantém o comportamento atual.

**`src/pages/ReportsPage.tsx` (linha 941):** Mesma lógica condicional.

#### 4. Permissão
- Apenas admin (Juliana e Fernanda) vê o botão de editar — já é assim hoje
- Na `EditExtrasPage`, redirecionar para `/relatorios` se não for admin

### Arquivos

| Arquivo | Alteração |
|---|---|
| `src/pages/EditExtrasPage.tsx` | **Novo** — formulário de edição de extras |
| `src/App.tsx` | Adicionar rota `/extras/:id/editar` |
| `src/pages/OrderDetailPage.tsx` | Redirecionar edição de extras para nova rota |
| `src/pages/ReportsPage.tsx` | Redirecionar edição de extras para nova rota |

