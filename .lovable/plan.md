

## Plano: 3 colunas na descrição + wrapping no cabeçalho

### Prévia do layout atualizado

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│  7ESTRIVOS                                                         ┌───────┐  │
│                                                                    │  QR   │  │
│  Código:    250001           Tamanho:  39 fem. | sob medida:       │ CODE  │  │
│  Vendedor:  João Silva       22cm de altura e 30cm de diâmetro     └───────┘  │
│  Data:      15/03 14:30      Modelo:   bota tradicional                       │
│                              Escaneie para ver a foto ->                      │
│─────────────────────────────────────────────────────────────────────────────────│
│                                │                     │                        │
│  COUROS                        │  PESPONTO            │  METAIS               │
│  Cano:  crazy horse nescau     │  Linha:  branca      │  inteira, rebite,     │
│  Gáspea: crazy horse nescau    │  Borrachinha: preta  │  ouro velho           │
│  Taloneira: crazy horse nescau │  Vivo:   escuro      │  strass x2            │
│                                │                     │                        │
│  BORDADOS                      │  SOLADOS             │  ACESSÓRIOS           │
│  Cano:  florência rosa         │  Tipo: borr. quad.   │  Kit Faca, Zíper      │
│  Gáspea: florência rosa        │  Cor:  preta         │                       │
│  Taloneira: florão bege        │  Vira: bege          │  OBS                  │
│  Nome:  stefany cursiva        │                     │  Cliente quer urgente  │
│                                │  EXTRAS              │                       │
│  LASER                         │  Tricê: branco       │                       │
│  Cano:  estrela glitter prata  │  Tiras: marrom       │                       │
│                                │  Carimbo: até 3      │                       │
│                                │                     │                        │
│┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄│
│ BORDADO/LASER          │ PESPONTO               │ SOLA: borr.  FORMA:250001  │
│ [||||||||||||||||]     │ [||||||||||||||||]      │ NÚMERO: 39                 │
│ 250001                 │ 250001                  │ [||||||||||||||||]          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### O que muda

**Cabeçalho — wrapping inteligente:**
- Calcula a largura disponível na coluna direita (de `hx2=105` até `qrX - 2`) para evitar sobreposição no QR Code
- Se o texto de Tamanho+sob medida exceder essa largura, quebra em 2 linhas usando `splitTextToSize`
- Modelo e "Escaneie para ver a foto" descem dinamicamente conforme a quantidade de linhas do campo anterior
- Variável `rhY` (right header Y) avança linha a linha em vez de usar posições fixas

**Descrição — 3 colunas com overflow vertical:**
- Divide a área de descrição em 3 colunas de largura `colWidth = (pw - m*2 - 8) / 3`
- `col1X = m+3`, `col2X = col1X + colWidth + 2`, `col3X = col2X + colWidth + 2`
- Algoritmo greedy distribui categorias nas 3 colunas (sempre adiciona à coluna com menor altura acumulada)
- **Wrapping horizontal:** cada valor de campo é processado com `splitTextToSize(value, colWidth - labelWidth - 5)` — se ultrapassar a largura da coluna, desce para a próxima linha
- **Overflow vertical:** se `cy > descBottom` durante a renderização de uma categoria, interrompe essa coluna e move categorias restantes para a próxima coluna disponível

### Alterações técnicas em `src/pages/ReportsPage.tsx`

1. **Linhas 226-238 (cabeçalho direito):** Substituir posições fixas por `rhY` dinâmico. Usar `splitTextToSize` para Tamanho+sob medida com `maxW = qrX - hx2 - 4`. Modelo e frase do QR avançam em `rhY += hGap` após cada campo renderizado.

2. **Linhas 350-389 (distribuição e renderização):** Mudar de 2 para 3 colunas:
   - `colWidth = (pw - m*2 - 8) / 3`
   - 3 arrays: `col1Cats`, `col2Cats`, `col3Cats`
   - Greedy: sempre insere na coluna de menor altura
   - `renderCats` usa `splitTextToSize` para cada valor de campo, avançando `cy` por cada linha quebrada
   - Se `cy > descBottom` durante renderização, para (categorias que não couberam ficam cortadas — proteção de overflow)

