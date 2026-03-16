

## Correções da ficha de produção

### Problemas identificados

1. **"Escaneie para ver a foto →"** — O caractere `\u2192` (→) pode não estar disponível na fonte Helvetica do jsPDF, causando caracteres estranhos. Trocar por `->` ou usar texto sem seta.

2. **Sob medida não aparece na ficha** — Está sendo adicionado na categoria EXTRAS, mas o pedido da imagem mostra "Sim — 22cm de altura e 30cm de diametro". Mover para o cabeçalho, na mesma linha do Tamanho.

3. **Metais em linhas separadas** — Área, Tipo e Cor estão em 3 linhas. Juntar tudo em 1 linha: `"inteira, rebite, ouro velho"`. Strass/Cruz/Bridão numa segunda linha se existirem.

4. **Campos faltando** — Verificar: `carimbo` compara com `'Sim'` mas o valor real é o label do carimbo (ex: "Até 3 Carimbos"). Pintura e Estampa com `pinturaDesc`/`estampaDesc` não estão sendo incluídos.

5. **Último canhoto** — O texto da sola (`COURO RETA FINO PONTA REDONDA`) é longo demais e invade o `FORMA:`. Precisa truncar ou reduzir fonte e reorganizar layout do stub 3.

### Alterações em `src/pages/ReportsPage.tsx`

**Cabeçalho (linhas 226-235):**
- Linha do Tamanho: incluir sob medida → `"37 fem. | sob medida: 22cm de altura..."` 
- Substituir `\u2192` por `->` na frase "Escaneie para ver a foto"

**Metais (linhas 308-315):**
- Juntar Área + Tipo + Cor em uma única linha com label "Metais:"
- Se houver strass/cruz/bridão, adicionar numa segunda linha

**Carimbo (linha 330):**
- Trocar `order.carimbo === 'Sim'` por `order.carimbo` (o valor é o label, ex: "Até 3 Carimbos")
- Incluir `carimboDesc` no valor

**Pintura/Estampa (linhas 327-328):**
- Incluir `pinturaDesc` e `estampaDesc` nos valores quando existirem

**Stub 3 (linhas 420-436):**
- Reduzir fonte da sola para 7pt
- Usar `splitTextToSize` ou truncar texto longo da sola
- Reorganizar: SOLA à esquerda (com quebra), FORMA à direita, NÚMERO abaixo, barcode no espaço restante

