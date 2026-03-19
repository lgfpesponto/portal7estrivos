

## Plano: Composição detalhada de extras no relatório de Cobrança

### Problema
Pedidos de extras no relatório de Cobrança mostram apenas uma linha com nome e valor total (linha 370-373 de `SpecializedReports.tsx`), sem detalhar os componentes que formam o preço.

### Solução

**Arquivo:** `src/components/SpecializedReports.tsx` (bloco `else if (o.tipoExtra && o.extraDetalhes)`, linhas 370-373)

Substituir o bloco genérico por composição detalhada por tipo de extra, usando `o.tipoExtra` e `o.extraDetalhes`:

```typescript
} else if (o.tipoExtra && o.extraDetalhes) {
  const det = o.extraDetalhes as any;
  const extraLabel = o.modelo.replace('Extra — ', '');
  
  switch (o.tipoExtra) {
    case 'desmanchar': {
      priceItems.push(['Desmanchar (base)', 65]);
      if (det.qualSola === 'Preta borracha') priceItems.push(['Sola preta borracha', 25]);
      else if (det.qualSola === 'De cor borracha') priceItems.push(['Sola de cor borracha', 40]);
      else if (det.qualSola === 'De couro') priceItems.push(['Sola de couro', 60]);
      if (det.trocaGaspea === 'Sim') priceItems.push(['Troca Gáspea/Taloneira', 35]);
      break;
    }
    case 'kit_canivete': {
      priceItems.push(['Kit Canivete', 30]);
      if (det.vaiCanivete === 'Sim') priceItems.push(['Com canivete', 30]);
      break;
    }
    case 'kit_faca': {
      priceItems.push(['Kit Faca', 35]);
      if (det.vaiCanivete === 'Sim') priceItems.push(['Com faca', 35]);
      break;
    }
    case 'carimbo_fogo': {
      const qty = parseInt(det.qtdCarimbos) || 1;
      priceItems.push([`Carimbo a Fogo (${qty} un.)`, qty >= 4 ? 40 : 20]);
      break;
    }
    case 'revitalizador': {
      const qty = parseInt(det.quantidade) || 1;
      priceItems.push([`Revitalizador (${qty} un.)`, 10 * qty]);
      break;
    }
    case 'kit_revitalizador': {
      const qty = parseInt(det.quantidade) || 1;
      priceItems.push([`Kit 2 Revitalizador (${qty} un.)`, 26 * qty]);
      break;
    }
    case 'adicionar_metais': {
      const sel = det.metaisSelecionados || [];
      if (sel.includes('Bola grande')) priceItems.push(['Bola grande', 15]);
      if (sel.includes('Strass')) {
        const qtd = parseInt(det.qtdStrass) || 1;
        priceItems.push([`Strass (${qtd} un.)`, 0.60 * qtd]);
      }
      break;
    }
    case 'bota_pronta_entrega': {
      priceItems.push([det.descricaoProduto || 'Bota Pronta Entrega', parseFloat(det.valorManual) || o.preco]);
      break;
    }
    default:
      // tiras_laterais, gravata_country, chaveiro_carimbo, bainha_cartao, regata
      priceItems.push([extraLabel, o.preco]);
      break;
  }
}
```

Extras simples com preço fixo (tiras, gravata, chaveiro, bainha, regata) continuam em uma linha, pois não têm composição. Extras compostos (desmanchar, kits, carimbo, metais) mostram cada componente com seu valor.

### Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/components/SpecializedReports.tsx` | Substituir bloco genérico de extras por composição detalhada por tipo |

