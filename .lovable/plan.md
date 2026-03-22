

## Plano: Prazo de 15 dias úteis para botas + Remover progresso do histórico de alterações

### Alterações

**Arquivo:** `src/contexts/AuthContext.tsx`

#### 1. Prazo de produção para botas = 15 dias úteis (linha 568)

Atual:
```typescript
const totalBizDays = rest.tipoExtra === 'cinto' ? 5 : rest.tipoExtra ? 1 : rest.temLaser ? 30 : 10;
```

Novo:
```typescript
const totalBizDays = rest.tipoExtra === 'cinto' ? 5 : rest.tipoExtra ? 1 : 15;
```

Botas passam de 10 (ou 30 se laser) para **15 dias úteis** fixos, independente de laser ou bordado. Cintos e extras mantêm seus prazos.

#### 2. Remover registro de progresso no histórico de alterações (linhas 716-725)

No `updateOrderStatus`, remover a criação de `altEntry` e não adicionar ao `alteracoes`. O histórico de produção (`historico`) já registra mudanças de progresso.

Atual:
```typescript
const altEntry: OrderAlteracao = { data: dataHoje, hora: horaAgora, descricao: `Alterado progresso para ${newStatus}...` };
const updatedAlteracoes = [...(current.alteracoes || []), altEntry];
// ... update com alteracoes: updatedAlteracoes
```

Novo:
```typescript
// Sem altEntry — apenas atualiza historico e status
const { error } = await supabase.from('orders').update({
  status: newStatus,
  historico: updatedHistorico as any,
}).eq('id', id);
// updatedOrder sem modificar alteracoes
```

### Resumo

| Arquivo | Alteração |
|---|---|
| `src/contexts/AuthContext.tsx` | Prazo bota = 15 dias úteis; remover progresso do histórico de alterações |

