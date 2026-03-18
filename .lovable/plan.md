

## Plano: 3 ajustes

### 1. Voltar gráfico "Botas Vendidas" no dashboard dos revendedores

Em `src/pages/Index.tsx`, no `renderVendedorDashboard()`, adicionar o card do gráfico de vendas (mesmo componente do admin) usando `orders` (que já filtra só os pedidos do revendedor logado). Colocar na coluna da direita do grid.

### 2. Valor consistente em "Meus Pedidos"

O problema: `order.preco` é salvo na criação como o total da composição. Porém na listagem de "Meus Pedidos" mostra `order.preco * order.quantidade`. Como `quantidade` é sempre 1, normalmente bate. Mas se o pedido for editado, o `preco` pode ficar dessincronizado.

**Solução:** Na `OrderDetailPage.tsx`, o valor exibido no header (linha 159) deve usar `totalCalc` (a soma da composição) em vez de `order.preco * order.quantidade`. E na `ReportsPage.tsx`, o valor na listagem (linha 687) já usa `order.preco` que foi calculado na criação — para garantir consistência, recalcular o total da composição seria complexo demais na listagem. A abordagem correta é: ao editar um pedido (`EditOrderPage`), recalcular e salvar o `preco` atualizado. Vou verificar se isso já acontece.

**Após verificação:** O `order.preco` é definido na criação e pode não ser atualizado em edições. Vou garantir que o header do `OrderDetailPage` use `totalCalc` (composição recalculada) e que a listagem em `ReportsPage` também use esse valor recalculado, ou que `updateOrder` atualize `preco` quando itens mudam.

**Abordagem mais simples:** No `OrderDetailPage`, usar `totalCalc` tanto no header como na composição. Na listagem de "Meus Pedidos", continuar usando `order.preco` (que foi salvo na criação). Se o pedido for editado, garantir que `preco` é atualizado.

### 3. Relatório Cobrança: nome + valor de cada item na composição

Em `src/components/SpecializedReports.tsx`, no `generateCobrancaPDF()`, substituir a lógica de composição atual (que mostra apenas nomes) por uma que inclua o valor de cada item. Usar a mesma lógica de `priceItems` do `OrderDetailPage` para montar linhas como:

```
Modelo: Bota Tradicional R$ 260,00
Sob Medida R$ 50,00
Florência R$ 40,00
...
```

Importar as constantes de preço de `orderFieldsConfig.ts` e replicar a lógica de cálculo de composição dentro do `generateCobrancaPDF`.

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Index.tsx` | Adicionar gráfico "Botas Vendidas" no `renderVendedorDashboard()` |
| `src/pages/OrderDetailPage.tsx` | Usar `totalCalc` no header do pedido |
| `src/components/SpecializedReports.tsx` | Composição com nome + valor no PDF de Cobrança |

