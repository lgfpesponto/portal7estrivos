

## Plano: Melhorias nos EXTRAS — preço Regata, novo produto, número manual, filtro detalhado, visualização

### 1. Regata — valor padrão R$50

Em `ExtrasPage.tsx`:
- Mudar `precoBase` de `null` para `50` e `precoLabel` para `'R$ 50,00'`
- Em `calcPrice`, retornar `50` para `'regata'`

### 2. Novo produto: Bota Pronta Entrega

Adicionar ao array `PRODUCTS`:
```
{ id: 'bota_pronta_entrega', nome: 'Bota Pronta Entrega', descricao: 'Bota pronta para entrega', precoBase: null, precoLabel: 'Valor manual' }
```

Formulário: campos `numeroPedido` (obrigatório, manual), `descricao`, `valor` (manual), quantidade fixa 1.

Em `handleSubmit`, para este produto: usar o número digitado como `numeroPedido` (em vez de gerar automático), e o valor digitado como preço.

### 3. Número do pedido manual em TODOS os extras

- Adicionar campo `numeroPedido` (obrigatório) em TODOS os formulários de extras
- No `emptyForm()`, adicionar `numeroPedido: ''`
- No `handleSubmit`, passar `numeroPedido: form.numeroPedido` para que o `addOrder` use esse número em vez de gerar automático
- Validar que `numeroPedido` não está vazio antes de submeter

### 4. Filtro de produção detalhado por produto extra

No `ReportsPage.tsx`, substituir o botão único "Extras" por botões individuais para cada tipo de extra:
- Tiras Laterais, Desmanchar, Kit Canivete, Kit Faca, Carimbo a Fogo, Revitalizador, Kit 2 Revitalizador, Gravata Country, Adicionar Metais, Chaveiro c/ Carimbo, Bainha de Cartão, Regata, Bota Pronta Entrega

Lógica de filtro: manter `filterProduto` como `Set<string>` com valores `'bota'` e cada `tipoExtra` id. Atualizar `appliedFilters` e a lógica de filtragem para comparar `o.tipoExtra` com os ids selecionados.

### 5. Nome do produto visível na lista de pedidos

Em `ReportsPage.tsx`, na renderização da lista de pedidos (linha ~713), para pedidos com `tipoExtra`, exibir o nome do produto (ex: "Kit Faca") ao lado do número:
```
{order.numero} — Kit Faca
```

Usar um mapa `tipoExtra → nome` derivado dos PRODUCTS.

### 6. Detalhes do Extra — mostrar apenas campos preenchidos

Em `OrderDetailPage.tsx`, na seção "Detalhes do Extra" (linha ~231):
- Filtrar `extraDetalhes` para excluir valores vazios, `''`, `'Não'`, arrays vazios, e keys internas (`valor`, `valorTotal`, `numeroPedidoBota`, `numeroPedido`)
- Exibir `numeroPedidoBota` separadamente se preenchido
- Melhorar labels com um mapa legível (ex: `corTiras` → `Cor das Tiras`)

### 7. Composição do Pedido — mostrar apenas itens com valor

Em `OrderDetailPage.tsx`, para pedidos extras, construir `priceItems` específico baseado no `tipoExtra` e `extraDetalhes`, mostrando apenas os componentes de preço reais (ex: "Valor base: R$65", "Sola preta borracha: R$25") em vez de tentar usar as configs de bota.

---

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/ExtrasPage.tsx` | Regata R$50, novo produto Bota Pronta Entrega, campo numeroPedido obrigatório em todos, validação |
| `src/pages/ReportsPage.tsx` | Filtro detalhado por tipo de extra, nome do produto na lista |
| `src/pages/OrderDetailPage.tsx` | Detalhes/composição limpos para extras |

