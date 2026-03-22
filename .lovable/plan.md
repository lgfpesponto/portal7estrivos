

## Plano: Corrigir prazo na página de detalhes do pedido

### Problema

O prazo foi atualizado em `AuthContext.tsx` (criação do pedido), mas a página de detalhes (`OrderDetailPage.tsx`) ainda usa a lógica antiga para **exibir** os dias restantes:

```typescript
// Linha 71 — ANTIGO (ainda presente)
const totalBizDays = order.tipoExtra === 'cinto' ? 5 : order.tipoExtra ? 1 : order.temLaser ? 30 : 10;
```

### Solução

**Arquivo:** `src/pages/OrderDetailPage.tsx`

**Linha 71:** Atualizar para a mesma lógica do AuthContext:
```typescript
const totalBizDays = order.tipoExtra === 'cinto' ? 5 : order.tipoExtra ? 1 : 15;
```

**Linha 281:** Remover o texto condicional sobre laser:
```typescript
// De:
(prazo: {totalBizDays} dias úteis{order.temLaser ? ' — com laser' : ''})
// Para:
(prazo: {totalBizDays} dias úteis)
```

| Arquivo | Alteração |
|---|---|
| `src/pages/OrderDetailPage.tsx` | Corrigir cálculo do prazo (linha 71) e remover menção a laser (linha 281) |

