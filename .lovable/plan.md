

## Plano: Vinculação dinâmica Modelo → Solado → Bico → Cor Sola → Cor Vira + Forma automática

### Visão geral

Criar um sistema de cascata onde a seleção do modelo determina automaticamente quais opções ficam disponíveis nos campos seguintes (solado, bico, cor da sola, cor da vira), e a "Forma" é calculada automaticamente e exibida apenas na ficha impressa (canhoto 3).

---

### 1. Configuração em `src/lib/orderFieldsConfig.ts`

Criar uma estrutura de blocos de vinculação e funções helper:

```typescript
// Blocos de vinculação
type ModelBlock = 'infantil' | 'city' | 'tradicional' | 'bicoFinoFeminino' | 'perfilado';

function getBlockForModelo(modelo: string): ModelBlock | null { ... }

// Funções exportadas:
getsoladosForModelo(modelo) → SOLADO[] filtrado
getBicosForModelo(modelo, solado) → FORMATO_BICO[] filtrado
getCorSolaForModelo(modelo, solado, formatoBico) → COR_SOLA[] filtrado (ou null = ocultar)
getCorViraForModelo(modelo, solado) → COR_VIRA[] filtrado
getFormaForModelo(modelo, formatoBico) → string (número da forma)
```

**Regras por bloco:**

| Bloco | Solados | Bicos | Cor Sola | Cor Vira | Forma |
|-------|---------|-------|----------|----------|-------|
| Infantil | Infantil | Quadrado | ocultar | Bege (auto) | 1652 |
| City | Borracha City | Fino Ponta Redonda | Preto (auto) | Neutra (auto) | 13446 |
| Tradicional | Borracha, Couro Reta/Carrapeta/Carrapeta Espora, Jump, Rústica | Quadrado, Redondo | ver sub-regras | ver sub-regras | 2300 (ou 7576 se Redondo) |
| BF Feminino | PVC, Couro Reta | Fino Ponta Redonda | ver sub-regras | Neutra (auto) | 6761 |
| Perfilado | PVC, Couro Reta | PVC→Fino Agulha PQ; Couro→Fino Agulha PQ/PR | ver sub-regras | Neutra (auto) | 4394 |

**Sub-regras Tradicional:**
- Bico Redondo → excluir Jump e Rústica dos solados
- Cor sola Borracha: Marrom/Preto/Branco; se bico Redondo: só Preto/Branco
- Cor sola Couro*: Madeira/Avermelhada/Pintada de Preto
- Cor sola Jump: ocultar campo
- Cor sola Rústica: apenas Madeira
- Cor vira Borracha: Bege/Rosa/Preto; outros solados: Neutra (auto)

**Sub-regras BF Feminino:** Cor sola PVC: Preto/Off White/Marrom (preço 0); Couro Reta: Madeira/Avermelhada/Pintada de Preto

**Sub-regras Perfilado:** Cor sola PVC: apenas Marrom; Couro Reta: Madeira/Avermelhada/Pintada de Preto

---

### 2. Interface dinâmica em `OrderPage.tsx` e `EditOrderPage.tsx`

Na seção "Solados", substituir os selects estáticos por selects filtrados:

```
Modelo muda → recalcular solados disponíveis → limpar solado se inválido
Solado muda → recalcular bicos disponíveis → limpar bico se inválido
Bico muda → recalcular cores sola → limpar cor sola se inválida
```

- Se `getCorSolaForModelo` retorna `null` → ocultar o campo Cor da Sola
- Se a lista de Cor da Vira tem 1 item → auto-selecionar e ocultar o campo
- Se a lista de Bico tem 1 item → auto-selecionar e desabilitar
- Se a lista de Solado tem 1 item → auto-selecionar e desabilitar

O campo "Forma" NÃO aparece no formulário. O valor é calculado no submit via `getFormaForModelo(modelo, formatoBico)` e salvo no pedido.

---

### 3. Order interface em `AuthContext.tsx`

Adicionar `forma?: string` ao `interface Order`.

No submit de `OrderPage` e `EditOrderPage`, calcular e incluir `forma` no objeto do pedido.

---

### 4. Ficha impressa em `ReportsPage.tsx` (canhoto 3)

Atualizar stub 3 para exibir a forma:

```
34 couro madeira | forma: 2300
BF ponta quadrada | pedido: 7E-001
[código de barras]
```

Linha 1: `{tamanho} {solado} {corSola} | forma: {forma}`
Linha 2: `{formatoBico (com BF)} | pedido: {numero}`
Linha 3: barcode centralizado

Substituir a linha `FORMA: ${orderNumClean}` atual pela forma real do pedido.

---

### 5. Garantir que a forma NÃO aparece na descrição do pedido

Em `OrderDetailPage.tsx` — não exibir o campo `forma`.
Nas composições/relatórios — não incluir `forma`.

---

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/lib/orderFieldsConfig.ts` | Funções de vinculação cascata + forma |
| `src/pages/OrderPage.tsx` | Selects dinâmicos com cascata + calcular forma no submit |
| `src/pages/EditOrderPage.tsx` | Idem |
| `src/contexts/AuthContext.tsx` | `forma?: string` no Order |
| `src/pages/ReportsPage.tsx` | Canhoto 3 com forma real e layout atualizado |

