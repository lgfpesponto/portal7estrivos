

## Plano: Filtrar pedidos sem bordados/metais nos relatórios

### Problema

1. **Bordados**: Não há filtro para excluir pedidos sem bordado — linha 442 filtra apenas por progresso.
2. **Metais**: O filtro existe (linha 383) mas pode não estar funcionando corretamente se valores vazios `''` estão sendo tratados como preenchidos, ou se há valores como "Não" que são truthy.

### Solução

**Arquivo:** `src/components/SpecializedReports.tsx`

**Bordados (linha 442):** Adicionar filtro que verifica se o pedido tem pelo menos um campo de bordado preenchido:
```typescript
const filtered = sourceOrders.filter(o => {
  if (filterProgresso !== 'todos' && o.status !== filterProgresso) return false;
  const hasBordado = 
    (o.bordadoCano && o.bordadoCano !== '' && o.bordadoCano !== 'Não') ||
    (o.bordadoGaspea && o.bordadoGaspea !== '' && o.bordadoGaspea !== 'Não') ||
    (o.bordadoTaloneira && o.bordadoTaloneira !== '' && o.bordadoTaloneira !== 'Não') ||
    (o.nomeBordadoDesc && o.nomeBordadoDesc !== '') ||
    (o.personalizacaoNome && o.personalizacaoNome !== '' && o.personalizacaoNome !== 'Não') ||
    (o.personalizacaoBordado && o.personalizacaoBordado !== '' && o.personalizacaoBordado !== 'Não');
  return !!hasBordado;
});
```

**Metais (linha 383):** Reforçar o filtro garantindo que strings vazias e "Não" sejam excluídas:
```typescript
const hasMetals = 
  (o.metais && o.metais !== '' && o.metais !== 'Não') ||
  (o.tipoMetal && o.tipoMetal !== '') ||
  (o.corMetal && o.corMetal !== '') ||
  (o.strassQtd && o.strassQtd > 0) ||
  (o.cruzMetalQtd && o.cruzMetalQtd > 0) ||
  (o.bridaoMetalQtd && o.bridaoMetalQtd > 0);
```

### Arquivo alterado

| Arquivo | Alteração |
|---|---|
| `src/components/SpecializedReports.tsx` | Adicionar filtro de bordado no `generateBordadosPDF` e reforçar filtro de metais no `generatePespontoPDF` |

