import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface User {
  id: string;
  nomeCompleto: string;
  nomeUsuario: string;
  telefone: string;
  email: string;
  cpfCnpj: string;
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
  diasRestantes: number;
  historico: { data: string; local: string; descricao: string }[];
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => boolean;
  register: (data: Omit<User, 'id'> & { senha: string }) => boolean;
  logout: () => void;
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'numero' | 'dataCriacao' | 'diasRestantes' | 'historico' | 'status'> & { numeroPedido?: string }) => void;
  recoverPassword: (cpfCnpj: string, digits: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PRODUCTION_STATUSES = [
  "Em aberto", "Corte", "Bordado Dinei", "Bordado 7Estrivos", "Pesponto 01",
  "Pesponto 02", "Montagem", "Revisão", "Expedição", "Entregue"
];

const generateMockOrders = (): Order[] => {
  const models = ["Texana Clássica", "Country Premium", "Rodeio Special", "Selaria Gold", "Cowboy Elite"];
  const statuses = ["Em aberto", "Corte", "Bordado 7Estrivos", "Montagem", "Revisão", "Expedição", "Entregue", "Pago"];
  
  return Array.from({ length: 8 }, (_, i) => {
    const statusIdx = Math.floor(Math.random() * statuses.length);
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - daysAgo);
    
    return {
      id: `order-${i + 1}`,
      numero: `7E-${2024}${String(i + 1).padStart(4, '0')}`,
      vendedor: "Revendedor Demo",
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
      diasRestantes: Math.max(0, 25 - daysAgo),
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

  const login = useCallback((username: string, password: string) => {
    const found = registeredUsers.find(u => u.nomeUsuario === username && u.senha === password);
    if (found) {
      const { senha, ...userData } = found;
      setUser(userData);
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

  const register = useCallback((data: Omit<User, 'id'> & { senha: string }) => {
    if (registeredUsers.some(u => u.nomeUsuario === data.nomeUsuario)) return false;
    const newUser = { ...data, id: `user-${Date.now()}` };
    registeredUsers.push(newUser);
    const { senha, ...userData } = newUser;
    setUser(userData);
    return true;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const recoverPassword = useCallback((cpfCnpj: string, digits: string) => {
    // Demo: accept if digits match start of any registered user or demo
    return digits === '123' || registeredUsers.some(u => u.cpfCnpj.startsWith(digits));
  }, []);

  const addOrder = useCallback((orderData: Omit<Order, 'id' | 'numero' | 'dataCriacao' | 'diasRestantes' | 'historico' | 'status'> & { numeroPedido?: string }) => {
    const { numeroPedido, ...rest } = orderData;
    const newOrder: Order = {
      ...rest,
      id: `order-${Date.now()}`,
      numero: numeroPedido || `7E-${new Date().getFullYear()}${String(orders.length + 1).padStart(4, '0')}`,
      dataCriacao: new Date().toISOString().split('T')[0],
      diasRestantes: 25,
      status: 'Em aberto',
      historico: [{ data: new Date().toISOString().split('T')[0], local: 'Em aberto', descricao: 'Pedido criado' }],
    };
    setOrders(prev => [newOrder, ...prev]);
  }, [orders.length]);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, register, logout, orders, addOrder, recoverPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
