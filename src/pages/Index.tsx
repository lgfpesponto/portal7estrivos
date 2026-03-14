import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Eye, BarChart3, AlertCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Index = () => {
  const { isLoggedIn, orders } = useAuth();
  const [chartPeriod, setChartPeriod] = useState<'dia' | 'semana' | 'mes' | 'ano'>('mes');

  const financialData = useMemo(() => {
    const totalAno = orders.reduce((s, o) => s + o.preco * o.quantidade, 0);
    const pago = orders.filter(o => o.status === 'Pago' || o.status === 'Entregue').reduce((s, o) => s + o.preco * o.quantidade, 0);
    const pendente = totalAno - pago;
    return { pendente };
  }, [orders]);

  const chartData = useMemo(() => {
    const data: { name: string; botas: number }[] = [];
    const now = new Date();

    if (chartPeriod === 'dia') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = d.toISOString().split('T')[0];
        data.push({ name: `${d.getDate()}/${d.getMonth() + 1}`, botas: orders.filter(o => o.dataCriacao === key).reduce((s, o) => s + o.quantidade, 0) });
      }
    } else if (chartPeriod === 'semana') {
      for (let i = 3; i >= 0; i--) {
        const end = new Date(now.getTime() - i * 7 * 86400000);
        const start = new Date(end.getTime() - 7 * 86400000);
        const botas = orders.filter(o => o.dataCriacao >= start.toISOString().split('T')[0] && o.dataCriacao <= end.toISOString().split('T')[0]).reduce((s, o) => s + o.quantidade, 0);
        data.push({ name: `Sem ${4 - i}`, botas });
      }
    } else if (chartPeriod === 'mes') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const botas = orders.filter(o => o.dataCriacao >= d.toISOString().split('T')[0] && o.dataCriacao <= monthEnd.toISOString().split('T')[0]).reduce((s, o) => s + o.quantidade, 0);
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        data.push({ name: months[d.getMonth()], botas });
      }
    } else {
      for (let i = 2; i >= 0; i--) {
        const year = now.getFullYear() - i;
        const botas = orders.filter(o => o.dataCriacao.startsWith(`${year}`)).reduce((s, o) => s + o.quantidade, 0);
        data.push({ name: `${year}`, botas });
      }
    }
    return data;
  }, [chartPeriod, orders]);

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="min-h-screen">
      {/* Hero - solid orange */}
      <section className="relative overflow-hidden flex items-center bg-primary" style={{ minHeight: '320px' }}>
        <div className="relative z-10 container mx-auto px-4 py-12">
          <motion.div initial="hidden" animate="visible" className="max-w-lg">
            <motion.h1 variants={fadeIn} custom={0} className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Página de Representantes
            </motion.h1>
            <motion.p variants={fadeIn} custom={1} className="text-white/90 text-lg mb-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Crie fichas de produção, acompanhe seus pedidos e gerencie suas vendas no portal exclusivo para revendedores.
            </motion.p>
            <motion.div variants={fadeIn} custom={2} className="flex gap-3 flex-wrap">
              <Link to="/pedido" className="bg-white text-primary px-6 py-3 rounded-lg font-bold tracking-wider hover:bg-white/90 transition-opacity inline-flex items-center gap-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                <ShoppingBag size={18} /> FAÇA SEU PEDIDO
              </Link>
              <Link to="/relatorios" className="bg-white/20 backdrop-blur text-white border border-white/40 px-6 py-3 rounded-lg font-bold tracking-wider hover:bg-white/30 transition-colors inline-flex items-center gap-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                <Eye size={18} /> MEUS PEDIDOS
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Dashboard content */}
      {isLoggedIn ? (
        <section className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left column */}
            <div className="space-y-6">
              {/* Sales chart - quantity */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={0} className="bg-card rounded-xl p-6 western-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-display font-bold flex items-center gap-2">
                    <BarChart3 className="text-primary" size={22} /> Botas Vendidas
                  </h2>
                </div>
                <div className="flex gap-2 mb-4 flex-wrap">
                  {(['dia', 'semana', 'mes', 'ano'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setChartPeriod(p)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
                        chartPeriod === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-primary/10'
                      }`}
                    >
                      {p === 'mes' ? 'Mês' : p}
                    </button>
                  ))}
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 20% 80%)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(20 10% 40%)' }} />
                      <YAxis tick={{ fontSize: 12, fill: 'hsl(20 10% 40%)' }} />
                      <Tooltip formatter={(v: number) => [v, 'Botas']} />
                      <Line type="monotone" dataKey="botas" stroke="hsl(25 85% 48%)" strokeWidth={3} dot={{ fill: 'hsl(25 85% 48%)', r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

            </div>

            {/* Right column - only Pendente */}
            <div className="space-y-6">
              <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={0} className="bg-card rounded-xl p-6 western-shadow">
                <h2 className="text-xl font-display font-bold flex items-center gap-2 mb-4">
                  <AlertCircle className="text-primary" size={22} /> Pendente
                </h2>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Valor Pendente</p>
                  <p className="text-3xl font-bold text-primary mt-1">{formatCurrency(financialData.pendente)}</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      ) : (
        <section className="container mx-auto px-4 py-12 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={0}>
            <h2 className="text-2xl font-display font-bold mb-4">Faça login para acessar o dashboard</h2>
            <p className="text-muted-foreground mb-6">Acesse sua conta de revendedor para ver vendas, pedidos e relatórios.</p>
            <Link to="/login" className="orange-gradient text-primary-foreground px-8 py-3 rounded-lg font-bold tracking-wider hover:opacity-90 transition-opacity inline-block">
              ENTRAR
            </Link>
          </motion.div>
        </section>
      )}
    </div>
  );
};

export default Index;
