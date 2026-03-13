import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Eye, Calculator, BarChart3, DollarSign, TrendingUp, CreditCard, AlertCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import heroBoots from '@/assets/hero-boots.jpg';
import BootCalculator from '@/components/BootCalculator';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Index = () => {
  const { isLoggedIn, orders } = useAuth();
  const [chartPeriod, setChartPeriod] = useState<'dia' | 'semana' | 'mes' | 'ano'>('mes');

  const financialData = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0];

    const totalHoje = orders.filter(o => o.dataCriacao === today).reduce((s, o) => s + o.preco * o.quantidade, 0);
    const totalSemana = orders.filter(o => o.dataCriacao >= weekAgo).reduce((s, o) => s + o.preco * o.quantidade, 0);
    const totalMes = orders.filter(o => o.dataCriacao >= monthAgo).reduce((s, o) => s + o.preco * o.quantidade, 0);
    const totalAno = orders.reduce((s, o) => s + o.preco * o.quantidade, 0);
    const pago = orders.filter(o => o.status === 'Pago' || o.status === 'Entregue').reduce((s, o) => s + o.preco * o.quantidade, 0);
    const pendente = totalAno - pago;

    return { totalHoje, totalSemana, totalMes, totalAno, pago, pendente };
  }, [orders]);

  const chartData = useMemo(() => {
    const data: { name: string; vendas: number }[] = [];
    const now = new Date();

    if (chartPeriod === 'dia') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = d.toISOString().split('T')[0];
        data.push({ name: `${d.getDate()}/${d.getMonth() + 1}`, vendas: orders.filter(o => o.dataCriacao === key).reduce((s, o) => s + o.preco * o.quantidade, 0) });
      }
    } else if (chartPeriod === 'semana') {
      for (let i = 3; i >= 0; i--) {
        const end = new Date(now.getTime() - i * 7 * 86400000);
        const start = new Date(end.getTime() - 7 * 86400000);
        const vendas = orders.filter(o => o.dataCriacao >= start.toISOString().split('T')[0] && o.dataCriacao <= end.toISOString().split('T')[0]).reduce((s, o) => s + o.preco * o.quantidade, 0);
        data.push({ name: `Sem ${4 - i}`, vendas });
      }
    } else if (chartPeriod === 'mes') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const vendas = orders.filter(o => o.dataCriacao >= d.toISOString().split('T')[0] && o.dataCriacao <= monthEnd.toISOString().split('T')[0]).reduce((s, o) => s + o.preco * o.quantidade, 0);
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        data.push({ name: months[d.getMonth()], vendas });
      }
    } else {
      for (let i = 2; i >= 0; i--) {
        const year = now.getFullYear() - i;
        const vendas = orders.filter(o => o.dataCriacao.startsWith(`${year}`)).reduce((s, o) => s + o.preco * o.quantidade, 0);
        data.push({ name: `${year}`, vendas });
      }
    }
    return data;
  }, [chartPeriod, orders]);

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Hero section for non-logged in users or always on top
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[360px] overflow-hidden flex items-center">
        <div className="absolute inset-0">
          <img src={heroBoots} alt="Botas texanas artesanais" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/80 via-charcoal/50 to-transparent" />
        </div>
        <div className="relative z-10 container mx-auto px-4">
          <motion.div initial="hidden" animate="visible" className="max-w-lg">
            <motion.h1 variants={fadeIn} custom={0} className="text-4xl md:text-5xl font-display font-bold text-cream mb-4">
              Botas Texanas <span className="text-gradient-western">Personalizadas</span>
            </motion.h1>
            <motion.p variants={fadeIn} custom={1} className="text-cream/80 text-lg mb-6 font-body">
              Crie fichas de produção, acompanhe seus pedidos e gerencie suas vendas no portal exclusivo para revendedores.
            </motion.p>
            <motion.div variants={fadeIn} custom={2} className="flex gap-3 flex-wrap">
              <Link to="/pedido" className="orange-gradient text-primary-foreground px-6 py-3 rounded-lg font-bold tracking-wider hover:opacity-90 transition-opacity inline-flex items-center gap-2">
                <ShoppingBag size={18} /> FAÇA SEU PEDIDO
              </Link>
              <Link to="/acompanhar" className="bg-cream/10 backdrop-blur text-cream border border-cream/30 px-6 py-3 rounded-lg font-bold tracking-wider hover:bg-cream/20 transition-colors inline-flex items-center gap-2">
                <Eye size={18} /> ACOMPANHAR
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
              {/* Sales chart */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={0} className="bg-card rounded-xl p-6 western-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-display font-bold flex items-center gap-2">
                    <BarChart3 className="text-primary" size={22} /> Gráfico de Vendas
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
                      <YAxis tick={{ fontSize: 12, fill: 'hsl(20 10% 40%)' }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => [formatCurrency(v), 'Vendas']} />
                      <Line type="monotone" dataKey="vendas" stroke="hsl(25 85% 48%)" strokeWidth={3} dot={{ fill: 'hsl(25 85% 48%)', r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Orders link */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={1}>
                <Link to="/relatorios" className="block bg-card rounded-xl p-6 western-shadow hover:shadow-xl transition-shadow group">
                  <h2 className="text-xl font-display font-bold flex items-center gap-2 group-hover:text-primary transition-colors">
                    <TrendingUp className="text-primary" size={22} /> Meus Pedidos / Relatórios
                  </h2>
                  <p className="text-muted-foreground mt-2">Visualize todos os seus pedidos e gere relatórios detalhados.</p>
                </Link>
              </motion.div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Financial summary */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={0} className="bg-card rounded-xl p-6 western-shadow">
                <h2 className="text-xl font-display font-bold flex items-center gap-2 mb-4">
                  <DollarSign className="text-primary" size={22} /> Relatório Financeiro
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Hoje', value: financialData.totalHoje },
                    { label: 'Semana', value: financialData.totalSemana },
                    { label: 'Mês', value: financialData.totalMes },
                    { label: 'Ano', value: financialData.totalAno },
                  ].map(item => (
                    <div key={item.label} className="bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{item.label}</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(item.value)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1"><CreditCard size={14} /> Total Pago</span>
                    <span className="font-bold text-green-700">{formatCurrency(financialData.pago)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1"><AlertCircle size={14} /> Pendente</span>
                    <span className="font-bold text-primary">{formatCurrency(financialData.pendente)}</span>
                  </div>
                </div>
              </motion.div>

              {/* Boot calculator */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={1}>
                <BootCalculator />
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
