

## Plano: Novas variações, vinculação tamanho-modelo e regra da vira

### 1. Novas opções em `src/lib/orderFieldsConfig.ts`

**Modelos:** Adicionar 3 entradas ao array `MODELOS`:
- `{ label: 'Tradicional Bico Fino', preco: 260 }`
- `{ label: 'Cano Médio Infantil', preco: 160 }`
- `{ label: 'City', preco: 270 }`

**Solado:** Adicionar ao array `SOLADO`:
- `{ label: 'PVC', preco: 0 }`
- `{ label: 'Borracha City', preco: 0 }`

**Formato do bico:** Adicionar ao array `FORMATO_BICO`:
- `'Fino Agulha Ponta Quadrada'`
- `'Fino Agulha Ponta Redonda'`

**Cor da sola:** Adicionar `{ label: 'Off White', preco: 0 }` (preço 0, ajustar se necessário)

**Cor da vira:** Adicionar `{ label: 'Neutra', preco: 0 }`

---

### 2. Vinculação tamanho → modelo

Criar em `orderFieldsConfig.ts` uma função exportada `getModelosForTamanho(tamanho: string)` que retorna os modelos permitidos:

- **24-33:** Bota Infantil, Botina Infantil, Cano Médio Infantil
- **34-45:** Bota Tradicional, Bota Feminino, Bota Peão, Bota Montaria (só até 40), Coturno, Destroyer, Capota, Bota Ouver Perfilado, Capota Bico Fino Perfilado, Cano Médio, Botina, Urbano, Bota Bico Fino Perfilado, Tradicional Bico Fino
- **33-40:** Bota Bico Fino Feminino, Capota Bico Fino
- **34-40:** City

Retorna os `MODELOS` filtrados. Se tamanho vazio, retorna todos.

**Em `OrderPage.tsx` e `EditOrderPage.tsx`:**
- Importar `getModelosForTamanho`
- Usar `getModelosForTamanho(tamanho)` no select de Modelo em vez de `MODELOS`
- Quando `tamanho` mudar: se o modelo selecionado não estiver mais nos permitidos, limpar o campo modelo

---

### 3. Regra da cor da vira (ocultar Bege/Neutra)

Criar helper: `const VIRA_HIDDEN = ['Bege', 'Neutra']` — cores que NÃO devem aparecer na descrição/impressão.

**`OrderDetailPage.tsx` (descrição do pedido):** Na linha 89, filtrar: só mostrar `Cor da Vira` se `!VIRA_HIDDEN.includes(order.corVira)`

**`ReportsPage.tsx` (ficha de produção impressa):**
- Linha 320 (categorias SOLADOS): só adicionar campo Vira se `!VIRA_HIDDEN.includes(order.corVira)`
- Linha 481 (stub 3 canhoto): só adicionar `vira X` se `!VIRA_HIDDEN.includes(order.corVira)`

**`SpecializedReports.tsx` (PDF cobrança):** Mesmo filtro na composição.

---

### 4. Abreviação "Fino Agulha" no canhoto

No stub 3 (`ReportsPage.tsx` linha 479), o `.replace(/\bfino\b/gi, 'BF')` já cobre "Fino Agulha" → "BF Agulha". Funciona automaticamente.

---

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/lib/orderFieldsConfig.ts` | Novos modelos, solados, bicos, cores + função `getModelosForTamanho` |
| `src/pages/OrderPage.tsx` | Filtrar modelos por tamanho, limpar modelo ao trocar tamanho |
| `src/pages/EditOrderPage.tsx` | Idem |
| `src/pages/OrderDetailPage.tsx` | Ocultar corVira Bege/Neutra na descrição |
| `src/pages/ReportsPage.tsx` | Ocultar corVira Bege/Neutra na ficha e canhoto |
| `src/components/SpecializedReports.tsx` | Ocultar corVira Bege/Neutra na composição da cobrança |

