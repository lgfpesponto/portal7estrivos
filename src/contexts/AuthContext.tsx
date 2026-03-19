import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'; // v2

/** Get current date/time in Brasília timezone */
function nowBrasilia(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

export function formatBrasiliaDate(): string {
  const d = nowBrasilia();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatBrasiliaTime(): string {
  const d = nowBrasilia();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export interface User {
  id: string;
  nomeCompleto: string;
  nomeUsuario: string;
  telefone: string;
  email: string;
  cpfCnpj: string;
  isAdmin?: boolean;
}

export interface OrderAlteracao {
  data: string;
  hora: string;
  descricao: string;
}

export interface Order {
  id: string;
  numero: string;
  vendedor: string;
  tamanho: string;
  genero?: string;
  modelo: string;
  solado: string;
  formatoBico: string;
  corVira: string;
  couroGaspea: string;
  couroCano: string;
  couroTaloneira: string;
  corCouroGaspea?: string;
  corCouroCano?: string;
  corCouroTaloneira?: string;
  bordadoCano: string;
  bordadoGaspea: string;
  bordadoTaloneira: string;
  corBordadoCano?: string;
  corBordadoGaspea?: string;
  corBordadoTaloneira?: string;
  personalizacaoNome: string;
  personalizacaoBordado: string;
  nomeBordadoDesc?: string;
  corLinha: string;
  corBorrachinha: string;
  trisce: string;
  triceDesc?: string;
  tiras: string;
  tirasDesc?: string;
  metais: string;
  tipoMetal?: string;
  corMetal?: string;
  strassQtd?: number;
  cruzMetalQtd?: number;
  bridaoMetalQtd?: number;
  acessorios: string;
  desenvolvimento: string;
  sobMedida: boolean;
  sobMedidaDesc?: string;
  observacao: string;
  quantidade: number;
  preco: number;
  status: string;
  dataCriacao: string;
  horaCriacao: string;
  diasRestantes: number;
  temLaser: boolean;
  fotos: string[];
  historico: { data: string; hora: string; local: string; descricao: string; observacao?: string }[];
  alteracoes: OrderAlteracao[];
  laserCano?: string;
  corGlitterCano?: string;
  laserGaspea?: string;
  corGlitterGaspea?: string;
  laserTaloneira?: string;
  corGlitterTaloneira?: string;
  estampa?: string;
  estampaDesc?: string;
  pintura?: string;
  pinturaDesc?: string;
  costuraAtras?: string;
  corSola?: string;
  carimbo?: string;
  carimboDesc?: string;
  corVivo?: string;
  adicionalDesc?: string;
  adicionalValor?: number;
  desconto?: number;
  descontoJustificativa?: string;
  forma?: string;
  tipoExtra?: string;
  extraDetalhes?: Record<string, any>;
  numeroPedidoBota?: string;
}

export const PRODUCTION_STATUSES = [
  "Em aberto", "Aguardando", "Emprestado", "Corte", "Sem bordado",
  "Bordado Dinei", "Bordado Sandro", "Bordado 7Estrivos",
  "Pesponto 01", "Pesponto 02", "Pesponto 03", "Pesponto 04", "Pesponto 05",
  "Pespontando", "Montagem", "Revisão", "Expedição",
  "Baixa Estoque", "Baixa Site (Despachado)",
  "Entregue", "Cobrado", "Pago"
];

export const EXTRAS_STATUSES = [
  "Em aberto", "Produzindo", "Expedição", "Entregue", "Cobrado", "Pago"
];

export const BELT_STATUSES = [
  "Em aberto", "Corte", "Bordado", "Pesponto",
  "Expedição", "Entregue", "Cobrado", "Pago"
];

export const PRODUCTION_STATUSES_USER = [
  "Em aberto", "Aguardando", "Emprestado", "Corte", "Sem bordado",
  "Bordado Dinei", "Bordado Sandro", "Bordado 7Estrivos",
  "Pesponto 01", "Pesponto 02", "Pesponto 03", "Pesponto 04", "Pesponto 05",
  "Pespontando", "Montagem", "Revisão", "Expedição",
  "Entregue", "Cobrado", "Pago"
];

/** Calculate business days remaining (Mon-Fri) */
function addBusinessDays(startDate: Date, days: number): Date {
  const result = new Date(startDate);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return result;
}

export function businessDaysRemaining(startDate: Date, totalBusinessDays: number): number {
  const deadline = addBusinessDays(startDate, totalBusinessDays);
  const now = nowBrasilia();
  if (now >= deadline) return 0;
  let count = 0;
  const d = new Date(now);
  while (d < deadline) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

/** Format barcode content from order number: pad to 10 digits */
export function orderBarcodeValue(numero: string): string {
  const digits = numero.replace(/\D/g, '');
  return digits.padStart(10, '0');
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => boolean;
  register: (data: Omit<User, 'id' | 'isAdmin'> & { senha: string }) => boolean;
  logout: () => void;
  updateProfile: (data: Partial<Omit<User, 'id' | 'isAdmin'>>) => void;
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'numero' | 'dataCriacao' | 'horaCriacao' | 'diasRestantes' | 'historico' | 'status' | 'alteracoes'> & { numeroPedido?: string }) => void;
  deleteOrder: (id: string) => void;
  updateOrder: (id: string, data: Partial<Order>) => void;
  updateOrderStatus: (id: string, newStatus: string, observacao?: string) => void;
  isFernanda: boolean;
  recoverPassword: (cpfCnpj: string, digits: string) => boolean;
  allOrders: Order[];
}

const AuthContext = createContext<AuthContextType | null>(null);

const generateMockOrders = (): Order[] => {
  const models = ["Bota Tradicional", "Bota Feminino", "Coturno", "Capota", "Botina"];
  const statuses = ["Em aberto", "Corte", "Bordado 7Estrivos", "Montagem", "Revisão", "Expedição", "Entregue", "Pago"];
  const vendedores = ["Revendedor Demo", "Samuel", "Carlos", "Fernanda ADM"];

  return Array.from({ length: 12 }, (_, i) => {
    const statusIdx = Math.floor(Math.random() * statuses.length);
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - daysAgo);
    const hours = Math.floor(Math.random() * 14) + 6;
    const minutes = Math.floor(Math.random() * 60);
    const temLaser = Math.random() > 0.7;
    const totalBizDays = temLaser ? 30 : 10;

    return {
      id: `order-${i + 1}`,
      numero: `7E-${2024}${String(i + 1).padStart(4, '0')}`,
      vendedor: vendedores[i % vendedores.length],
      tamanho: `${38 + Math.floor(Math.random() * 8)}`,
      genero: Math.random() > 0.5 ? 'Masculino' : 'Feminino',
      modelo: models[i % models.length],
      solado: "Borracha",
      formatoBico: "",
      corVira: "Bege",
      couroGaspea: "Floter",
      couroCano: "Floter",
      couroTaloneira: "Floter",
      corCouroGaspea: "Marrom",
      corCouroCano: "Marrom",
      corCouroTaloneira: "Marrom",
      bordadoCano: "Florência",
      bordadoGaspea: "",
      bordadoTaloneira: "",
      personalizacaoNome: "",
      personalizacaoBordado: "",
      corLinha: "Bege",
      corBorrachinha: "Marrom",
      trisce: "Não",
      tiras: "Não",
      metais: "",
      acessorios: "",
      desenvolvimento: "",
      sobMedida: false,
      observacao: "",
      quantidade: 1,
      preco: 260 + Math.floor(Math.random() * 200),
      status: statuses[statusIdx],
      dataCriacao: createdDate.toISOString().split('T')[0],
      horaCriacao: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      diasRestantes: businessDaysRemaining(createdDate, totalBizDays),
      temLaser,
      fotos: [],
      historico: PRODUCTION_STATUSES.slice(0, statusIdx + 1).map((s, j) => {
        const d = new Date(createdDate);
        d.setDate(d.getDate() + j * 2);
        const h = Math.floor(Math.random() * 14) + 6;
        const m = Math.floor(Math.random() * 60);
        return {
          data: d.toISOString().split('T')[0],
          hora: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
          local: s,
          descricao: `Pedido movido para ${s}`,
        };
      }),
      alteracoes: [],
    };
  });
};

const registeredUsers: (User & { senha: string })[] = [];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>(generateMockOrders());

  const isAdmin = user?.isAdmin === true;
  const isFernanda = user?.id === 'admin-2';

  const login = useCallback((username: string, password: string) => {
    const found = registeredUsers.find(u => u.nomeUsuario === username && u.senha === password);
    if (found) {
      const { senha, ...userData } = found;
      setUser(userData);
      return true;
    }
    if (username.toLowerCase() === '7estrivos' && password === 'admin123') {
      setUser({
        id: 'admin-1',
        nomeCompleto: 'Juliana Cristina Ribeiro',
        nomeUsuario: '7estrivos',
        telefone: '(16) 99114-9227',
        email: 'lgfpesponto@gmail.com',
        cpfCnpj: '02139487000113',
        isAdmin: true,
      });
      return true;
    }
    if (username.toLowerCase() === 'fernanda' && password === 'admin123') {
      setUser({
        id: 'admin-2',
        nomeCompleto: 'Fernanda ADM',
        nomeUsuario: 'fernanda',
        telefone: '',
        email: 'fernanda@7estrivos.com',
        cpfCnpj: '',
        isAdmin: true,
      });
      return true;
    }
    if (username === 'demo' && password === '123456') {
      setUser({
        id: 'demo-1',
        nomeCompleto: 'Revendedor Demo',
        nomeUsuario: 'demo',
        telefone: '(11) 99999-9999',
        email: 'demo@7estrivos.com',
        cpfCnpj: '12345678900',
      });
      return true;
    }
    return false;
  }, []);

  const register = useCallback((data: Omit<User, 'id' | 'isAdmin'> & { senha: string }) => {
    if (registeredUsers.some(u => u.nomeUsuario === data.nomeUsuario)) return false;
    const newUser = { ...data, id: `user-${Date.now()}` };
    registeredUsers.push(newUser);
    const { senha, ...userData } = newUser;
    setUser(userData);
    return true;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const updateProfile = useCallback((data: Partial<Omit<User, 'id' | 'isAdmin'>>) => {
    setUser(prev => prev ? { ...prev, ...data } : prev);
  }, []);

  const recoverPassword = useCallback((cpfCnpj: string, digits: string) => {
    return digits === '123' || registeredUsers.some(u => u.cpfCnpj.startsWith(digits));
  }, []);

  const addOrder = useCallback((orderData: Omit<Order, 'id' | 'numero' | 'dataCriacao' | 'horaCriacao' | 'diasRestantes' | 'historico' | 'status' | 'alteracoes'> & { numeroPedido?: string }) => {
    const { numeroPedido, ...rest } = orderData;
    const dataHoje = formatBrasiliaDate();
    const horaAgora = formatBrasiliaTime();
    const totalBizDays = rest.temLaser ? 30 : 10;
    const newOrder: Order = {
      ...rest,
      id: `order-${Date.now()}`,
      numero: numeroPedido || `7E-${dataHoje.slice(0, 4)}${String(orders.length + 1).padStart(4, '0')}`,
      dataCriacao: dataHoje,
      horaCriacao: horaAgora,
      diasRestantes: totalBizDays,
      status: 'Em aberto',
      historico: [{ data: dataHoje, hora: horaAgora, local: 'Em aberto', descricao: 'Pedido criado' }],
      alteracoes: [],
    };
    setOrders(prev => [newOrder, ...prev]);
  }, [orders.length]);

  const deleteOrder = useCallback((id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
  }, []);

  const updateOrder = useCallback((id: string, data: Partial<Order>) => {
    const dataHoje = formatBrasiliaDate();
    const horaAgora = formatBrasiliaTime();
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      // Build change descriptions
      const changes: OrderAlteracao[] = [];
      const fieldLabels: Record<string, string> = {
        modelo: 'Modelo', tamanho: 'Tamanho', genero: 'Gênero', solado: 'Solado',
        couroCano: 'Couro do Cano', couroGaspea: 'Couro da Gáspea', couroTaloneira: 'Couro da Taloneira',
        corCouroCano: 'Cor Couro Cano', corCouroGaspea: 'Cor Couro Gáspea', corCouroTaloneira: 'Cor Couro Taloneira',
        bordadoCano: 'Bordado Cano', bordadoGaspea: 'Bordado Gáspea', bordadoTaloneira: 'Bordado Taloneira',
        corBordadoCano: 'Cor Bordado Cano', corBordadoGaspea: 'Cor Bordado Gáspea', corBordadoTaloneira: 'Cor Bordado Taloneira',
        nomeBordadoDesc: 'Nome Bordado', laserCano: 'Laser Cano', laserGaspea: 'Laser Gáspea',
        laserTaloneira: 'Laser Taloneira', corGlitterCano: 'Glitter Cano', corGlitterGaspea: 'Glitter Gáspea',
        corGlitterTaloneira: 'Glitter Taloneira', pintura: 'Pintura', pinturaDesc: 'Cor Pintura',
        estampa: 'Estampa', estampaDesc: 'Descrição Estampa', corLinha: 'Cor da Linha',
        corBorrachinha: 'Cor Borrachinha', corVivo: 'Cor do Vivo', metais: 'Área Metal',
        tipoMetal: 'Tipo Metal', corMetal: 'Cor Metal', observacao: 'Observação',
        desenvolvimento: 'Desenvolvimento', acessorios: 'Acessórios', corVira: 'Cor Vira',
        corSola: 'Cor Sola', costuraAtras: 'Costura Atrás', carimbo: 'Carimbo',
        carimboDesc: 'Descrição Carimbo', adicionalDesc: 'Adicional', formatoBico: 'Formato Bico',
        preco: 'Valor total',
        desconto: 'Desconto',
        descontoJustificativa: 'Justificativa do Desconto',
      };
      for (const key of Object.keys(data)) {
        if (key === 'historico' || key === 'alteracoes') continue;
        const oldVal = String((o as any)[key] ?? '');
        const newVal = String((data as any)[key] ?? '');
        if (oldVal !== newVal) {
          const label = fieldLabels[key] || key;
          if (oldVal && newVal) {
            changes.push({ data: dataHoje, hora: horaAgora, descricao: `Alterado ${label} de "${oldVal}" para "${newVal}"` });
          } else if (newVal) {
            changes.push({ data: dataHoje, hora: horaAgora, descricao: `Adicionado ${label}: "${newVal}"` });
          } else {
            changes.push({ data: dataHoje, hora: horaAgora, descricao: `Removido ${label}` });
          }
        }
      }
      // Check fotos change
      if (data.fotos && JSON.stringify(data.fotos) !== JSON.stringify(o.fotos)) {
        changes.push({ data: dataHoje, hora: horaAgora, descricao: 'Foto de referência alterada' });
      }
      return { ...o, ...data, alteracoes: [...(o.alteracoes || []), ...changes] };
    }));
  }, []);

  const updateOrderStatus = useCallback((id: string, newStatus: string, observacao?: string) => {
    const dataHoje = formatBrasiliaDate();
    const horaAgora = formatBrasiliaTime();
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const newHistEntry = { data: dataHoje, hora: horaAgora, local: newStatus, descricao: `Pedido movido para ${newStatus}`, observacao: observacao || undefined };
      const altEntry: OrderAlteracao = { data: dataHoje, hora: horaAgora, descricao: `Alterado progresso para ${newStatus}${observacao ? ` — Obs: ${observacao}` : ''}` };
      return { ...o, status: newStatus, historico: [...o.historico, newHistEntry], alteracoes: [...(o.alteracoes || []), altEntry] };
    }));
  }, []);

  const userOrders = user?.isAdmin ? orders : orders.filter(o => o.vendedor === user?.nomeCompleto);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isAdmin, isFernanda, login, register, logout, updateProfile, orders: userOrders, addOrder, deleteOrder, updateOrder, updateOrderStatus, recoverPassword, allOrders: orders }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
