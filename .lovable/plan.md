

## Plano: Filtrar apenas pedidos de bota nos relatórios Escalação e Forro

### Problema

Os relatórios de Escalação e Forro incluem pedidos de extras (`tipoExtra` preenchido) e cintos (`tipoExtra === 'cinto'`), quando deveriam puxar apenas pedidos de bota (ficha de produção padrão).

### Solução

**Arquivo:** `src/components/SpecializedReports.tsx`

Adicionar `!o.tipoExtra` ao filtro de ambos os relatórios para excluir extras e cintos:

**Escalação (linha 284):**
```typescript
const filtered = sourceOrders.filter(o =>
  o.status.toLowerCase() === 'pespontando' &&
  !o.tipoExtra &&
  o.solado && o.solado !== '' && o.solado !== '-'
);
```

**Forro (linha 334):**
```typescript
const filtered = sourceOrders.filter(o =>
  (filterProgresso === 'todos' || o.status === filterProgresso) &&
  !o.tipoExtra &&
  o.modelo && o.modelo !== '' && o.modelo !== '-'
);
```

| Arquivo | Alteração |
|---|---|
| `src/components/SpecializedReports.tsx` | Adicionar `!o.tipoExtra` nos filtros de Escalação e Forro |

