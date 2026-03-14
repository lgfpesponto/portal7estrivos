import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, PRODUCTION_STATUSES, PRODUCTION_STATUSES_USER } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

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

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDateBR = (date: string) => {
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y}`;
  };

  const details = [
    ['Modelo', order.modelo], ['Vendedor', order.vendedor], ['Tamanho', order.tamanho],
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
          {/* 1 - Número do pedido + valor */}
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-display font-bold">{order.numero}</h1>
            <span className="text-2xl font-bold text-primary">{formatCurrency(order.preco * order.quantidade)}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {formatDateBR(order.dataCriacao)} — {order.horaCriacao || ''}
          </p>

          {/* 2 - Histórico de Produção */}
          <h2 className="text-lg font-display font-bold mb-3">Histórico de Produção</h2>
          <div className="space-y-3 mb-8">
            {order.historico.map((h, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <CheckCircle2 size={18} className="text-primary flex-shrink-0" />
                  {i < order.historico.length - 1 && <div className="w-0.5 h-full bg-border mt-1" />}
                </div>
                <div className="pb-3">
                  <p className="text-sm font-semibold">{h.local}</p>
                  <p className="text-xs text-muted-foreground">{formatDateBR(h.data)} — {h.descricao}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 3 - Detalhes da Bota */}
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

          {/* Fotos */}
          {order.fotos && order.fotos.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-display font-bold mb-3">Fotos de Referência</h2>
              <div className="flex flex-wrap gap-3">
                {order.fotos.map((f, i) => (
                  <img key={i} src={f} alt={`Ref ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border border-border" />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default OrderDetailPage;
