

## Plano: Corrigir preço da cor de sola "Avermelhada"

O preço de "Avermelhada" está definido como `0` na linha 167 de `src/lib/orderFieldsConfig.ts`. Precisa ser alterado para `10`.

### Alteração

**Arquivo:** `src/lib/orderFieldsConfig.ts` (linha 167)

```
// De:
{ label: 'Avermelhada', preco: 0 },
// Para:
{ label: 'Avermelhada', preco: 10 },
```

Nenhuma outra alteração necessária — o cálculo de preço já usa o campo `preco` do array `COR_SOLA`.

