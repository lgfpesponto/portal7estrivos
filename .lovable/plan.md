

## Plano: Composição de cintos no relatório de Cobrança

### Problema
No relatório de Cobrança, pedidos de cinto entram no bloco genérico de extras (linha 359-369), que apenas mostra o nome do produto e o preço total numa única linha, sem detalhamento da composição.

### Solução

**Arquivo:** `src/components/SpecializedReports.tsx` (dentro de `generateCobrancaPDF`, linhas 359-369)

Adicionar um bloco específico para `o.tipoExtra === 'cinto'` antes do bloco genérico de extras:

```typescript
if (o.tipoExtra === 'cinto' && o.extraDetalhes) {
  const det = o.extraDetalhes as any;
  // Linha 1: produto
  priceItems.push(['Cinto', 0]); // header sem valor próprio

  // Tamanho com preço
  const sizeEntry = BELT_SIZES.find(s => s.label === det.tamanhoCinto);
  if (sizeEntry) priceItems.push([`Tamanho: ${sizeEntry.label}`, sizeEntry.preco]);

  // Bordado P
  if (det.bordadoP === 'Sim') priceItems.push(['Bordado P', BORDADO_P_PRECO]);

  // Nome Bordado
  if (det.nomeBordado === 'Sim') priceItems.push(['Nome Bordado', NOME_BORDADO_CINTO_PRECO]);

  // Carimbo
  const carimboEntry = BELT_CARIMBO.find(c => c.label === det.carimbo);
  if (carimboEntry) priceItems.push([det.carimbo, carimboEntry.preco]);

} else if (o.tipoExtra && o.extraDetalhes) {
  // extras genéricos (código existente)
}
```

Também importar `BELT_SIZES`, `BORDADO_P_PRECO`, `NOME_BORDADO_CINTO_PRECO`, `BELT_CARIMBO` de `extrasConfig.ts`.

E ajustar o cálculo de `orderTotal` para cintos: usar a soma dos `priceItems` em vez de `o.preco` (ou manter `o.preco` se já estiver correto — ambos devem bater).

### Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/components/SpecializedReports.tsx` | Bloco de composição específico para cintos no PDF de cobrança + imports |

