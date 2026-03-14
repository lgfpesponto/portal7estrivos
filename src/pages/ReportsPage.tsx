import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Filter, FileText, Download } from 'lucide-react';

const ReportsPage = () => {
  const { isLoggedIn, orders } = useAuth();
  const navigate = useNavigate();
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (searchQuery && !o.numero.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterDate && o.dataCriacao < filterDate) return false;
      if (filterStatus && o.status !== filterStatus) return false;
      return true;
    });
  }, [orders, filterDate, filterStatus, searchQuery]);

  const totalValue = filteredOrders.reduce((s, o) => s + o.preco * o.quantidade, 0);
  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const allStatuses = [...new Set(orders.map(o => o.status))].sort();

  if (!isLoggedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-display font-bold mb-2">Faça login para ver relatórios</h2>
          <button onClick={() => navigate('/login')} className="orange-gradient text-primary-foreground px-6 py-2 rounded-lg font-bold">LOGIN</button>
        </div>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold mb-6">MEUS PEDIDOS</h1>

        {/* Filters */}
        <div className="bg-card rounded-xl p-4 western-shadow mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-primary" />
            <span className="text-sm font-bold">Filtros</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Buscar por Nº do Pedido</label>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Ex: 7E-2024..." className="bg-muted rounded-lg px-3 py-2 text-sm border border-border focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Data de Criação (a partir de)</label>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="bg-muted rounded-lg px-3 py-2 text-sm border border-border focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Local da Produção</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-muted rounded-lg px-3 py-2 text-sm border border-border focus:border-primary outline-none">
                <option value="">Todos</option>
                {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl p-4 western-shadow">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Total de Pedidos</p>
            <p className="text-2xl font-bold">{filteredOrders.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 western-shadow">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Valor Total</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</p>
          </div>
          <div className="bg-card rounded-xl p-4 western-shadow flex items-center justify-center">
            <button className="orange-gradient text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
              <FileText size={16} /> GERAR RELATÓRIO
            </button>
          </div>
        </div>

        {/* Orders list */}
        <div className="space-y-3">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              onClick={() => navigate(`/pedido/${order.id}`)}
              className="bg-card rounded-xl p-4 western-shadow hover:shadow-xl transition-shadow cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-display font-bold">{order.numero}</span>
                  <span className="text-sm text-muted-foreground ml-2">— {order.modelo}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">{order.dataCriacao}</span>
                  <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-bold">{order.status}</span>
                  <span className="font-bold text-primary">{formatCurrency(order.preco * order.quantidade)}</span>
                  <span className="text-xs text-muted-foreground">{order.diasRestantes > 0 ? `${order.diasRestantes}d` : '✓'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum pedido encontrado com esses filtros.</p>
        )}
      </motion.div>
    </div>
  );
};

export default ReportsPage;
