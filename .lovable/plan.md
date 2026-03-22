

## Plano: Filtrar pedidos sem solado (Escalação) e sem modelo (Forro)

### Problema

1. **Escalação (linha 284):** Filtra apenas por status `'pespontando'`, mas inclui pedidos sem solado preenchido (campo vazio ou `"-"`).
2. **Forro (linha 334):** Filtra apenas por progresso, mas inclui pedidos sem modelo preenchido (campo vazio ou `"-"`).

### Solução

**Arquivo:** `src/components/SpecializedReports.tsx`

**Escalação (linha 284):** Adicionar verificação de solado:
```typescript
const filtered = sourceOrders.filter(o =>
  o.status.toLowerCase() === 'pespontando' &&
  o.solado && o.solado !== '' && o.solado !== '-'
);
```

**Forro (linha 334):** Adicionar verificação de modelo:
```typescript
const filtered = sourceOrders.filter(o => {
  if (filterProgresso !== 'todos' && o.status !== filterProgresso) return false;
  return o.modelo && o.modelo !== '' && o.modelo !== '-';
});
```

### Arquivo alterado

| Arquivo | Alteração |
|---|---|
| `src/components/SpecializedReports.tsx` | Adicionar filtro de solado no `generateEscalacaoPDF` e filtro de modelo no `generateForroPDF` |

