

## Plano: Corrigir detalhes de extras + compactar filtro de produto

### Problema 1 — Detalhes do pedido mostrando campos irrelevantes

O `handleSubmit` em `ExtrasPage.tsx` salva `{ ...form }` (todas as 20+ keys do formulário) em `extraDetalhes`, mesmo que o produto use apenas 2-3 campos. Campos como `quantidade: '1'`, `qtdStrass: '1'` não são "vazios" então passam pelo filtro `isExtraValueEmpty`.

**Solução**: Em `handleSubmit`, filtrar `detalhes` para incluir apenas as keys relevantes ao produto específico, usando um mapa de campos por produto.

Arquivo: `src/pages/ExtrasPage.tsx`

```typescript
const PRODUCT_FIELDS: Record<string, string[]> = {
  tiras_laterais: ['corTiras'],
  desmanchar: ['qualSola', 'trocaGaspea'],
  kit_canivete: ['tipoCouro', 'corCouro', 'vaiCanivete'],
  kit_faca: ['tipoCouro', 'corCouro', 'vaiCanivete'],
  carimbo_fogo: ['qtdCarimbos', 'descCarimbos', 'ondeAplicado'],
  revitalizador: ['tipoRevitalizador', 'quantidade'],
  kit_revitalizador: ['tipoRevitalizador', 'quantidade'],
  gravata_country: ['corTira', 'tipoMetal', 'corBridao'],
  adicionar_metais: ['metaisSelecionados', 'qtdStrass'],
  chaveiro_carimbo: ['tipoCouro', 'corCouro', 'descCarimbos'],
  bainha_cartao: ['tipoCouro', 'corCouro'],
  regata: ['corRegata', 'descBordadoRegata'],
  bota_pronta_entrega: ['descricaoProduto', 'valorManual'],
};
```

No `handleSubmit`, substituir `const detalhes = { ...form }` por:
```typescript
const relevantKeys = PRODUCT_FIELDS[productId] || [];
const detalhes: Record<string, any> = {};
for (const key of relevantKeys) {
  if (form[key] !== undefined && form[key] !== '') detalhes[key] = form[key];
}
```

### Problema 2 — Filtro de produto ocupando muito espaço

Atualmente são 14 botões expostos em `flex-wrap`. Substituir por um `Popover` com checkboxes.

Arquivo: `src/pages/ReportsPage.tsx` (linhas 629-648)

Substituir o bloco de botões por:
- Um botão/trigger que mostra "Produto: X selecionados"
- Um Popover com lista de checkboxes (Bota + cada extra)
- Botões "Todos" / "Nenhum" para conveniência

Usar os componentes `Popover` e `Checkbox` já existentes no projeto.

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/ExtrasPage.tsx` | Salvar apenas campos relevantes ao produto em `extraDetalhes` |
| `src/pages/ReportsPage.tsx` | Trocar botões expostos por Popover com checkboxes |

