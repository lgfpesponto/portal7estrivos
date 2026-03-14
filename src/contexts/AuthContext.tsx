import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface User {
  id: string;
  nomeCompleto: string;
  nomeUsuario: string;
  telefone: string;
  email: string;
  cpfCnpj: string;
  isAdmin?: boolean;
}

export interface Order {
  id: string;
  numero: string;
  vendedor: string;
  tamanho: string;
  modelo: string;
  solado: string;
  formatoBico: string;
  corVira: string;
  couroGaspea: string;
  couroCano: string;
  couroTaloneira: string;
  bordadoCano: string;
  bordadoGaspea: string;
  bordadoTaloneira: string;
  personalizacaoNome: string;
  personalizacaoBordado: string;
  corLinha: string;
  corBorrachinha: string;
  trisce: string;
  tiras: string;
  metais: string;
  acessorios: string;
  desenvolvimento: string;
  sobMedida: boolean;
  observacao: string;
  quantidade: number;
  preco: number;
  status: string;
  dataCriacao: string;
  horaCriacao: string;
  diasRestantes: number;
  temLaser: boolean;
  fotos: string[];
  historico: { data: string; local: string; descricao: string }[];
}

export const PRODUCTION_STATUSES = [
  "Em aberto", "Aguardando", "Emprestado", "Corte", "Sem bordado",
  "Bordado Dinei", "Bordado Sandro", "Bordado 7Estrivos",
  "Pesponto 01", "Pesponto 02", "Pesponto 03", "Pesponto 04", "Pesponto 05",
  "Pespontando", "Montagem", "Revisão", "Expedição",
  "Baixa Estoque", "Baixa Site (Despachado)",
  "Entregue", "Cobrado", "Pago"
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

function businessDaysRemaining(startDate: Date, totalBusinessDays: number): number {
  const deadline = addBusinessDays(startDate, totalBusinessDays);
  const now = new Date();
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

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => boolean;
  register: (data: Omit<User, 'id' | 'isAdmin'> & { senha: string }) => boolean;
  logout: () => void;
  updateProfile: (data: Partial<Omit<User, 'id' | 'isAdmin'>>) => void;
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'numero' | 'dataCriacao' | 'horaCriacao' | 'diasRestantes' | 'historico' | 'status'> & { numeroPedido?: string }) => void;
  deleteOrder: (id: string) => void;
  updateOrder: (id: string, data: Partial<Order>) => void;
  recoverPassword: (cpfCnpj: string, digits: string) => boolean;
  allOrders: Order[];
}

const AuthContext = createContext<AuthContextType | null>(null);

const generateMockOrders = (): Order[] => {
  const models = ["Texana Clássica", "Country Premium", "Rodeio Special", "Selaria Gold", "Cowboy Elite"];
  const statuses = ["Em aberto", "Corte", "Bordado 7Estrivos", "Montagem", "Revisão", "Expedição", "Entregue", "Pago"];
  const vendedores = ["Revendedor Demo", "Samuel", "Carlos", "Fernanda"];

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
      modelo: models[i % models.length],
      solado: "Borracha Tratorada",
      formatoBico: "Quadrado",
      corVira: "Natural",
      couroGaspea: "Floater Tabaco",
      couroCano: "Floater Tabaco",
      couroTaloneira: "Floater Tabaco",
      bordadoCano: "Floral",
      bordadoGaspea: "Liso",
      bordadoTaloneira: "Floral",
      personalizacaoNome: "",
      personalizacaoBordado: "",
      corLinha: "Bege",
      corBorrachinha: "Marrom",
      trisce: "Sim",
      tiras: "Sem",
      metais: "Fivela Prata",
      acessorios: "",
      desenvolvimento: "",
      sobMedida: false,
      observacao: "",
      quantidade: Math.floor(Math.random() * 3) + 1,
      preco: 800 + Math.floor(Math.random() * 1200),
      status: statuses[statusIdx],
      dataCriacao: createdDate.toISOString().split('T')[0],
      horaCriacao: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      diasRestantes: businessDaysRemaining(createdDate, totalBizDays),
      temLaser,
      fotos: [],
      historico: PRODUCTION_STATUSES.slice(0, statusIdx + 1).map((s, j) => {
        const d = new Date(createdDate);
        d.setDate(d.getDate() + j * 2);
        return { data: d.toISOString().split('T')[0], local: s, descricao: `Pedido movido para ${s}` };
      }),
    };
  });
};

const registeredUsers: (User & { senha: string })[] = [];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>(generateMockOrders());

  const isAdmin = user?.isAdmin === true;

  const login = useCallback((username: string, password: string) => {
    const found = registeredUsers.find(u => u.nomeUsuario === username && u.senha === password);
    if (found) {
      const { senha, ...userData } = found;
      setUser(userData);
      return true;
    }
    // Admin login
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
    // Demo login
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

  const addOrder = useCallback((orderData: Omit<Order, 'id' | 'numero' | 'dataCriacao' | 'horaCriacao' | 'diasRestantes' | 'historico' | 'status'> & { numeroPedido?: string }) => {
    const { numeroPedido, ...rest } = orderData;
    const now = new Date();
    const totalBizDays = rest.temLaser ? 30 : 10;
    const newOrder: Order = {
      ...rest,
      id: `order-${Date.now()}`,
      numero: numeroPedido || `7E-${now.getFullYear()}${String(orders.length + 1).padStart(4, '0')}`,
      dataCriacao: now.toISOString().split('T')[0],
      horaCriacao: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      diasRestantes: totalBizDays,
      status: 'Em aberto',
      historico: [{ data: now.toISOString().split('T')[0], local: 'Em aberto', descricao: 'Pedido criado' }],
    };
    setOrders(prev => [newOrder, ...prev]);
  }, [orders.length]);

  // For regular users, only show their own orders
  const userOrders = user?.isAdmin ? orders : orders.filter(o => o.vendedor === user?.nomeCompleto);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isAdmin, login, register, logout, updateProfile, orders: userOrders, addOrder, recoverPassword, allOrders: orders }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
