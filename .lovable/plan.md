

## Plano: Adicionar ícone de edição (lápis) na página de detalhes do pedido para ADMs

### Alteração

**Arquivo:** `src/pages/OrderDetailPage.tsx`

Na linha 196, ao lado do número do pedido (`order.numero`), adicionar um botão com ícone `Pencil` do lucide-react que navega para `/pedido/${order.id}/editar`. Visível apenas para admin (`isAdmin`).

```tsx
// Linha 194-198 atual:
<div className="flex items-center gap-3">
  <h1 className="text-2xl font-display font-bold">{order.numero}</h1>
  {isAdmin && <span className="text-sm text-muted-foreground">— {order.vendedor}</span>}
</div>

// Novo:
<div className="flex items-center gap-3">
  <h1 className="text-2xl font-display font-bold">{order.numero}</h1>
  {isAdmin && (
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/pedido/${order.id}/editar`)}>
      <Pencil size={16} />
    </Button>
  )}
  {isAdmin && <span className="text-sm text-muted-foreground">— {order.vendedor}</span>}
</div>
```

Adicionar `Pencil` ao import de lucide-react (linha 5).

| Arquivo | Alteração |
|---|---|
| `src/pages/OrderDetailPage.tsx` | Import `Pencil` + botão de edição ao lado do número do pedido, visível apenas para admin |

