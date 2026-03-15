import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, businessDaysRemaining } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Clock, History } from 'lucide-react';
import {
  MODELOS, ACESSORIOS, BORDADOS, COURO_PRECOS, SOLADO, COR_SOLA, COR_VIRA,
  CARIMBO, AREA_METAL, DESENVOLVIMENTO,
  SOB_MEDIDA_PRECO, NOME_BORDADO_PRECO, ESTAMPA_PRECO, PINTURA_PRECO,
  TRICE_PRECO, TIRAS_PRECO, COSTURA_ATRAS_PRECO, STRASS_PRECO, CRUZ_METAL_PRECO,
  BRIDAO_METAL_PRECO, LASER_CANO_PRECO, LASER_GASPEA_PRECO, GLITTER_CANO_PRECO, GLITTER_GASPEA_PRECO,
} from '@/lib/orderFieldsConfig';

const OrderDetailPage = () => {
  const { id } = useParams();
  const { orders, isAdmin } = useAuth();
  const navigate = useNavigate();
  const order = orders.find(o => o.id === id);
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (order && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, orderBarcodeValue(order.numero), {
          format: 'CODE128', width: 1.5, height: 40, displayValue: true,
          text: order.numero, fontSize: 12, margin: 5,
        });
      } catch { /* ignore */ }
    }
  }, [order]);

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

  // Calculate days remaining
  const createdDate = new Date(order.dataCriacao + 'T00:00:00');
  const totalBizDays = order.temLaser ? 30 : 10;
  const daysLeft = businessDaysRemaining(createdDate, totalBizDays);

  // Build details list (only filled fields)
  const details: [string, string][] = [
    ['Modelo', order.modelo],
    ['Tamanho', order.tamanho ? `${order.tamanho}${order.genero ? ' — ' + order.genero : ''}` : ''],
    ['Sob Medida', order.sobMedida ? `Sim${order.sobMedidaDesc ? ' — ' + order.sobMedidaDesc : ''}` : ''],
    ['Acessórios', order.acessorios],
    ['Tipo Couro Cano', order.couroCano],
    ['Cor Couro Cano', order.corCouroCano || ''],
    ['Tipo Couro Gáspea', order.couroGaspea],
    ['Cor Couro Gáspea', order.corCouroGaspea || ''],
    ['Tipo Couro Taloneira', order.couroTaloneira],
    ['Cor Couro Taloneira', order.corCouroTaloneira || ''],
    ['Desenvolvimento', order.desenvolvimento],
    ['Bordado Cano', order.bordadoCano],
    ['Cor Bordado Cano', order.corBordadoCano || ''],
    ['Bordado Gáspea', order.bordadoGaspea],
    ['Cor Bordado Gáspea', order.corBordadoGaspea || ''],
    ['Bordado Taloneira', order.bordadoTaloneira],
    ['Cor Bordado Taloneira', order.corBordadoTaloneira || ''],
    ['Nome Bordado', order.nomeBordadoDesc || order.personalizacaoNome || ''],
    ['Laser Cano', order.laserCano || ''],
    ['Cor Glitter/Tecido Cano', order.corGlitterCano || ''],
    ['Laser Gáspea', order.laserGaspea || ''],
    ['Cor Glitter/Tecido Gáspea', order.corGlitterGaspea || ''],
    ['Laser Taloneira', order.laserTaloneira || ''],
    ['Cor Glitter/Tecido Taloneira', order.corGlitterTaloneira || ''],
    ['Pintura', order.pintura === 'Sim' ? (order.pinturaDesc || 'Sim') : ''],
    ['Estampa', order.estampa === 'Sim' ? (order.estampaDesc ? `Sim — ${order.estampaDesc}` : 'Sim') : ''],
    ['Cor da Linha', order.corLinha],
    ['Cor Borrachinha', order.corBorrachinha],
    ['Cor do Vivo', order.corVivo || ''],
    ['Área Metal', order.metais],
    ['Tipo Metal', order.tipoMetal || ''],
    ['Cor Metal', order.corMetal || ''],
    ['Strass', order.strassQtd ? `${order.strassQtd} un.` : ''],
    ['Cruz (metal)', order.cruzMetalQtd ? `${order.cruzMetalQtd} un.` : ''],
    ['Bridão (metal)', order.bridaoMetalQtd ? `${order.bridaoMetalQtd} un.` : ''],
    ['Tricê', order.trisce === 'Sim' ? (order.triceDesc || 'Sim') : ''],
    ['Tiras', order.tiras === 'Sim' ? (order.tirasDesc || 'Sim') : ''],
    ['Solado', order.solado],
    ['Formato do Bico', order.formatoBico || ''],
    ['Cor da Sola', order.corSola || ''],
    ['Cor da Vira', order.corVira || ''],
    ['Costura Atrás', order.costuraAtras === 'Sim' ? 'Sim' : ''],
    ['Carimbo a Fogo', order.carimbo ? `${order.carimbo}${order.carimboDesc ? ' — ' + order.carimboDesc : ''}` : ''],
    ['Adicional', order.adicionalDesc ? `${order.adicionalDesc}${order.adicionalValor ? ` — ${formatCurrency(order.adicionalValor)}` : ''}` : ''],
  ].filter(([, v]) => v) as [string, string][];

  // Build price breakdown list
  const priceItems: [string, number][] = [];
  const modeloP = MODELOS.find(m => m.label === order.modelo)?.preco;
  if (modeloP) priceItems.push(['Modelo: ' + order.modelo, modeloP]);
  if (order.sobMedida) priceItems.push(['Sob Medida', SOB_MEDIDA_PRECO]);
  if (order.acessorios) {
    order.acessorios.split(', ').filter(Boolean).forEach(a => {
      const p = ACESSORIOS.find(x => x.label === a)?.preco;
      if (p) priceItems.push([a, p]);
    });
  }
  [order.couroCano, order.couroGaspea, order.couroTaloneira].forEach(t => {
    if (t && COURO_PRECOS[t]) priceItems.push(['Couro: ' + t, COURO_PRECOS[t]]);
  });
  const desenvP = DESENVOLVIMENTO.find(d => d.label === order.desenvolvimento)?.preco;
  if (desenvP) priceItems.push(['Desenvolvimento: ' + order.desenvolvimento, desenvP]);
  [order.bordadoCano, order.bordadoGaspea, order.bordadoTaloneira].forEach(bStr => {
    if (bStr) bStr.split(', ').filter(Boolean).forEach(b => {
      const p = BORDADOS.find(x => x.label === b)?.preco;
      if (p) priceItems.push([b, p]);
    });
  });
  if (order.nomeBordadoDesc || order.personalizacaoNome) priceItems.push(['Nome Bordado', NOME_BORDADO_PRECO]);
  if (order.laserCano) priceItems.push(['Laser Cano', LASER_CANO_PRECO]);
  if (order.corGlitterCano) priceItems.push(['Glitter/Tecido Cano', GLITTER_CANO_PRECO]);
  if (order.laserGaspea) priceItems.push(['Laser Gáspea', LASER_GASPEA_PRECO]);
  if (order.corGlitterGaspea) priceItems.push(['Glitter/Tecido Gáspea', GLITTER_GASPEA_PRECO]);
  if (order.pintura === 'Sim') priceItems.push(['Pintura', PINTURA_PRECO]);
  if (order.estampa === 'Sim') priceItems.push(['Estampa', ESTAMPA_PRECO]);
  const areaP = AREA_METAL.find(a => a.label === order.metais)?.preco;
  if (areaP) priceItems.push(['Área Metal: ' + order.metais, areaP]);
  if (order.strassQtd) priceItems.push([`Strass (${order.strassQtd} un.)`, order.strassQtd * STRASS_PRECO]);
  if (order.cruzMetalQtd) priceItems.push([`Cruz metal (${order.cruzMetalQtd} un.)`, order.cruzMetalQtd * CRUZ_METAL_PRECO]);
  if (order.bridaoMetalQtd) priceItems.push([`Bridão metal (${order.bridaoMetalQtd} un.)`, order.bridaoMetalQtd * BRIDAO_METAL_PRECO]);
  if (order.trisce === 'Sim') priceItems.push(['Tricê', TRICE_PRECO]);
  if (order.tiras === 'Sim') priceItems.push(['Tiras', TIRAS_PRECO]);
  const soladoP = SOLADO.find(s => s.label === order.solado)?.preco;
  if (soladoP) priceItems.push(['Solado: ' + order.solado, soladoP]);
  const corSolaP = COR_SOLA.find(c => c.label === order.corSola)?.preco;
  if (corSolaP) priceItems.push(['Cor Sola: ' + order.corSola, corSolaP]);
  const corViraP = COR_VIRA.find(c => c.label === order.corVira)?.preco;
  if (corViraP) priceItems.push(['Cor Vira: ' + order.corVira, corViraP]);
  if (order.costuraAtras === 'Sim') priceItems.push(['Costura Atrás', COSTURA_ATRAS_PRECO]);
  const carimboP = CARIMBO.find(c => c.label === order.carimbo)?.preco;
  if (carimboP) priceItems.push([order.carimbo!, carimboP]);
  if (order.adicionalValor && order.adicionalValor > 0) priceItems.push(['Adicional: ' + (order.adicionalDesc || ''), order.adicionalValor]);
  const totalCalc = priceItems.reduce((s, [, v]) => s + v, 0);

  const alteracoes = order.alteracoes || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className="bg-card rounded-xl p-6 md:p-8 western-shadow">
          {/* Header: order number + vendedor (admin only) + value */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold">{order.numero}</h1>
              {isAdmin && <span className="text-sm text-muted-foreground">— {order.vendedor}</span>}
            </div>
            <span className="text-2xl font-bold text-primary">{formatCurrency(order.preco * order.quantidade)}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            {formatDateBR(order.dataCriacao)} — {order.horaCriacao || ''}
          </p>
          {/* Days remaining */}
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} className="text-primary" />
            <span className="text-sm font-semibold">
              {daysLeft > 0 ? `${daysLeft} dias úteis restantes` : 'Prazo atingido ✓'}
            </span>
            <span className="text-xs text-muted-foreground">
              (prazo: {totalBizDays} dias úteis{order.temLaser ? ' — com laser' : ''})
            </span>
          </div>


          {/* Production History + Change History side by side */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Histórico de Produção */}
            <div>
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
                      <p className="text-xs text-muted-foreground">{formatDateBR(h.data)} às {h.hora || '—'} — {h.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Histórico de Alterações */}
            <div>
              <h2 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                <History size={18} /> Histórico de Alterações
              </h2>
              {alteracoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma alteração registrada.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {alteracoes.map((a, i) => (
                    <div key={i} className="border-b border-border/30 pb-2">
                      <p className="text-xs text-muted-foreground">{formatDateBR(a.data)} às {a.hora}</p>
                      <p className="text-sm">{a.descricao}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detalhes da Bota */}
          <h2 className="text-lg font-display font-bold mb-3">Detalhes da Bota</h2>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mb-6">
            {details.map(([label, value]) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold text-right max-w-[60%]">{value}</span>
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
              <h2 className="text-lg font-display font-bold mb-3">Foto de Referência</h2>
              <div className="flex flex-wrap gap-3">
                {order.fotos.map((f, i) => (
                  <img key={i} src={f} alt={`Ref ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border border-border" />
                ))}
              </div>
            </div>
          )}

          {/* Composição do Pedido */}
          <h2 className="text-lg font-display font-bold mb-3">Composição do Pedido</h2>
          <div className="border border-border rounded-lg p-4 mb-2">
            {priceItems.map(([label, value], i) => (
              <div key={i} className="flex justify-between py-1 border-b border-border/30 last:border-0">
                <span className="text-sm">{label}</span>
                <span className="text-sm font-semibold">{formatCurrency(value)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 mt-2 border-t border-border font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(totalCalc || order.preco * order.quantidade)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderDetailPage;
