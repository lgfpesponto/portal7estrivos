

## Plano: Relatórios Especializados para Extras/Cintos + Melhorias visuais de PDF

### Escopo

4 blocos de mudanças em 2 arquivos principais:

---

### 1. Novo tipo de relatório: `extras_cintos` no SpecializedReports

**`src/components/SpecializedReports.tsx`**

- Adicionar `'extras_cintos'` ao `ReportType` union e `REPORT_LABELS`
- Novo estado: `filterTipoProduto` (cinto, kit_faca, kit_canivete, desmanchar, etc.), `filterCampos` (campos selecionáveis do produto), ambos com Select/Checkbox UI
- Ao selecionar produto, exibir checkboxes com os campos relevantes daquele produto (usar mapa `PRODUCT_GROUPABLE_FIELDS`):
  - kit_faca/kit_canivete: `tipoCouro`, `corCouro`, `vaiCanivete`
  - desmanchar: `qualSola`, `trocaGaspea`
  - cinto: `tamanhoCinto`, `bordadoP`, `nomeBordado`, `carimbo`
  - tiras_laterais: `corTiras`
  - gravata_country: `corTira`, `tipoMetal`
  - etc.
- `generateExtrasCintosPDF()`: filtra `sourceOrders` por `tipoExtra === filterTipoProduto`, agrupa por combinação dos campos selecionados, soma quantidade, gera PDF tabular com:
  - Cabeçalho: nome do produto
  - Tabela: colunas = campos selecionados + "Qtd Total"
  - Linhas = cada combinação única com soma
- Validar que pedidos tenham dados preenchidos antes de agrupar

---

### 2. Melhoria visual dos PDFs existentes (tabular com bordas)

**`src/components/SpecializedReports.tsx`**

Reformatar os PDFs de **Escalação**, **Forro**, **Pesponto** e **Bordados** para usar layout tabular com:
- `doc.rect()` para bordas de cada linha
- `doc.line()` para separadores verticais entre colunas
- Cabeçalho com fundo cinza (`setFillColor`)
- Alinhamento consistente (igual ao padrão já usado em Expedição/Cobrança)

Os relatórios de Expedição e Cobrança já estão tabulares, não precisam de mudança.

---

### 3. Adicionar relatórios especializados no dropdown "GERAR RELATÓRIO" da ReportsPage

**`src/pages/ReportsPage.tsx`** (linhas ~848-863, dropdown `showReportOptions`)

- Para **admin**: adicionar botão "Relatórios Especializados" que renderiza o componente `SpecializedReports` inline (ou navega para seção) com os relatórios `['escalacao', 'forro', 'pesponto', 'bordados', 'expedicao', 'cobranca', 'extras_cintos']`
- Para **revendedor**: manter apenas "Relatório por Filtros" no dropdown. Adicionar "Expedição" e "Cobrança" como opções (filtrados pelos pedidos do revendedor). **NÃO** mostrar relatórios especializados (extras_cintos, escalação, etc.)

Implementação: renderizar `<SpecializedReports>` abaixo dos filtros na ReportsPage, passando os relatórios corretos por perfil:
- Admin: `['escalacao', 'forro', 'pesponto', 'bordados', 'expedicao', 'cobranca', 'extras_cintos']`
- Revendedor: `['expedicao', 'cobranca']`

---

### 4. Mapa de campos agrupáveis por produto

Constante no `SpecializedReports.tsx`:

```typescript
const PRODUCT_GROUPABLE_FIELDS: Record<string, { key: string; label: string }[]> = {
  cinto: [
    { key: 'tamanhoCinto', label: 'Tamanho' },
    { key: 'bordadoP', label: 'Bordado P' },
    { key: 'nomeBordado', label: 'Nome Bordado' },
    { key: 'carimbo', label: 'Carimbo' },
  ],
  kit_faca: [
    { key: 'tipoCouro', label: 'Tipo de Couro' },
    { key: 'corCouro', label: 'Cor do Couro' },
    { key: 'vaiCanivete', label: 'Vai a Faca' },
  ],
  kit_canivete: [
    { key: 'tipoCouro', label: 'Tipo de Couro' },
    { key: 'corCouro', label: 'Cor do Couro' },
    { key: 'vaiCanivete', label: 'Vai o Canivete' },
  ],
  desmanchar: [
    { key: 'qualSola', label: 'Sola' },
    { key: 'trocaGaspea', label: 'Troca Gáspea' },
  ],
  // ... demais produtos
};
```

---

### Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/components/SpecializedReports.tsx` | Novo relatório `extras_cintos` com filtro por produto + campos + agrupamento; melhoria visual tabular nos PDFs de Escalação, Forro, Pesponto e Bordados |
| `src/pages/ReportsPage.tsx` | Adicionar `<SpecializedReports>` na página com relatórios corretos por perfil (admin vs revendedor) |

