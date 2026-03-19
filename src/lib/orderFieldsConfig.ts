// ==================== MODELOS ====================
export const MODELOS: { label: string; preco: number }[] = [
  { label: 'Bota Tradicional', preco: 260 },
  { label: 'Bota Feminino', preco: 260 },
  { label: 'Bota Peão', preco: 260 },
  { label: 'Bota Montaria (40)', preco: 270 },
  { label: 'Coturno', preco: 240 },
  { label: 'Destroyer', preco: 200 },
  { label: 'Capota', preco: 230 },
  { label: 'Capota Bico Fino', preco: 230 },
  { label: 'Capota Bico Fino Perfilado', preco: 230 },
  { label: 'Cano Médio', preco: 205 },
  { label: 'Botina', preco: 200 },
  { label: 'Bota Infantil', preco: 170 },
  { label: 'Botina Infantil', preco: 160 },
  { label: 'Bota Ouver Perfilado', preco: 270 },
  { label: 'Urbano', preco: 260 },
  { label: 'Bota Bico Fino Feminino', preco: 260 },
  { label: 'Bota Bico Fino Perfilado', preco: 260 },
  { label: 'Tradicional Bico Fino', preco: 260 },
  { label: 'Cano Médio Infantil', preco: 160 },
  { label: 'City', preco: 270 },
];

// ==================== TAMANHOS ====================
export const TAMANHOS = Array.from({ length: 22 }, (_, i) => String(24 + i));

// ==================== GÊNERO ====================
export const GENEROS = ['Feminino', 'Masculino'];

// ==================== ACESSÓRIOS ====================
export const ACESSORIOS: { label: string; preco: number }[] = [
  { label: 'Kit Faca', preco: 70 },
  { label: 'Kit Canivete', preco: 60 },
  { label: 'Kit Cantil', preco: 40 },
  { label: 'Bolso', preco: 50 },
  { label: 'Zíper', preco: 40 },
];

// ==================== COUROS ====================
export const TIPOS_COURO = [
  'Crazy Horse','Látego','Fóssil','Napa Flay','Floter','Nobuck',
  'Estilizado em Avestruz','Estilizado em Arraia','Estilizado em Tilápia',
  'Egípcio','Estilizado em Jacaré','Estilizado em Cobra',
  'Estilizado em Dinossauro','Aramado','Escamado','Estilizado Duplo',
  'Estilizado em Tatu','Vaca Holandesa','Vaca Pintada',
];

export const COURO_PRECOS: Record<string, number> = {
  'Estilizado em Dinossauro': 50,
  'Estilizado em Avestruz': 10,
  'Estilizado em Tatu': 40,
  'Aramado': 40,
  'Escamado': 20,
  'Estilizado Duplo': 20,
  'Vaca Holandesa': 15,
  'Vaca Pintada': 15,
};

export const CORES_COURO = [
  'Nescau','Café','Marrom','Preto','Telha','Mostarda','Bege','Azul',
  'Vermelho','Rosa','Branco','Off White','Pinhão','Verde','Amarelo',
  'Brasileiro','Americano','Cappuccino','Areia','Mustang','Rosa Neon',
  'Laranja','Cru','Havana','Petróleo','Malhado',
];

// ==================== BORDADOS ====================
export const BORDADOS: { label: string; preco: number }[] = [
  { label: 'Florência', preco: 40 },
  { label: 'Meia Florência', preco: 30 },
  { label: 'Velho Barreiro', preco: 75 },
  { label: 'Peão Elite P', preco: 25 },
  { label: 'Peão Elite G', preco: 40 },
  { label: 'Rozeta', preco: 40 },
  { label: 'N. Senhora', preco: 25 },
  { label: 'Florão Básico', preco: 5 },
  { label: 'Logo Marca', preco: 50 },
  { label: 'Milionário', preco: 40 },
  { label: 'Monster', preco: 40 },
  { label: 'Cruz Básica', preco: 30 },
  { label: 'Cruz Bordada', preco: 40 },
  { label: 'Mulas', preco: 40 },
  { label: 'Nelore', preco: 40 },
  { label: 'N. Senhora P', preco: 10 },
  { label: 'Rozeta P', preco: 10 },
  { label: 'Cruz P', preco: 10 },
  { label: 'Monster P', preco: 10 },
  { label: 'Bandeira P', preco: 15 },
  { label: 'Florão B', preco: 5 },
  { label: 'Bordado Variado R$20', preco: 20 },
  { label: 'Bordado Variado R$30', preco: 30 },
  { label: 'Bordado Variado R$40', preco: 40 },
  { label: 'Bordado Variado R$50', preco: 50 },
  { label: 'Bordado Variado R$15', preco: 15 },
];

// ==================== LASER ====================
export const LASER_OPTIONS = [
  'Cruz','Bridão','Pipoco','Ouro','Florência Brilhante','Folhas',
  'Lara','Rodeio','Iluminada','Cruz Asas','Beca','Coração',
  'Cruz Circular','Cruz Zero','Borboleta','Livia','Luiza',
  'Duquesa','Julia','Anjo','Pintura Cavalo','Outro',
];
export const LASER_CANO_PRECO = 50;
export const LASER_GASPEA_PRECO = 50;
export const LASER_TALONEIRA_PRECO = 0;
export const GLITTER_CANO_PRECO = 30;
export const GLITTER_GASPEA_PRECO = 30;
export const GLITTER_TALONEIRA_PRECO = 0;

// ==================== COR GLITTER/TECIDO ====================
export const COR_GLITTER = [
  'Dourado','Prata','Rosa Claro','Rosa Pink','Azul','Preto','Marrom','Vermelho',
];

// ==================== COR DA LINHA ====================
export const COR_LINHA = [
  'Bege','Branca','Preta','Marrom','Vermelha','Azul','Verde','Rosa','Amarelo','Laranja',
];

// ==================== COR BORRACHINHA ====================
export const COR_BORRACHINHA = ['Preto','Marrom','Branco','Rosa'];

// ==================== COR DO VIVO ====================
export const COR_VIVO = ['Escuro','Branco','Rosa','Azul','Laranja'];

// ==================== DESENVOLVIMENTO ====================
export const DESENVOLVIMENTO: { label: string; preco: number }[] = [
  { label: 'Estampa', preco: 150 },
  { label: 'Laser', preco: 100 },
  { label: 'Bordado', preco: 50 },
];

// ==================== METAIS ====================
export const AREA_METAL: { label: string; preco: number }[] = [
  { label: 'Inteira', preco: 30 },
  { label: 'Metade da Bota', preco: 15 },
];
export const TIPO_METAL = ['Rebite', 'Bola Grande'];
export const COR_METAL = ['Níquel', 'Ouro Velho', 'Dourado'];
export const STRASS_PRECO = 0.60;
export const CRUZ_METAL_PRECO = 6;
export const BRIDAO_METAL_PRECO = 3;

// ==================== SOLADO ====================
export const SOLADO: { label: string; preco: number }[] = [
  { label: 'Borracha', preco: 0 },
  { label: 'Couro Reta', preco: 60 },
  { label: 'Couro Carrapeta', preco: 60 },
  { label: 'Couro Carrapeta com Espaço Espora', preco: 60 },
  { label: 'Jump', preco: 30 },
  { label: 'Rústica', preco: 0 },
  { label: 'Infantil', preco: 0 },
];

// ==================== FORMATO DO BICO ====================
export const FORMATO_BICO = ['Quadrado', 'Redondo', 'Fino Ponta Redonda', 'Fino Ponta Quadrada'];

// ==================== COR DA SOLA ====================
export const COR_SOLA: { label: string; preco: number }[] = [
  { label: 'Marrom', preco: 20 },
  { label: 'Preto', preco: 0 },
  { label: 'Branco', preco: 20 },
  { label: 'Madeira', preco: 0 },
  { label: 'Avermelhada', preco: 0 },
  { label: 'Pintada de Preto', preco: 0 },
];

// ==================== COR DA VIRA ====================
export const COR_VIRA: { label: string; preco: number }[] = [
  { label: 'Bege', preco: 0 },
  { label: 'Preto', preco: 10 },
  { label: 'Rosa', preco: 10 },
];

// ==================== CARIMBO A FOGO ====================
export const CARIMBO: { label: string; preco: number }[] = [
  { label: 'Até 3 Carimbos', preco: 20 },
  { label: 'Até 6 Carimbos', preco: 40 },
];

// ==================== FIXED VALUES ====================
export const SOB_MEDIDA_PRECO = 50;
export const NOME_BORDADO_PRECO = 40;
export const ESTAMPA_PRECO = 30;
export const PINTURA_PRECO = 15;
export const TRICE_PRECO = 20;
export const TIRAS_PRECO = 15;
export const COSTURA_ATRAS_PRECO = 20;
