

## Plano: Nova Ficha de Produção — CINTOS

### Visão Geral

Criar um fluxo completo de pedidos de Cintos, paralelo ao de Botas e Extras, com ficha própria, cálculo automático de valor, impressão em PDF e integração nos filtros/listagem.

---

### 1. Tela de Seleção de Produto (antes do formulário)

**Arquivo:** `src/pages/OrderPage.tsx`

Ao entrar em `/pedido`, exibir uma tela inicial com duas opções: **Bota** e **Cinto**.
- Se selecionar **Bota** → mostrar o formulário atual (sem alterações)
- Se selecionar **Cinto** → redirecionar para `/pedido-cinto`

Implementar via estado `productChoice` no início do componente. Quando `null`, mostrar a tela de seleção; quando `'bota'`, renderizar o formulário existente.

### 2. Nova Página: Ficha de Produção de Cintos

**Novo arquivo:** `src/pages/BeltOrderPage.tsx`
**Nova rota em:** `src/App.tsx` → `/pedido-cinto`

Formulário com os campos:

| Campo | Tipo | Regras |
|---|---|---|
| Vendedor | Auto-preenchido (read-only para revendedores, editável por admins) | Mesmo padrão de botas |
| Número do Pedido | Input texto obrigatório | Manual |
| Tamanho | Select com preço: `1,10cm → R$100`, `1,25cm → R$130`, `50cm → R$70`, `70cm → R$70` | Soma ao total |
| Tipo de couro | Select usando `TIPOS_COURO` de `orderFieldsConfig.ts` | Reutiliza dados existentes |
| Cor do couro | Select usando `CORES_COURO` de `orderFieldsConfig.ts` | Reutiliza dados existentes |
| Bordado P (R$10) | Toggle Tem/Não tem. Se Tem: campo descrição + campo cor | +R$10 |
| Nome Bordado (R$40) | Toggle Tem/Não tem. Se Tem: campo descrição + campo cor + campo fonte | +R$40 |
| Carimbo a fogo | Select: `1 a 3 → R$20`, `4 a 6 → R$40`. Se selecionado: campo descrição + onde aplicado | Soma valor |
| Quantidade | Fixo em 1, read-only | — |
| Observação | Textarea opcional | — |
| Link Foto | Input URL (padrão botas) | — |

Botões: **"Conferir e Finalizar Pedido"** (abre espelho) + **"Salvar Rascunho"**

Cálculo de valor em tempo real somando tamanho + bordado P + nome bordado + carimbo.

### 3. Integração no Sistema de Pedidos

**Arquivo:** `src/contexts/AuthContext.tsx`

O pedido de cinto será salvo como `Order` usando `tipoExtra: 'cinto'` para distinguir. Campos de bota não aplicáveis recebem `'-'` (mesmo padrão dos extras).

O `addOrder` já suporta `tipoExtra` e `extraDetalhes`, então não precisa de alteração no contexto.

### 4. Configuração de Produto

**Arquivo:** `src/lib/extrasConfig.ts`

Adicionar constante `BELT_PRODUCT` separada (não misturar com `EXTRA_PRODUCTS` que são acessórios avulsos):

```typescript
export const BELT_SIZES = [
  { label: '1,10 cm', preco: 100 },
  { label: '1,25 cm', preco: 130 },
  { label: '50 cm', preco: 70 },
  { label: '70 cm', preco: 70 },
];
export const BORDADO_P_PRECO = 10;
export const NOME_BORDADO_CINTO_PRECO = 40;
```

Adicionar labels para `EXTRA_DETAIL_LABELS` e `EXTRA_PRODUCT_NAME_MAP`:
```typescript
// Mapa de nome para cinto
cinto: 'Cinto'
```

### 5. Filtro de Produtos na Listagem

**Arquivo:** `src/pages/ReportsPage.tsx`

No popover de filtro de produto, adicionar **"Cinto"** como opção entre Bota e os Extras. Inicializar `filterProduto` com `'cinto'` incluído.

Na lógica de filtro, pedidos com `tipoExtra === 'cinto'` são filtrados pela checkbox "Cinto".

### 6. Listagem de Pedidos

**Arquivo:** `src/pages/ReportsPage.tsx` (linha ~763)

Já existe exibição do tipo de produto para extras: `EXTRA_PRODUCT_NAME_MAP[order.tipoExtra]`. Basta mapear `'cinto' → 'Cinto'` no `EXTRA_PRODUCT_NAME_MAP`.

### 7. Visualização do Pedido (Detalhes)

**Arquivo:** `src/pages/OrderDetailPage.tsx`

Pedidos de cinto usam `tipoExtra === 'cinto'`, então entram no fluxo de exibição de extras (mostra `extraDetalhes` com labels legíveis). Adicionar labels para campos do cinto em `EXTRA_DETAIL_LABELS`:
- `tamanhoCinto: 'Tamanho'`
- `tipoCouro: 'Tipo de Couro'`
- `corCouro: 'Cor do Couro'`
- `bordadoP: 'Bordado P'`
- `bordadoPDesc: 'Descrição Bordado P'`
- `bordadoPCor: 'Cor Bordado P'`
- `nomeBordado: 'Nome Bordado'`
- `nomeBordadoDesc: 'Descrição Nome Bordado'`
- `nomeBordadoCor: 'Cor Nome Bordado'`
- `nomeBordadoFonte: 'Fonte Nome Bordado'`
- `carimbo: 'Carimbo a Fogo'`
- `carimboDesc: 'Descrição Carimbos'`
- `ondeAplicado: 'Onde Aplicado'`

Sem prazo de produção (mesma regra dos extras, `!order.tipoExtra`).

### 8. Ficha de Produção Impressa (PDF)

**Arquivo:** `src/pages/ReportsPage.tsx` (dentro de `generateProductionSheetPDF`)

Para pedidos com `tipoExtra === 'cinto'`, gerar ficha com layout simplificado:
- **Cabeçalho**: mesmo layout (7ESTRIVOS, Código, Vendedor, Data, QR)
- **Descrição**: categorias com campos do cinto (Couro, Bordado, Carimbo, Observação)
- **Canhotos** (2 ao invés de 3):
  - Primeiro: **"PESPONTO"** + código de barras
  - Segundo: **"EXPEDIÇÃO"** + código de barras
  - Terceiro: removido

### 9. Status de Produção

Cintos usam os mesmos status de `EXTRAS_STATUSES` (Em aberto, Produzindo, Expedição, Entregue, Cobrado, Pago), sem prazo de produção.

### 10. Vendedor editável para admins

Na ficha de cinto, o campo vendedor funciona igual à de botas:
- Auto-preenchido com `user.nomeCompleto`
- Read-only para revendedores
- Editável somente para Juliana ADM e Fernanda ADM

---

### Arquivos Alterados/Criados

| Arquivo | Ação |
|---|---|
| `src/pages/BeltOrderPage.tsx` | **Criar** — formulário completo de cintos |
| `src/pages/OrderPage.tsx` | Adicionar tela de seleção Bota/Cinto |
| `src/App.tsx` | Adicionar rota `/pedido-cinto` |
| `src/lib/extrasConfig.ts` | Adicionar configurações do cinto (tamanhos, preços, labels) |
| `src/pages/ReportsPage.tsx` | Filtro + ficha PDF com layout customizado para cintos |
| `src/pages/OrderDetailPage.tsx` | Composição de preço para cintos |
| `src/pages/Index.tsx` | Excluir cintos dos alertas de prazo (mesmo tratamento dos extras) |

### Restrições Respeitadas
- Ficha de botas: nenhuma alteração no formulário existente
- Layout geral: mantido
- Estrutura do sistema: apenas adições

