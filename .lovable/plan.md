## Plano: Cor "Whisky" + status "Cancelado" com motivo obrigatório

### 1. Adicionar cor "Whisky" na lista de cores de couro
Arquivo: `src/lib/orderFieldsConfig.ts` — incluir `'Whisky'` no array `CORES_COURO`. Isso faz a cor aparecer automaticamente em todos os formulários que já usam essa lista (OrderPage, EditOrderPage, ExtrasPage, EditExtrasPage, BeltOrderPage).

### 2. Adicionar status "Cancelado" para os três tipos de produto
Arquivo: `src/contexts/AuthContext.tsx` — incluir `"Cancelado"` ao final dos arrays:
- `PRODUCTION_STATUSES` (botas — admin)
- `PRODUCTION_STATUSES_USER` (botas — revendedor)
- `EXTRAS_STATUSES` (extras)
- `BELT_STATUSES` (cintos)

Também incluir nas listas de filtros: `src/pages/Index.tsx` e `src/pages/ProfilePage.tsx`.

### 3. Tornar a observação OBRIGATÓRIA quando o status escolhido for "Cancelado"
Arquivo: `src/pages/ReportsPage.tsx` (modal "Mudar Progresso de Produção"):

- Quando `selectedProgress === 'Cancelado'`:
  - Mudar o label do textarea para **"Motivo do cancelamento *"** (vermelho/destaque)
  - Trocar o placeholder para `"Ex: cliente desistiu, pagamento não confirmado, erro no pedido..."`
  - Em `handleBulkProgressUpdate`, validar: se status é "Cancelado" e `progressObservacao.trim()` está vazio → `toast.error('Informe o motivo do cancelamento.')` e não prosseguir.

### 4. Aplicar a mesma regra ao modal de mudança de status individual
O `OrderDetailPage` também movimenta status (via seleção em massa de produção). Verificar e aplicar a mesma validação onde houver mudança individual de status para "Cancelado".

### 5. Estilo visual do badge "Cancelado"
Onde o status é exibido como badge colorido (`OrderDetailPage`, `TrackOrderPage`, listagens), adicionar a entrada `'Cancelado': 'bg-red-100 text-red-800'` para destacar visualmente.

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/lib/orderFieldsConfig.ts` | Adicionar `'Whisky'` em `CORES_COURO` |
| `src/contexts/AuthContext.tsx` | Adicionar `"Cancelado"` em todos os arrays de status |
| `src/pages/Index.tsx` | Adicionar `'Cancelado'` no filtro de status |
| `src/pages/ProfilePage.tsx` | Adicionar `'Cancelado'` no filtro de status |
| `src/pages/ReportsPage.tsx` | Validar motivo obrigatório + label dinâmico no modal |
| `src/pages/OrderDetailPage.tsx` | Cor do badge `Cancelado` (vermelho) + validação se houver mudança individual |
| `src/pages/TrackOrderPage.tsx` | Cor do badge `Cancelado` (vermelho) |

### Resultado esperado
- A cor **Whisky** aparece em todos os campos de cor de couro (botas, extras, cintos).
- O status **Cancelado** fica disponível em qualquer pedido (bota, extras, cinto).
- Ao mover um pedido para "Cancelado", o sistema **exige** que o usuário escreva o motivo antes de confirmar, ficando registrado no histórico do pedido com data/hora/autor.
- O badge "Cancelado" aparece em vermelho para identificação rápida nas listagens.
