

## Plano: Botão de Scanner na Página de Detalhes + Correção de Código de Barras Borrado

### 1. Botão "Escanear Código de Barras" na OrderDetailPage

**Arquivo:** `src/pages/OrderDetailPage.tsx`

Adicionar ao lado do botão "Voltar" (linha 150), fora do card:
- Importar `ScanBarcode` do lucide-react, `useRef`, `useEffect`, `useCallback`
- Importar `orderBarcodeValue` do AuthContext
- Estado: `showScanner`, `scanValue`, ref `scanInputRef`
- Reutilizar a mesma lógica de scan que já existe em `ReportsPage.tsx` (linhas 130-158): ao detectar código, navegar para `/pedido/:id` do pedido encontrado
- Layout: linha flex com "Voltar" à esquerda e botão "Escanear" à direita, ambos fora do card

```tsx
<div className="flex items-center justify-between mb-4">
  <button onClick={() => navigate(-1)} className="...">
    <ArrowLeft size={16} /> Voltar
  </button>
  <Button variant="outline" size="sm" onClick={() => setShowScanner(!showScanner)}>
    <ScanBarcode size={16} /> Escanear
  </Button>
</div>
{showScanner && (
  <input ref={scanInputRef} value={scanValue} onChange={...} onKeyDown={handleScanEnter} placeholder="Escaneie..." className="..." autoFocus />
)}
```

Ao escanear e encontrar o pedido, navegar diretamente com `navigate('/pedido/' + match.id)` — sem voltar à lista.

---

### 2. Correção de Código de Barras Borrado nos PDFs

**Arquivos:** `src/pages/ReportsPage.tsx` e `src/components/SpecializedReports.tsx`

O problema é que `JsBarcode` gera canvas com `width: 1` (1 pixel por barra), resultando em imagem de baixa resolução que fica borrada ao ser redimensionada no PDF.

Correção na função `barcodeDataUrl` em ambos os arquivos:
- Aumentar `width` padrão de `1` para `2`
- Aumentar `height` padrão de `30` para `50`
- Nos locais que chamam `barcodeDataUrl` com `{ width: 1, height: 20 }` ou `{ width: 1.2, height: 28 }`, aumentar para `{ width: 2, height: 40 }` para gerar imagem com mais pixels

Isso garante que o canvas tenha resolução suficiente antes de ser convertido para PNG e inserido no PDF.

---

### Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/pages/OrderDetailPage.tsx` | Botão scanner ao lado do Voltar + lógica de scan com navegação direta |
| `src/pages/ReportsPage.tsx` | Aumentar resolução do barcode na função `barcodeDataUrl` e chamadas |
| `src/components/SpecializedReports.tsx` | Idem — aumentar resolução do barcode |

