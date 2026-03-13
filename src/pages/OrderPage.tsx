import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const ORDER_FIELDS = [
  { key: 'tamanho', label: 'Tamanho', options: ['34','35','36','37','38','39','40','41','42','43','44','45'] },
  { key: 'modelo', label: 'Modelo', options: ['Texana Clássica','Country Premium','Rodeio Special','Selaria Gold','Cowboy Elite'] },
  { key: 'solado', label: 'Solado', options: ['Borracha Tratorada','Borracha Lisa','Couro','Gel'] },
  { key: 'formatoBico', label: 'Formato do Bico', options: ['Quadrado','Redondo','Semi Quadrado','Fino'] },
  { key: 'corVira', label: 'Cor da Vira', options: ['Natural','Preta','Marrom'] },
  { key: 'couroGaspea', label: 'Couro da Gáspea', options: ['Floater Tabaco','Floater Preto','Verniz','Camurça','Exótico'] },
  { key: 'couroCano', label: 'Couro do Cano', options: ['Floater Tabaco','Floater Preto','Verniz','Camurça','Exótico'] },
  { key: 'couroTaloneira', label: 'Couro da Taloneira', options: ['Floater Tabaco','Floater Preto','Verniz','Camurça'] },
  { key: 'bordadoCano', label: 'Bordado do Cano', options: ['Floral','Geométrico','Tribal','Liso','Personalizado'] },
  { key: 'bordadoGaspea', label: 'Bordado da Gáspea', options: ['Floral','Geométrico','Liso','Personalizado'] },
  { key: 'bordadoTaloneira', label: 'Bordado da Taloneira', options: ['Floral','Geométrico','Liso','Personalizado'] },
  { key: 'corLinha', label: 'Cor da Linha', options: ['Bege','Branca','Preta','Marrom','Vermelha','Azul'] },
  { key: 'corBorrachinha', label: 'Cor da Borrachinha', options: ['Marrom','Preta','Natural'] },
  { key: 'trisce', label: 'Trisce', options: ['Sim','Não'] },
  { key: 'tiras', label: 'Tiras', options: ['Sem','Simples','Dupla','Franja'] },
  { key: 'metais', label: 'Metais', options: ['Sem','Fivela Prata','Fivela Dourada','Ponteira'] },
  { key: 'acessorios', label: 'Acessórios', options: ['Sem','Esporas','Pulseira'] },
  { key: 'desenvolvimento', label: 'Desenvolvimento', options: ['Padrão','Desenvolvimento Novo'] },
];

const TEXT_FIELDS = [
  { key: 'personalizacaoNome', label: 'Personalização de Nome / Carimbo a Fogo' },
  { key: 'personalizacaoBordado', label: 'Personalização do Bordado' },
  { key: 'observacao', label: 'Observação' },
];

const OrderPage = () => {
  const { isLoggedIn, user, addOrder } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<Record<string, string>>({});
  const [sobMedida, setSobMedida] = useState(false);
  const [quantidade, setQuantidade] = useState(1);

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

  // Simple price calculation
  const basePrice = 650;
  const extraPrice = (form.couroGaspea === 'Exótico' || form.couroCano === 'Exótico' ? 250 : 0)
    + (form.bordadoCano === 'Personalizado' || form.bordadoGaspea === 'Personalizado' ? 120 : 0)
    + (form.metais && form.metais !== 'Sem' ? 90 : 0)
    + (sobMedida ? 150 : 0)
    + (form.personalizacaoNome ? 60 : 0);
  const unitPrice = basePrice + extraPrice;
  const total = unitPrice * quantidade;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addOrder({
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
    });
    toast.success('Pedido criado com sucesso!');
    navigate('/acompanhar');
  };

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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

          <div className="flex items-center gap-3">
            <input type="checkbox" checked={sobMedida} onChange={e => setSobMedida(e.target.checked)} id="sobMedida" className="accent-primary w-4 h-4" />
            <label htmlFor="sobMedida" className="text-sm font-semibold">Sob Medida (+R$150)</label>
          </div>

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

          <button type="submit" className="w-full orange-gradient text-primary-foreground py-3 rounded-lg font-bold tracking-wider hover:opacity-90 transition-opacity text-lg">
            FINALIZAR PEDIDO
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default OrderPage;
