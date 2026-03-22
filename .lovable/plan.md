

## Plano: Corrigir filtro de bordados e metais nos relatórios

### Problema

Os campos de bordado e metais usam `"-"` como valor padrão (sem preenchimento), mas os filtros só verificam `""` e `"Não"`. Pedidos com valor `"-"` passam pelo filtro indevidamente.

### Solução

**Arquivo:** `src/components/SpecializedReports.tsx`

Adicionar `'-'` às verificações em ambos os filtros:

**Bordados (linha ~444):** Cada campo precisa excluir `'-'`:
```typescript
const hasBordado =
  (o.bordadoCano && o.bordadoCano !== '' && o.bordadoCano !== 'Não' && o.bordadoCano !== '-') ||
  (o.bordadoGaspea && o.bordadoGaspea !== '' && o.bordadoGaspea !== 'Não' && o.bordadoGaspea !== '-') ||
  (o.bordadoTaloneira && o.bordadoTaloneira !== '' && o.bordadoTaloneira !== 'Não' && o.bordadoTaloneira !== '-') ||
  (o.nomeBordadoDesc && o.nomeBordadoDesc !== '' && o.nomeBordadoDesc !== '-') ||
  (o.personalizacaoNome && o.personalizacaoNome !== '' && o.personalizacaoNome !== 'Não' && o.personalizacaoNome !== '-') ||
  (o.personalizacaoBordado && o.personalizacaoBordado !== '' && o.personalizacaoBordado !== 'Não' && o.personalizacaoBordado !== '-');
```

**Metais (linha ~383):** Mesma correção:
```typescript
const hasMetals =
  (o.metais && o.metais !== '' && o.metais !== 'Não' && o.metais !== '-') ||
  (o.tipoMetal && o.tipoMetal !== '' && o.tipoMetal !== '-') ||
  (o.corMetal && o.corMetal !== '' && o.corMetal !== '-') ||
  (o.strassQtd && o.strassQtd > 0) ||
  (o.cruzMetalQtd && o.cruzMetalQtd > 0) ||
  (o.bridaoMetalQtd && o.bridaoMetalQtd > 0);
```

### Arquivo alterado

| Arquivo | Alteração |
|---|---|
| `src/components/SpecializedReports.tsx` | Adicionar `'-'` aos filtros de bordado e metais |

