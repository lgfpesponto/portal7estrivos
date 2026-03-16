

## Plano: Box nas categorias + Stub 3 redesenhado

### 1. Box de destaque nos títulos de categoria

Na função `renderCats`, antes de renderizar o título de cada categoria, desenhar um retângulo preenchido (fundo cinza claro `#e8e8e8`) atrás do título:

```
doc.setFillColor(232, 232, 232);
doc.rect(startX - 1, cy - 3.5, colWidth, 5, 'F');
```

Depois renderizar o título bold por cima. Isso destaca visualmente a categoria das subcategorias.

### 2. Stub 3 redesenhado — layout equilibrado

Substituir o stub 3 atual (linhas 472-490) por um layout mais limpo:

```text
┌────────────────────────────────┐
│  39  borracha quadrado preta   │
│  FORMA: 250001                 │
│  [||||||||||||||||||||||||]     │
│  250001                        │
└────────────────────────────────┘
```

Lógica:
- **Linha 1:** Tamanho + info da sola completa numa linha só (sem labels "SOLA:", "BICO:", "COR:") → `"39  borracha quadrado preta"` ou com vira: `"39  borracha quadrado preta vira bege"`
- **Linha 2:** `FORMA: {orderNumClean}` em bold
- **Linha 3-4:** Barcode + número do pedido centralizado
- Fonte 8pt para as informações, 9pt bold para o número
- Tudo centralizado verticalmente no espaço do stub

### Alterações em `src/pages/ReportsPage.tsx`

**Linhas 390-429 (renderCats):** Adicionar `doc.setFillColor + doc.rect` antes de cada título de categoria.

**Linhas 472-490 (Stub 3):** Reescrever:
1. Combinar tamanho + solado + formatoBico + corSola + corVira em uma string única
2. Renderizar centrado ou alinhado à esquerda com margem
3. FORMA: em bold
4. Barcode + número abaixo

