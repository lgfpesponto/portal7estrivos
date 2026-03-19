

## Plano: Página EXTRAS — Catálogo de produtos adicionais com pedidos integrados

Este é um recurso grande. Para manter qualidade e evitar erros, vou dividir a implementação em **3 fases** (cada uma será um message separado após aprovação).

---

### Fase 1 — Infraestrutura + Página EXTRAS com formulários

**1.1. Estender o Order interface (`AuthContext.tsx`)**

Adicionar campos opcionais ao `Order`:
```typescript
tipoExtra?: string;           // 'tiras_laterais' | 'desmanchar' | 'kit_canivete' | etc.
extraDetalhes?: Record<string, any>; // campos específicos do extra
numeroPedidoBota?: string;    // referência ao pedido da bota
```

Adicionar status de produção específico para extras:
```typescript
export const EXTRAS_STATUSES = ['Em aberto', 'Produzindo', 'Expedição', 'Entregue', 'Cobrado', 'Pago'];
```

No `updateOrderStatus`, usar `EXTRAS_STATUSES` quando `order.tipoExtra` existir.

**1.2. Criar página `src/pages/ExtrasPage.tsx`**

Catálogo visual com cards para cada produto:
- Tiras Laterais (R$15)
- Desmanchar (R$65+)
- Kit Canivete (R$30+)
- Kit Faca (R$35+)
- Carimbo a Fogo (R$20+)
- Revitalizador Unidade (R$10)
- Kit 2 Revitalizador (R$26)
- Gravata Country (R$30)
- Adicionar Metais (variável)
- Chaveiro c/ Carimbo (R$50)
- Bainha de Cartão (R$15)
- Regata (variável)

Cada card tem botão "Comprar" que abre um Dialog/modal com formulário específico.

**1.3. Formulários de cada produto**

Cada modal terá os campos definidos na spec, com cálculo automático de valor. Ao submeter, chama `addOrder` com:
- `modelo`: nome do extra (ex: "Extra — Tiras Laterais")
- `tipoExtra`: identificador
- `extraDetalhes`: campos específicos serializados
- `preco`: calculado
- Campos obrigatórios de bota preenchidos com valores default ("-")
- `temLaser: false`, `quantidade: 1`

**1.4. Rota + navegação**

- Adicionar rota `/extras` no `App.tsx`
- Adicionar "EXTRAS" no Header nav (entre FAÇA SEU PEDIDO e MEUS PEDIDOS)

---

### Fase 2 — Integração com Meus Pedidos e Relatórios

**2.1. Filtro "Produto" em `ReportsPage.tsx`**

Adicionar filtro multi-select com opções: Bota, Extras.
- Bota = pedidos sem `tipoExtra`
- Extras = pedidos com `tipoExtra`
- Default: ambos selecionados

**2.2. Status de produção para extras**

No modal de progresso em lote e na visualização de status, usar `EXTRAS_STATUSES` quando o pedido tiver `tipoExtra`.

**2.3. Relatórios de expedição e cobrança (`SpecializedReports.tsx`)**

Pedidos extras com status "Expedição"/"Entregue" devem aparecer nos relatórios. Na composição, mostrar os detalhes do extra em vez dos campos de bota.

**2.4. Permissões admin**

- Juliana: pode editar, apagar, aplicar desconto (já funciona via `isAdmin && !isFernanda`)
- Fernanda: pode editar, apagar (já funciona via `isAdmin`)

---

### Fase 3 — Scanner de código de barras na visualização + Melhorias nos relatórios

**3.1. Botão scanner na `OrderDetailPage.tsx`**

Adicionar botão "Escanear outro pedido" fora do card principal. Ao escanear, navegar para o pedido correspondente.

**3.2. Melhorias visuais nos PDFs**

Nos relatórios de Forro, Escalação, Pesponto e Bordados (`SpecializedReports.tsx`), adicionar linhas divisórias entre pedidos e melhorar organização visual (bordas de tabela, espaçamento).

---

### Arquivos alterados (todas as fases)

| Arquivo | Mudança |
|---------|---------|
| `src/contexts/AuthContext.tsx` | `tipoExtra`, `extraDetalhes`, `numeroPedidoBota` no Order + `EXTRAS_STATUSES` |
| `src/pages/ExtrasPage.tsx` | **NOVO** — catálogo + formulários |
| `src/App.tsx` | Rota `/extras` |
| `src/components/Header.tsx` | Link "EXTRAS" na nav |
| `src/pages/ReportsPage.tsx` | Filtro Produto (Bota/Extras) + status extras |
| `src/pages/OrderDetailPage.tsx` | Exibir detalhes de extras + botão scanner |
| `src/components/SpecializedReports.tsx` | Incluir extras nos relatórios + melhorias visuais |

---

### Implementação

Vou começar pela **Fase 1** completa neste message. As fases 2 e 3 serão implementadas em seguida.

