

## Prévia atualizada — Cabeçalho sem Quantidade + "Escaneie" alinhado

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│  7ESTRIVOS                                                         ┌───────┐  │
│                                                                    │  QR   │  │
│  Código:    250001           Tamanho:  39 masc.                    │ CODE  │  │
│  Vendedor:  João Silva       Modelo:   bota tradicional            └───────┘  │
│  Data:      15/03 14:30      Escaneie para ver a foto →                       │
│─────────────────────────────────────────────────────────────────────────────────│
│                                                                               │
│  COUROS                              │  PESPONTO                              │
│  Cano:       crazy horse nescau      │  Linha:        branca                  │
│  Gáspea:     crazy horse nescau      │  Borrachinha:  preta                   │
│  Taloneira:  crazy horse nescau      │  Vivo:         escuro                  │
│                                      │                                        │
│  BORDADOS                            │  SOLADOS                               │
│  Cano:       florência rosa          │  Tipo:    borracha quadrado            │
│  Gáspea:     florência rosa          │  Cor:     preta                        │
│  Taloneira:  florão básico bege      │  Vira:    bege                         │
│  Nome:       stefany cursiva         │                                        │
│                                      │  METAIS                                │
│  ACESSÓRIOS                          │  Área:    inteira                      │
│  Kit Faca, Zíper                     │  Tipo:    rebite                       │
│                                      │  Cor:     níquel                       │
│  EXTRAS                              │                                        │
│  Tricê:      branco                  │  OBS                                   │
│  Tiras:      marrom                  │  Cliente quer urgente                  │
│                                      │                                        │
│┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄│
│ BORDADO/LASER          │ PESPONTO               │ SOLA: borr.  FORMA:250001  │
│ [||||||||||||||||]     │ [||||||||||||||||]      │ NÚMERO: 39                 │
│ 250001                 │ 250001                  │ [||||||||||||||||]          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### O que muda

- **Quantidade removida** do cabeçalho
- **"Escaneie para ver a foto"** agora fica na coluna direita (x=105mm), na terceira linha do cabeçalho (alinhada com "Data"), apontando com seta → para o QR Code ao lado
- Coluna esquerda: Código, Vendedor, Data
- Coluna direita: Tamanho, Modelo, Escaneie para ver a foto →

### Alteração técnica

Em `src/pages/ReportsPage.tsx`, no bloco do cabeçalho:
1. Remover linha de Quantidade da coluna direita
2. Mover "Escaneie para ver a foto" para `hx2 = 105mm, hy + 12` (terceira linha da coluna direita), com seta → indicando o QR Code

