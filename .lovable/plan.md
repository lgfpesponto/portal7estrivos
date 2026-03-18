

## Plano: 6 funcionalidades

### 1. Abreviar "Fino" para "BF" no canhoto 3

No stub 3 da ficha de produção (`ReportsPage.tsx`), ao montar `solaParts`, substituir "fino" por "BF" (maiúsculas) no `formatoBico`. Ex: "fino ponta redonda" → "BF ponta redonda".

Lógica: `formatoBico.replace(/\bfino\b/gi, 'BF')`

---

### 2. Pedidos de Alerta (dashboard Juliana ADM)

Novo card no `renderAdminDashboard()` em `Index.tsx`, visível apenas quando `!isFernanda` (ou seja, só Juliana).

**Regra:** Um pedido aparece em alerta se:
- `diasRestantes === 0` (prazo atingido) E status NÃO está em `['Expedição', 'Entregue', 'Cobrado', 'Pago']`
- OU o pedido já passou por alguma dessas etapas finais (verificar `historico`) mas o status atual é anterior a elas

Renderiza uma lista com número do pedido, vendedor, status atual e dias em atraso. Link para `/pedido/:id`.

---

### 3. Campo de Desconto (exclusivo Juliana ADM)

**Order interface:** Adicionar `desconto?: number` e `descontoJustificativa?: string` ao tipo `Order`.

**OrderDetailPage.tsx:** Abaixo do total da composição, se o usuário é admin e NÃO é Fernanda (`isAdmin && user?.id === 'admin-1'`):
- Input numérico "Desconto (R$)"
- Textarea obrigatório "Justificativa do desconto" (aparece quando desconto > 0)
- Botão "Aplicar Desconto"
- Ao aplicar, chama `updateOrder(id, { desconto, descontoJustificativa })` e adiciona ao `alteracoes` uma entrada com formato: `"Desconto aplicado: R$ XX,XX | Justificativa: ... | Por: Juliana ADM"`

**Exibição:** Se `order.desconto > 0`, mostrar abaixo do total: "Desconto: -R$ XX,XX" e "Total com desconto: R$ YY,YY".

**AuthContext:** Ajustar `updateOrder` para reconhecer `desconto` e `descontoJustificativa` nos `fieldLabels`.

---

### 4. Relatório Expedição PDF (novo layout A4)

Reescrever `generateExpedicaoPDF()` em `SpecializedReports.tsx`:

**Cabeçalho:** `"Expedição  [DD/MM/YYYY — NomeVendedor]"` (16pt bold)

**Tabela com colunas:**
| N. PEDIDO | CÓD. BARRAS | QTD | PREÇO | ASSINATURA |
|-----------|-------------|-----|-------|------------|

- Larguras proporcionais ao A4 (210mm - margens): ~30mm, 50mm, 20mm, 30mm, 60mm
- Linhas de grade com `doc.rect` ou `doc.line`
- Código de barras renderizado como imagem inline na célula

**Rodapé:** Linha de total com soma de QTD e PREÇO.

Filtro por vendedor já existe. Garantir que filtra `status === 'Expedição'`.

---

### 5. Relatório Cobrança PDF (novo layout A4)

Reescrever `generateCobrancaPDF()` em `SpecializedReports.tsx`:

**Cabeçalho:** `"Cobrança  [DD/MM/YYYY — NomeVendedor]"` (16pt bold)

**Tabela com colunas:**
| N. PEDIDO | COMPOSIÇÃO DA BOTA | QTD | PREÇO | PAGO |
|-----------|-------------------|-----|-------|------|

- Composição: mesma lógica atual (`composicao.join(' | ')`) mas dentro da célula com `splitTextToSize`
- Coluna PAGO: checkbox vazio (quadrado desenhado com `doc.rect`)
- Larguras: ~25mm, 75mm, 15mm, 25mm, 20mm

**Rodapé:** Total QTD + Total PREÇO.

Filtro: `status === 'Entregue'`. Filtro por vendedor já existe.

---

### 6. Remover Relatórios Especializados do dashboard revendedor

Em `Index.tsx`, no `renderVendedorDashboard()`, remover o bloco `<SpecializedReports reports={['expedicao', 'cobranca']} />`.

---

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/contexts/AuthContext.tsx` | Adicionar `desconto`, `descontoJustificativa` ao `Order` + fieldLabels |
| `src/pages/Index.tsx` | Card "Pedidos de Alerta" no admin dashboard + remover SpecializedReports do revendedor |
| `src/pages/OrderDetailPage.tsx` | UI de desconto exclusivo Juliana + exibição do desconto |
| `src/components/SpecializedReports.tsx` | Reescrever PDFs de Expedição e Cobrança com layout tabular A4 |
| `src/pages/ReportsPage.tsx` | Abreviar "Fino" → "BF" no stub 3 |

