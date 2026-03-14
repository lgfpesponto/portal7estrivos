
## Plan: Update Page Titles and Separate "Gerar Relatório" Button

### Analysis
The user wants:
1. **Header nav label**: Change "MEUS PEDIDOS / RELATÓRIOS" → "MEUS PEDIDOS"
2. **Reports page title**: Change "Meus Pedidos / Relatórios" → "MEUS PEDIDOS"
3. **Separate cards**: Move the "GERAR RELATÓRIO" button out of the "Valor Total" card into its own separate card/box

### Changes Required

#### 1. Header.tsx (lines 15, 20)
Update navigation labels in both logged-in and logged-out nav arrays:
- Line 15: `'MEUS PEDIDOS / RELATÓRIOS'` → `'MEUS PEDIDOS'`
- Line 20: `'MEUS PEDIDOS / RELATÓRIOS'` → `'MEUS PEDIDOS'`

#### 2. ReportsPage.tsx
- **Line 42**: Update page title `<h1>` from "Meus Pedidos / Relatórios" to "MEUS PEDIDOS"
- **Lines 75-83**: Reorganize the summary grid:
  - Currently: 3-column grid with "Total de Pedidos", combined "Valor Total + Gerar Relatório" card
  - New: 3-column grid with separate cards for "Total de Pedidos", "Valor Total" (button removed), and standalone "GERAR RELATÓRIO" card
  - The button will be in its own `bg-card rounded-xl p-4 western-shadow` container

### Technical Details
- Keep the existing grid layout (`grid-cols-2 sm:grid-cols-3 gap-4`)
- The "GERAR RELATÓRIO" button will be a full card with centered content, not embedded inside another card
- All styling (colors, shadows, rounded corners) will match existing design patterns
