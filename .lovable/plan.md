

## Plano: Correções de cintos — rascunhos, status, prazos, alertas e PDF

### 1. Corrigir rascunho de cintos

**`src/pages/DraftsPage.tsx`** — No `handleEdit`, detectar rascunhos de cinto (`draft.id.startsWith('draft-belt-')`) e navegar para `/pedido-cinto` em vez de `/pedido`.

**`src/pages/BeltOrderPage.tsx`** — Ler `location.state.draft` e pré-popular os campos do formulário (vendedor, tamanho, couro, bordados, carimbo, observação, foto, número do pedido). Ao salvar, deletar o rascunho anterior.

### 2. Status de produção específicos para cintos

**`src/contexts/AuthContext.tsx`** — Adicionar:
```typescript
export const BELT_STATUSES = [
  "Em aberto", "Corte", "Bordado", "Pesponto",
  "Expedição", "Entregue", "Cobrado", "Pago"
];
```

**`src/pages/ReportsPage.tsx`** (linha ~948-950) — Na lógica de seleção de status no modal de progresso, detectar cintos (`tipoExtra === 'cinto'`) e usar `BELT_STATUSES`. Lógica: se só cintos → `BELT_STATUSES`, se só extras (não-cinto) → `EXTRAS_STATUSES`, se só botas → `PRODUCTION_STATUSES`, se mistura → union de todos.

### 3. Prazo de produção: 5 dias para cintos, 1 dia para extras

**`src/contexts/AuthContext.tsx`** (linha ~331) — No `addOrder`, ajustar `totalBizDays`:
- `tipoExtra === 'cinto'` → 5
- `tipoExtra` existe (outros extras) → 1
- Senão (bota) → lógica atual (10 ou 30)

### 4. Mostrar prazo em cintos e extras

**`src/pages/ReportsPage.tsx`** (linha ~906) — Remover condição `!order.tipoExtra` que esconde o countdown.

**`src/pages/OrderDetailPage.tsx`** (linha ~46-47, ~167) — Ajustar `totalBizDays` para considerar `tipoExtra`: cinto=5, extras=1, botas=10/30. Remover condição `!order.tipoExtra` que esconde seção de dias restantes.

**`src/pages/TrackOrderPage.tsx`** (linha ~60) — Remover condição `!order.tipoExtra`.

### 5. Incluir cintos e extras nos alertas

**`src/pages/Index.tsx`** (linha ~168) — Remover `if (o.tipoExtra) return false;` para que cintos e extras entrem nos alertas de prazo.

### 6. Ficha de produção impressa: remover valor do tamanho

**`src/pages/BeltOrderPage.tsx`** (linha ~106) — Alterar `tamanhoCinto` para salvar apenas o tamanho sem o preço:
```typescript
// De:
tamanhoCinto: `${tamanho} (${formatCurrency(tamanhoPreco)})`,
// Para:
tamanhoCinto: tamanho,
```

Isso garante que a ficha PDF (que lê `det.tamanhoCinto`) mostre apenas "1,10 cm" sem valor.

---

### Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/contexts/AuthContext.tsx` | `BELT_STATUSES` + `totalBizDays` condicional |
| `src/pages/DraftsPage.tsx` | Redirecionar rascunhos belt para `/pedido-cinto` |
| `src/pages/BeltOrderPage.tsx` | Carregar rascunho + remover preço do `tamanhoCinto` |
| `src/pages/ReportsPage.tsx` | `BELT_STATUSES` no modal + mostrar prazo para todos |
| `src/pages/OrderDetailPage.tsx` | `totalBizDays` condicional + mostrar prazo para todos |
| `src/pages/TrackOrderPage.tsx` | Mostrar prazo para todos |
| `src/pages/Index.tsx` | Incluir cintos/extras nos alertas |

