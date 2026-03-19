

## Plano: Atualização dos Bordados — Listas separadas por região + Bordado Variado com descrição

### Resumo

Substituir a lista única `BORDADOS` por 3 listas separadas (`BORDADOS_CANO`, `BORDADOS_GASPEA`, `BORDADOS_TALONEIRA`) com valores e opções distintos, adicionar "Bordado Variado R$5/R$10" com campo de descrição obrigatório, e ajustar a ficha impressa para exibir apenas a descrição quando for Variado.

---

### 1. Nova configuração em `src/lib/orderFieldsConfig.ts`

Remover os antigos `Bordado Variado R$15/20/30/40/50` e criar 3 constantes:

**BORDADOS_CANO:**
Florência R$25, Linhas R$25 (novo), Peão Elite G R$35, Velho Barreiro R$70, Rozeta R$35, Nelore R$25, Cruz Bordada R$25, Milionário R$35, Monster R$35, Cruz Básica R$25, Mulas R$25, Ramos R$25 (novo), + itens não mencionados mantidos (Peão Elite P, N. Senhora, Logo Marca, N. Senhora P, Rozeta P, Cruz P, Monster P, Bandeira P), + Bordado Variado R$5, Bordado Variado R$10

Removidos do cano: Meia Florência, Florão Básico, Florão B

**BORDADOS_GASPEA:**
Florência R$15, Peão Elite G R$20, Nelore R$15, Mulas R$15, Cruz Bordada R$15, Milionário R$20, Monster R$20, Cruz Básica R$15, Rozeta R$20, N. Senhora R$20, Velho Barreiro R$35, + itens não mencionados (Peão Elite P, Logo Marca, N. Senhora P, Rozeta P, Cruz P, Monster P, Bandeira P), + Bordado Variado R$5, Bordado Variado R$10

Removidos da gáspea: Meia Florência, Florão B

**BORDADOS_TALONEIRA:**
Florência R$10, Nelore R$10, Mulas R$10, Cruz Bordada R$10, + itens não mencionados (Peão Elite P, Logo Marca, N. Senhora P, Rozeta P, Cruz P, Monster P, Bandeira P), + Bordado Variado R$5, Bordado Variado R$10

Removidos da taloneira: Meia Florência, Peão Elite G, Florão B, Florão Básico, Milionário, Monster, Cruz Básica, Rozeta, N. Senhora, Velho Barreiro

Manter `BORDADOS` original (para compatibilidade com relatórios que buscam preço por label — ajustar lookup para usar a lista correta por região).

---

### 2. Campos de descrição do Bordado Variado

**`src/contexts/AuthContext.tsx`** — Adicionar campos opcionais ao tipo `Order`:
- `bordadoVariadoDescCano?: string`
- `bordadoVariadoDescGaspea?: string`
- `bordadoVariadoDescTaloneira?: string`

**`src/pages/OrderPage.tsx`** e **`src/pages/EditOrderPage.tsx`**:
- Novos estados: `bordadoVariadoDescCano`, `bordadoVariadoDescGaspea`, `bordadoVariadoDescTaloneira`
- Trocar `items={BORDADOS}` por `items={BORDADOS_CANO}`, `BORDADOS_GASPEA`, `BORDADOS_TALONEIRA`
- Após cada MultiSelect de bordado, se algum item selecionado contém "Bordado Variado", mostrar input obrigatório "Descrever bordado"
- Na validação: se Bordado Variado selecionado e descrição vazia, bloquear envio
- No `confirmOrder`: incluir os 3 novos campos no objeto
- Atualizar cálculo de preço: buscar preço na lista específica da região (BORDADOS_CANO, BORDADOS_GASPEA, BORDADOS_TALONEIRA)

---

### 3. Ficha de produção impressa (PDF)

**`src/pages/ReportsPage.tsx`** — Na seção BORDADOS da ficha:
- Ao montar o texto do bordado de cada região, substituir "Bordado Variado R$5" / "Bordado Variado R$10" pelo conteúdo de `bordadoVariadoDescCano` (ou Gaspea/Taloneira)
- Exemplo: se bordadoCano = "Florência, Bordado Variado R$10" e bordadoVariadoDescCano = "Cruz com rosas", exibir: "florência, cruz com rosas"

---

### 4. Relatórios especializados

**`src/components/SpecializedReports.tsx`** — Mesma lógica de substituição do Variado pela descrição na exibição. Atualizar lookup de preços nos relatórios de cobrança para usar as listas corretas por região.

---

### Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/lib/orderFieldsConfig.ts` | 3 novas constantes BORDADOS_CANO/GASPEA/TALONEIRA com valores atualizados |
| `src/contexts/AuthContext.tsx` | 3 novos campos opcionais no tipo Order |
| `src/pages/OrderPage.tsx` | Listas separadas, campo descrição variado, validação, cálculo de preço |
| `src/pages/EditOrderPage.tsx` | Idem OrderPage |
| `src/pages/ReportsPage.tsx` | Substituir Variado pela descrição na ficha impressa + lookup de preço por região |
| `src/components/SpecializedReports.tsx` | Idem na exibição e cálculo |

