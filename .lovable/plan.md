

## Plano: Filtro de produto como Select no gráfico de vendas para todos os usuários

### Problema

1. O filtro de produto (Bota, Regata, Bota P.E.) aparece apenas no `renderAdminDashboard()` (linhas 126-133) como botões. Não aparece no `renderVendedorDashboard()` (linhas 284-291).
2. O formato de botões ocupa muito espaço — deve ser um `<Select>` igual ao filtro de vendedor.

### Solução

**Arquivo:** `src/pages/Index.tsx`

1. **Admin dashboard (linhas 126-133):** Substituir os botões de filtro de produto por um `<Select>`:
```tsx
<Select value={chartProductFilter} onValueChange={setChartProductFilter}>
  <SelectTrigger className="w-40">
    <SelectValue placeholder="Todos produtos" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="todos">Todos produtos</SelectItem>
    <SelectItem value="bota">Bota</SelectItem>
    <SelectItem value="regata">Regata</SelectItem>
    <SelectItem value="bota_pronta_entrega">Bota P.E.</SelectItem>
  </SelectContent>
</Select>
```
Colocar lado a lado com o Select de vendedor em uma `div flex gap-2`.

2. **Vendedor dashboard (linhas 284-291):** Adicionar o mesmo `<Select>` de produto entre os botões de período e o gráfico.

