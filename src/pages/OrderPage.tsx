import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { saveDraft, deleteDraft, Draft } from '@/lib/drafts';
import { Upload, X, Eye } from 'lucide-react';

const ORDER_FIELDS = [
  { key: 'tamanho', label: 'Tamanho', options: ['34','35','36','37','38','39','40','41','42','43','44','45'] },
  { key: 'modelo', label: 'Modelo', options: ['Texana Clássica','Country Premium','Rodeio Special','Selaria Gold','Cowboy Elite'] },
  { key: 'solado', label: 'Solado', options: ['Borracha Tratorada','Borracha Lisa','Couro','Gel'] },
  { key: 'formatoBico', label: 'Formato do Bico', options: ['Quadrado','Redondo','Semi Quadrado','Fino'] },
  { key: 'corVira', label: 'Cor da Vira', options: ['Natural','Preta','Marrom'] },
  { key: 'couroGaspea', label: 'Couro da Gáspea', options: ['Floater Tabaco','Floater Preto','Verniz','Camurça','Exótico'] },
  { key: 'couroCano', label: 'Couro do Cano', options: ['Floater Tabaco','Floater Preto','Verniz','Camurça','Exótico'] },
  { key: 'couroTaloneira', label: 'Couro da Taloneira', options: ['Floater Tabaco','Floater Preto','Verniz','Camurça'] },
  { key: 'bordadoCano', label: 'Bordado do Cano', options: ['Floral','Geométrico','Tribal','Liso','Personalizado','Laser'] },
  { key: 'bordadoGaspea', label: 'Bordado da Gáspea', options: ['Floral','Geométrico','Liso','Personalizado','Laser'] },
  { key: 'bordadoTaloneira', label: 'Bordado da Taloneira', options: ['Floral','Geométrico','Liso','Personalizado','Laser'] },
  { key: 'corLinha', label: 'Cor da Linha', options: ['Bege','Branca','Preta','Marrom','Vermelha','Azul','Café'] },
  { key: 'corBorrachinha', label: 'Cor da Borrachinha', options: ['Marrom','Preta','Natural'] },
  { key: 'trisce', label: 'Trisce', options: ['Sim','Não'] },
  { key: 'tiras', label: 'Tiras', options: ['Sem','Simples','Dupla','Franja'] },
  { key: 'metais', label: 'Metais', options: ['Sem','Fivela Prata','Fivela Dourada','Ponteira'] },
  { key: 'acessorios', label: 'Acessórios', options: ['Sem','Esporas','Pulseira','Canivete Bainha Rosa'] },
  { key: 'desenvolvimento', label: 'Desenvolvimento', options: ['Padrão','Desenvolvimento Novo'] },
  { key: 'vivo', label: 'Vivo', options: ['Branco','Preto','Marrom','Natural'] },
];

const TEXT_FIELDS = [
  { key: 'personalizacaoNome', label: 'Personalização de Nome / Carimbo a Fogo' },
  { key: 'personalizacaoBordado', label: 'Personalização do Bordado' },
  { key: 'observacao', label: 'Observação' },
];

const OrderPage = () => {
  const { isLoggedIn, user, addOrder } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const draftState = (location.state as { draft?: Draft })?.draft;
  const [draftId, setDraftId] = useState(draftState?.id || '');
  const [form, setForm] = useState<Record<string, string>>(draftState?.form || {});
  const [sobMedida, setSobMedida] = useState(draftState?.sobMedida || false);
  const [quantidade, setQuantidade] = useState(draftState?.quantidade || 1);
  const [numeroPedido, setNumeroPedido] = useState(draftState?.numeroPedido || '');
  const [fotos, setFotos] = useState<string[]>(draftState?.fotos || []);
  const [showMirror, setShowMirror] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isLoggedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-display font-bold mb-2">Faça login para criar pedidos</h2>
          <button onClick={() => navigate('/login')} className="orange-gradient text-primary-foreground px-6 py-2 rounded-lg font-bold">LOGIN</button>
        </div>
      </div>
    );
  }

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const temLaser = ['bordadoCano', 'bordadoGaspea', 'bordadoTaloneira'].some(k => form[k] === 'Laser');

  const basePrice = 650;
  const extraPrice = (form.couroGaspea === 'Exótico' || form.couroCano === 'Exótico' ? 250 : 0)
    + (form.bordadoCano === 'Personalizado' || form.bordadoGaspea === 'Personalizado' ? 120 : 0)
    + (form.metais && form.metais !== 'Sem' ? 90 : 0)
    + (sobMedida ? 150 : 0)
    + (form.personalizacaoNome ? 60 : 0);
  const unitPrice = basePrice + extraPrice;
  const total = unitPrice * quantidade;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setFotos(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (idx: number) => setFotos(prev => prev.filter((_, i) => i !== idx));

  const orderData = {
    numeroPedido: numeroPedido.trim(),
    vendedor: user?.nomeCompleto || '',
    tamanho: form.tamanho || '',
    modelo: form.modelo || '',
    solado: form.solado || '',
    formatoBico: form.formatoBico || '',
    corVira: form.corVira || '',
    couroGaspea: form.couroGaspea || '',
    couroCano: form.couroCano || '',
    couroTaloneira: form.couroTaloneira || '',
    bordadoCano: form.bordadoCano || '',
    bordadoGaspea: form.bordadoGaspea || '',
    bordadoTaloneira: form.bordadoTaloneira || '',
    personalizacaoNome: form.personalizacaoNome || '',
    personalizacaoBordado: form.personalizacaoBordado || '',
    corLinha: form.corLinha || '',
    corBorrachinha: form.corBorrachinha || '',
    trisce: form.trisce || '',
    tiras: form.tiras || '',
    metais: form.metais || '',
    acessorios: form.acessorios || '',
    desenvolvimento: form.desenvolvimento || '',
    sobMedida,
    observacao: form.observacao || '',
    quantidade,
    preco: unitPrice,
    temLaser,
    fotos,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroPedido.trim()) {
      toast.error('Preencha o Número do Pedido!');
      return;
    }
    setShowMirror(true);
  };

  const confirmOrder = () => {
    addOrder(orderData);
    toast.success('Pedido criado com sucesso!');
    navigate('/relatorios');
  };

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const mirrorDetails = [
    ['Vendedor', orderData.vendedor], ['Número', orderData.numeroPedido],
    ['Modelo', orderData.modelo], ['Tamanho', orderData.tamanho],
    ['Solado', orderData.solado], ['Formato do Bico', orderData.formatoBico],
    ['Cor da Vira', orderData.corVira], ['C. Gáspea', orderData.couroGaspea],
    ['C. Cano', orderData.couroCano], ['C. Taloneira', orderData.couroTaloneira],
    ['B. Cano', orderData.bordadoCano], ['B. Gáspea', orderData.bordadoGaspea],
    ['B. Taloneira', orderData.bordadoTaloneira], ['Personalização', orderData.personalizacaoNome],
    ['Cor Linha', orderData.corLinha], ['Borrachinha', orderData.corBorrachinha],
    ['Vivo', form.vivo || ''], ['Trisce', orderData.trisce],
    ['Tiras', orderData.tiras], ['Metais', orderData.metais],
    ['Acessórios', orderData.acessorios], ['Quantidade', String(orderData.quantidade)],
    ['Valor Unit.', formatCurrency(unitPrice)], ['Total', formatCurrency(total)],
  ].filter(([, v]) => v);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold mb-6">Ficha de Produção</h1>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 md:p-8 western-shadow space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Vendedor</label>
              <input type="text" value={user?.nomeCompleto || ''} readOnly className="w-full bg-muted rounded-lg px-4 py-2.5 text-sm border border-border opacity-70" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Número do Pedido *</label>
              <input type="text" value={numeroPedido} onChange={e => setNumeroPedido(e.target.value)} placeholder="Ex: 7E-20250001" required className="w-full bg-muted rounded-lg px-4 py-2.5 text-sm border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ORDER_FIELDS.map(f => (
              <div key={f.key}>
                <label className="block text-sm font-semibold mb-1">{f.label}</label>
                <select
                  value={form[f.key] || ''}
                  onChange={e => update(f.key, e.target.value)}
                  className="w-full bg-muted rounded-lg px-4 py-2.5 text-sm border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none"
                >
                  <option value="">Selecione...</option>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          {TEXT_FIELDS.map(f => (
            <div key={f.key}>
              <label className="block text-sm font-semibold mb-1">{f.label}</label>
              <input
                type="text"
                value={form[f.key] || ''}
                onChange={e => update(f.key, e.target.value)}
                className="w-full bg-muted rounded-lg px-4 py-2.5 text-sm border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          ))}

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2">Fotos de Referência</label>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-muted border border-border rounded-lg text-sm font-semibold hover:border-primary transition-colors">
              <Upload size={16} /> Adicionar Fotos
            </button>
            {fotos.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {fotos.map((foto, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                    <img src={foto} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePhoto(i)} className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" checked={sobMedida} onChange={e => setSobMedida(e.target.checked)} id="sobMedida" className="accent-primary w-4 h-4" />
            <label htmlFor="sobMedida" className="text-sm font-semibold">Sob Medida (+R$150)</label>
          </div>

          {temLaser && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm">
              ⚡ Este pedido contém <strong>Laser</strong> — prazo de produção: <strong>30 dias úteis</strong>
            </div>
          )}

          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold">Quantidade:</label>
            <input type="number" min={1} value={quantidade} onChange={e => setQuantidade(Math.max(1, Number(e.target.value)))} className="w-20 bg-muted rounded-md px-3 py-2 text-sm border border-border focus:border-primary outline-none" />
          </div>

          <div className="bg-muted rounded-lg p-4">
            <div className="flex justify-between text-sm mb-1"><span>Base</span><span>{formatCurrency(basePrice)}</span></div>
            <div className="flex justify-between text-sm mb-1"><span>Extras</span><span>{formatCurrency(extraPrice)}</span></div>
            <div className="flex justify-between text-sm mb-1"><span>Quantidade</span><span>×{quantidade}</span></div>
            <div className="flex justify-between text-lg font-bold border-t border-border pt-2 mt-2">
              <span>Total</span><span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <button type="submit" className="w-full orange-gradient text-primary-foreground py-3 rounded-lg font-bold tracking-wider hover:opacity-90 transition-opacity text-lg flex items-center justify-center gap-2">
            <Eye size={20} /> CONFERIR E FINALIZAR PEDIDO
          </button>
        </form>
      </motion.div>

      {/* Order Mirror / Preview */}
      {showMirror && (
        <div className="fixed inset-0 z-50 bg-foreground/60 flex items-center justify-center p-4" onClick={() => setShowMirror(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl p-6 md:p-8 western-shadow max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-display font-bold mb-1 text-center">ESPELHO DA FICHA DE PRODUÇÃO</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">Confira todas as informações antes de finalizar</p>

            <div className="border border-border rounded-lg p-4 mb-4">
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                {mirrorDetails.map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-sm text-muted-foreground">{label}:</span>
                    <span className="text-sm font-semibold">{value}</span>
                  </div>
                ))}
              </div>

              {orderData.observacao && (
                <div className="mt-3 bg-muted rounded-lg p-3">
                  <span className="text-xs font-semibold">Observação:</span>
                  <p className="text-sm">{orderData.observacao}</p>
                </div>
              )}

              {fotos.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-semibold">Fotos de Referência:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {fotos.map((f, i) => (
                      <img key={i} src={f} alt={`Ref ${i + 1}`} className="w-20 h-20 object-cover rounded border border-border" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowMirror(false)} className="flex-1 bg-muted text-foreground py-3 rounded-lg font-bold hover:bg-muted/80 transition-colors">
                EDITAR
              </button>
              <button onClick={confirmOrder} className="flex-1 orange-gradient text-primary-foreground py-3 rounded-lg font-bold hover:opacity-90 transition-opacity">
                OK — FINALIZAR
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;
