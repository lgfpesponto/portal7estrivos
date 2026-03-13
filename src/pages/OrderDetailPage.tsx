import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, Clock, CheckCircle2 } from 'lucide-react';

const PRODUCTION_STEPS = [
  "Em aberto", "Corte", "Bordado Dinei", "Bordado 7Estrivos", "Pesponto 01",
  "Pesponto 02", "Montagem", "Revisão", "Expedição", "Entregue"
];

const OrderDetailPage = () => {
  const { id } = useParams();
  const { orders } = useAuth();
  const navigate = useNavigate();
  const order = orders.find(o => o.id === id);

  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">Pedido não encontrado.</p>
      </div>
    );
  }

  const currentStepIndex = PRODUCTION_STEPS.indexOf(order.status);
  const isLate = order.diasRestantes <= 0 && order.status !== 'Entregue' && order.status !== 'Pago';
  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const whatsappMessage = encodeURIComponent(
    `Olá, gostaria de saber como está o andamento deste pedido.\n\nPedido: ${order.numero}\nModelo: ${order.modelo}\nCliente: ${order.vendedor}\nDetalhes: Tam. ${order.tamanho}, ${order.couroGaspea}, ${order.bordadoCano}`
  );
  const whatsappUrl = `https://wa.me/5500000000000?text=${whatsappMessage}`;

  const details = [
    ['Vendedor', order.vendedor], ['Modelo', order.modelo], ['Tamanho', order.tamanho],
    ['Solado', order.solado], ['Formato do Bico', order.formatoBico], ['Cor da Vira', order.corVira],
    ['Couro Gáspea', order.couroGaspea], ['Couro Cano', order.couroCano], ['Couro Taloneira', order.couroTaloneira],
    ['Bordado Cano', order.bordadoCano], ['Bordado Gáspea', order.bordadoGaspea], ['Bordado Taloneira', order.bordadoTaloneira],
    ['Cor Linha', order.corLinha], ['Cor Borrachinha', order.corBorrachinha], ['Trisce', order.trisce],
    ['Tiras', order.tiras], ['Metais', order.metais], ['Acessórios', order.acessorios],
    ['Quantidade', String(order.quantidade)], ['Valor', formatCurrency(order.preco * order.quantidade)],
  ].filter(([, v]) => v);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className="bg-card rounded-xl p-6 md:p-8 western-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-display font-bold">{order.numero}</h1>
              <p className="text-muted-foreground">{order.modelo}</p>
            </div>
            <span className="text-2xl font-bold text-primary">{formatCurrency(order.preco * order.quantidade)}</span>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <h2 className="text-lg font-display font-bold mb-4">Progresso da Produção</h2>
            <div className="relative">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full orange-gradient rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, ((currentStepIndex + 1) / PRODUCTION_STEPS.length) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                {PRODUCTION_STEPS.map((step, i) => (
                  <div key={step} className={`text-center ${i <= currentStepIndex ? 'text-primary' : 'text-muted-foreground/40'}`} style={{ width: `${100 / PRODUCTION_STEPS.length}%` }}>
                    <div className={`w-3 h-3 mx-auto rounded-full mb-1 ${i <= currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />
                    <span className="text-[9px] leading-tight block">{step}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm">
              <Clock size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground">
                {order.diasRestantes > 0 ? `${order.diasRestantes} dias restantes` : order.status === 'Entregue' || order.status === 'Pago' ? 'Concluído' : 'Prazo expirado'}
              </span>
            </div>
          </div>

          {isLate && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-green-600 text-primary-foreground py-3 rounded-lg font-bold mb-6 hover:bg-green-700 transition-colors">
              <MessageCircle size={18} /> PERGUNTAR SOBRE O PEDIDO
            </a>
          )}

          {/* Order details */}
          <h2 className="text-lg font-display font-bold mb-3">Detalhes da Bota</h2>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mb-6">
            {details.map(([label, value]) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold">{value}</span>
              </div>
            ))}
          </div>

          {order.observacao && (
            <div className="bg-muted rounded-lg p-3 mb-6">
              <p className="text-sm font-semibold mb-1">Observação:</p>
              <p className="text-sm text-muted-foreground">{order.observacao}</p>
            </div>
          )}

          {/* Production history */}
          <h2 className="text-lg font-display font-bold mb-3">Histórico de Produção</h2>
          <div className="space-y-3">
            {order.historico.map((h, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <CheckCircle2 size={18} className="text-primary flex-shrink-0" />
                  {i < order.historico.length - 1 && <div className="w-0.5 h-full bg-border mt-1" />}
                </div>
                <div className="pb-3">
                  <p className="text-sm font-semibold">{h.local}</p>
                  <p className="text-xs text-muted-foreground">{h.data} — {h.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderDetailPage;
