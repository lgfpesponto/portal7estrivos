import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { saveDraft, deleteDraft, Draft } from '@/lib/drafts';
import { Upload, X, Eye } from 'lucide-react';
import {
  MODELOS, TAMANHOS, ACESSORIOS, TIPOS_COURO, CORES_COURO, COURO_PRECOS,
  BORDADOS, LASER_OPTIONS, LASER_PRECO, COR_GLITTER, COR_LINHA, COR_BORRACHINHA,
  COR_VIVO, DESENVOLVIMENTO, AREA_METAL, TIPO_METAL, COR_METAL,
  STRASS_PRECO, CRUZ_METAL_PRECO, BRIDAO_METAL_PRECO, SOLADO, COR_SOLA, COR_VIRA,
  CARIMBO, SOB_MEDIDA_PRECO, NOME_BORDADO_PRECO, ESTAMPA_PRECO,
  PINTURA_PRECO, TRICE_PRECO, TIRAS_PRECO, COSTURA_ATRAS_PRECO,
} from '@/lib/orderFieldsConfig';

/* ───── helpers ───── */
const cls = {
  label: 'block text-sm font-semibold mb-1',
  select: 'w-full bg-muted rounded-lg px-4 py-2.5 text-sm border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none',
  input: 'w-full bg-muted rounded-lg px-4 py-2.5 text-sm border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none',
  inputSmall: 'bg-muted rounded-lg px-3 py-2 text-sm border border-border focus:border-primary outline-none',
  checkItem: 'flex items-center gap-2 text-sm',
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h3 className="text-base font-display font-bold border-b border-border pb-1">{title}</h3>
    {children}
  </div>
);

const ToggleField = ({
  label, value, onChange, textValue, onTextChange, textPlaceholder,
}: {
  label: string; value: boolean; onChange: (v: boolean) => void;
  textValue?: string; onTextChange?: (v: string) => void; textPlaceholder?: string;
}) => (
  <div className="flex flex-wrap items-center gap-3">
    <span className="text-sm font-semibold min-w-[120px]">{label}:</span>
    <select value={value ? 'tem' : 'nao'} onChange={e => onChange(e.target.value === 'tem')} className={cls.inputSmall + ' w-28'}>
      <option value="nao">Não tem</option>
      <option value="tem">Tem</option>
    </select>
    {textValue !== undefined && onTextChange && (
      <input type="text" value={textValue} onChange={e => onTextChange(e.target.value)} placeholder={textPlaceholder || 'Descreva...'} className={cls.inputSmall + ' flex-1 min-w-[180px]'} />
    )}
  </div>
);

const MultiSelect = ({
  label, items, selected, onChange,
}: {
  label: string; items: { label: string; preco: number }[]; selected: string[]; onChange: (v: string[]) => void;
}) => (
  <div>
    <label className={cls.label}>{label}</label>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-52 overflow-y-auto border border-border rounded-lg p-3 bg-muted/50">
      {items.map(item => (
        <label key={item.label} className={cls.checkItem}>
          <input
            type="checkbox"
            checked={selected.includes(item.label)}
            onChange={e => {
              if (e.target.checked) onChange([...selected, item.label]);
              else onChange(selected.filter(s => s !== item.label));
            }}
            className="accent-primary w-4 h-4"
          />
          <span>{item.label} <span className="text-muted-foreground text-xs">(R${item.preco})</span></span>
        </label>
      ))}
    </div>
  </div>
);

/* ───── main component ───── */
const OrderPage = () => {
  const { isLoggedIn, user, addOrder } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const draftState = (location.state as { draft?: Draft })?.draft;
  const [draftId, setDraftId] = useState(draftState?.id || '');

  /* form state */
  const [numeroPedido, setNumeroPedido] = useState(draftState?.numeroPedido || '');
  const [tamanho, setTamanho] = useState('');
  const [modelo, setModelo] = useState('');
  const [sobMedida, setSobMedida] = useState(false);
  const [sobMedidaDesc, setSobMedidaDesc] = useState('');
  const [acessorios, setAcessorios] = useState<string[]>([]);

  // couros
  const [tipoCouroCano, setTipoCouroCano] = useState('');
  const [corCouroCano, setCorCouroCano] = useState('');
  const [tipoCouroGaspea, setTipoCouroGaspea] = useState('');
  const [corCouroGaspea, setCorCouroGaspea] = useState('');
  const [tipoCouroTaloneira, setTipoCouroTaloneira] = useState('');
  const [corCouroTaloneira, setCorCouroTaloneira] = useState('');

  // bordados
  const [bordadoCano, setBordadoCano] = useState<string[]>([]);
  const [corBordadoCano, setCorBordadoCano] = useState('');
  const [bordadoGaspea, setBordadoGaspea] = useState<string[]>([]);
  const [corBordadoGaspea, setCorBordadoGaspea] = useState('');
  const [bordadoTaloneira, setBordadoTaloneira] = useState<string[]>([]);
  const [corBordadoTaloneira, setCorBordadoTaloneira] = useState('');

  // nome bordado
  const [nomeBordado, setNomeBordado] = useState(false);
  const [nomeBordadoDesc, setNomeBordadoDesc] = useState('');

  // laser
  const [laser, setLaser] = useState('');
  const [corGlitter, setCorGlitter] = useState('');
  const [corLinha, setCorLinha] = useState('');
  const [corBorrachinha, setCorBorrachinha] = useState('');
  const [corVivo, setCorVivo] = useState('');

  // estampa
  const [estampa, setEstampa] = useState(false);
  const [desenvolvimento, setDesenvolvimento] = useState('');

  // metais
  const [areaMetal, setAreaMetal] = useState('');
  const [tipoMetal, setTipoMetal] = useState<string[]>([]);
  const [corMetal, setCorMetal] = useState('');
  const [strass, setStrass] = useState(false);
  const [strassQtd, setStrassQtd] = useState(0);
  const [cruzMetal, setCruzMetal] = useState(false);
  const [cruzMetalQtd, setCruzMetalQtd] = useState(0);
  const [bridaoMetal, setBridaoMetal] = useState(false);
  const [bridaoMetalQtd, setBridaoMetalQtd] = useState(0);

  // extras
  const [pintura, setPintura] = useState(false);
  const [pinturaDesc, setPinturaDesc] = useState('');
  const [trice, setTrice] = useState(false);
  const [triceDesc, setTriceDesc] = useState('');
  const [tiras, setTiras] = useState(false);
  const [tirasDesc, setTirasDesc] = useState('');

  // solado
  const [solado, setSolado] = useState('');
  const [corSola, setCorSola] = useState('');
  const [corVira, setCorVira] = useState('');
  const [costuraAtras, setCosturaAtras] = useState(false);

  // carimbo
  const [carimbo, setCarimbo] = useState('');
  const [carimboDesc, setCarimboDesc] = useState('');

  const [observacao, setObservacao] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
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

  /* ───── price calculation ───── */
  const modeloPreco = MODELOS.find(m => m.label === modelo)?.preco || 0;

  const acessoriosPreco = acessorios.reduce((sum, a) => sum + (ACESSORIOS.find(x => x.label === a)?.preco || 0), 0);

  const couroPreco = [tipoCouroCano, tipoCouroGaspea, tipoCouroTaloneira]
    .reduce((sum, t) => sum + (COURO_PRECOS[t] || 0), 0);

  const bordadoPreco = [...bordadoCano, ...bordadoGaspea, ...bordadoTaloneira]
    .reduce((sum, b) => sum + (BORDADOS.find(x => x.label === b)?.preco || 0), 0);

  const laserPreco = laser ? LASER_PRECO : 0;
  const desenvPreco = DESENVOLVIMENTO.find(d => d.label === desenvolvimento)?.preco || 0;

  const areaMetalPreco = AREA_METAL.find(a => a.label === areaMetal)?.preco || 0;
  const strassPreco = strass ? strassQtd * STRASS_PRECO : 0;
  const cruzMetalPrecoTotal = cruzMetal ? cruzMetalQtd * CRUZ_METAL_PRECO : 0;
  const bridaoMetalPrecoTotal = bridaoMetal ? bridaoMetalQtd * BRIDAO_METAL_PRECO : 0;

  const soladoPreco = SOLADO.find(s => s.label === solado)?.preco || 0;
  const corSolaPreco = COR_SOLA.find(c => c.label === corSola)?.preco || 0;
  const corViraPreco = COR_VIRA.find(c => c.label === corVira)?.preco || 0;
  const carimboPreco = CARIMBO.find(c => c.label === carimbo)?.preco || 0;

  const total = modeloPreco
    + (sobMedida ? SOB_MEDIDA_PRECO : 0)
    + acessoriosPreco + couroPreco + bordadoPreco
    + (nomeBordado ? NOME_BORDADO_PRECO : 0)
    + laserPreco
    + (estampa ? ESTAMPA_PRECO : 0)
    + desenvPreco + areaMetalPreco + strassPreco + cruzMetalPrecoTotal + bridaoMetalPrecoTotal
    + (pintura ? PINTURA_PRECO : 0)
    + (trice ? TRICE_PRECO : 0)
    + (tiras ? TIRAS_PRECO : 0)
    + soladoPreco + corSolaPreco + corViraPreco
    + (costuraAtras ? COSTURA_ATRAS_PRECO : 0)
    + carimboPreco;

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  /* ───── photo upload ───── */
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => { if (ev.target?.result) setFotos(prev => [...prev, ev.target!.result as string]); };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  /* ───── submit ───── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroPedido.trim()) { toast.error('Preencha o Número do Pedido!'); return; }
    setShowMirror(true);
  };

  const confirmOrder = () => {
    addOrder({
      numeroPedido: numeroPedido.trim(),
      vendedor: user?.nomeCompleto || '',
      tamanho, modelo, sobMedida,
      solado, quantidade: 1, preco: total, temLaser: !!laser, fotos,
      // pack everything into these fields for storage
      couroGaspea: tipoCouroGaspea, couroCano: tipoCouroCano, couroTaloneira: tipoCouroTaloneira,
      bordadoCano: bordadoCano.join(', '), bordadoGaspea: bordadoGaspea.join(', '),
      bordadoTaloneira: bordadoTaloneira.join(', '),
      corLinha, corBorrachinha: corBorrachinha,
      trisce: trice ? 'Sim' : 'Não',
      tiras: tiras ? 'Sim' : 'Não',
      metais: areaMetal,
      acessorios: acessorios.join(', '),
      desenvolvimento, observacao,
      formatoBico: '', corVira,
      personalizacaoNome: nomeBordado ? nomeBordadoDesc : '',
      personalizacaoBordado: '',
    } as any);
    if (draftId) deleteDraft(draftId);
    toast.success('Pedido criado com sucesso!');
    navigate('/relatorios');
  };

  const handleSaveDraft = () => {
    if (!user) return;
    const id = draftId || `draft-${Date.now()}`;
    saveDraft({ id, userId: user.id, savedAt: new Date().toISOString(), form: {}, sobMedida, quantidade: 1, numeroPedido, fotos });
    setDraftId(id);
    toast.success('Rascunho salvo!');
  };

  /* ───── mirror data (only filled fields, NO value) ───── */
  const mirrorRows: [string, string][] = [
    ['Vendedor', user?.nomeCompleto || ''],
    ['Número do Pedido', numeroPedido],
    ['Tamanho', tamanho],
    ['Modelo', modelo],
    ['Sob Medida', sobMedida ? `Sim${sobMedidaDesc ? ' — ' + sobMedidaDesc : ''}` : ''],
    ['Acessórios', acessorios.join(', ')],
    ['Tipo Couro Cano', tipoCouroCano],
    ['Cor Couro Cano', corCouroCano],
    ['Tipo Couro Gáspea', tipoCouroGaspea],
    ['Cor Couro Gáspea', corCouroGaspea],
    ['Tipo Couro Taloneira', tipoCouroTaloneira],
    ['Cor Couro Taloneira', corCouroTaloneira],
    ['Bordado Cano', bordadoCano.join(', ')],
    ['Cor Bordado Cano', corBordadoCano],
    ['Bordado Gáspea', bordadoGaspea.join(', ')],
    ['Cor Bordado Gáspea', corBordadoGaspea],
    ['Bordado Taloneira', bordadoTaloneira.join(', ')],
    ['Cor Bordado Taloneira', corBordadoTaloneira],
    ['Nome Bordado', nomeBordado ? nomeBordadoDesc || 'Sim' : ''],
    ['Laser', laser],
    ['Cor Glitter/Tecido', corGlitter],
    ['Cor da Linha', corLinha],
    ['Cor Borrachinha', corBorrachinha],
    ['Cor do Vivo', corVivo],
    ['Estampa', estampa ? 'Sim' : ''],
    ['Desenvolvimento', desenvolvimento],
    ['Área Metal', areaMetal],
    ['Tipo Metal', tipoMetal.join(', ')],
    ['Cor Metal', corMetal],
    ['Strass', strass ? `${strassQtd} un.` : ''],
    ['Cruz (metal)', cruzMetal ? `${cruzMetalQtd} un.` : ''],
    ['Bridão (metal)', bridaoMetal ? `${bridaoMetalQtd} un.` : ''],
    ['Pintura', pintura ? pinturaDesc || 'Sim' : ''],
    ['Tricê', trice ? triceDesc || 'Sim' : ''],
    ['Tiras', tiras ? tirasDesc || 'Sim' : ''],
    ['Solado', solado],
    ['Cor da Sola', corSola],
    ['Cor da Vira', corVira],
    ['Costura Atrás', costuraAtras ? 'Sim' : ''],
    ['Carimbo a Fogo', carimbo ? `${carimbo}${carimboDesc ? ' — ' + carimboDesc : ''}` : ''],
    ['Observação', observacao],
    ['Quantidade', '1'],
  ].filter(([, v]) => v) as [string, string][];

  /* ───── select helper ───── */
  const SelectField = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] | { label: string; preco: number }[] }) => (
    <div>
      <label className={cls.label}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className={cls.select}>
        <option value="">Selecione...</option>
        {options.map(o => {
          const lbl = typeof o === 'string' ? o : o.label;
          const extra = typeof o === 'string' ? '' : o.preco ? ` (R$${o.preco})` : '';
          return <option key={lbl} value={lbl}>{lbl}{extra}</option>;
        })}
      </select>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold mb-6">Ficha de Produção</h1>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 md:p-8 western-shadow space-y-6">

          {/* 1-2 Vendedor + Número */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={cls.label}>Vendedor</label>
              <input type="text" value={user?.nomeCompleto || ''} readOnly className={cls.input + ' opacity-70'} />
            </div>
            <div>
              <label className={cls.label}>Número do Pedido *</label>
              <input type="text" value={numeroPedido} onChange={e => setNumeroPedido(e.target.value)} placeholder="Ex: 7E-20250001" required className={cls.input} />
            </div>
          </div>

          {/* 3-4 Tamanho + Modelo */}
          <div className="grid sm:grid-cols-2 gap-4">
            <SelectField label="Tamanho" value={tamanho} onChange={setTamanho} options={TAMANHOS} />
            <SelectField label="Modelo" value={modelo} onChange={setModelo} options={MODELOS} />
          </div>

          {/* 5 Sob Medida */}
          <ToggleField label="Sob Medida (+R$50)" value={sobMedida} onChange={setSobMedida} textValue={sobMedidaDesc} onTextChange={setSobMedidaDesc} textPlaceholder="Descreva a medida..." />

          {/* 6 Acessórios */}
          <MultiSelect label="Acessórios" items={ACESSORIOS} selected={acessorios} onChange={setAcessorios} />

          {/* 7 Couros */}
          <Section title="Couros">
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectField label="Tipo Couro do Cano" value={tipoCouroCano} onChange={setTipoCouroCano} options={TIPOS_COURO} />
              <SelectField label="Cor Couro do Cano" value={corCouroCano} onChange={setCorCouroCano} options={CORES_COURO} />
              <SelectField label="Tipo Couro da Gáspea" value={tipoCouroGaspea} onChange={setTipoCouroGaspea} options={TIPOS_COURO} />
              <SelectField label="Cor Couro da Gáspea" value={corCouroGaspea} onChange={setCorCouroGaspea} options={CORES_COURO} />
              <SelectField label="Tipo Couro da Taloneira" value={tipoCouroTaloneira} onChange={setTipoCouroTaloneira} options={TIPOS_COURO} />
              <SelectField label="Cor Couro da Taloneira" value={corCouroTaloneira} onChange={setCorCouroTaloneira} options={CORES_COURO} />
            </div>
          </Section>

          {/* 8-13 Bordados */}
          <Section title="Bordados">
            <MultiSelect label="Bordado do Cano" items={BORDADOS} selected={bordadoCano} onChange={setBordadoCano} />
            <div><label className={cls.label}>Cor do Bordado do Cano</label><input type="text" value={corBordadoCano} onChange={e => setCorBordadoCano(e.target.value)} className={cls.input} /></div>

            <MultiSelect label="Bordado da Gáspea" items={BORDADOS} selected={bordadoGaspea} onChange={setBordadoGaspea} />
            <div><label className={cls.label}>Cor do Bordado da Gáspea</label><input type="text" value={corBordadoGaspea} onChange={e => setCorBordadoGaspea(e.target.value)} className={cls.input} /></div>

            <MultiSelect label="Bordado da Taloneira" items={BORDADOS} selected={bordadoTaloneira} onChange={setBordadoTaloneira} />
            <div><label className={cls.label}>Cor do Bordado da Taloneira</label><input type="text" value={corBordadoTaloneira} onChange={e => setCorBordadoTaloneira(e.target.value)} className={cls.input} /></div>
          </Section>

          {/* 14 Nome Bordado */}
          <ToggleField label="Nome Bordado (+R$50)" value={nomeBordado} onChange={setNomeBordado} textValue={nomeBordadoDesc} onTextChange={setNomeBordadoDesc} textPlaceholder="Nome, cor, local..." />

          {/* 15-16 Laser + Glitter */}
          <div className="grid sm:grid-cols-2 gap-4">
            <SelectField label={`Laser (+R$${LASER_PRECO})`} value={laser} onChange={setLaser} options={LASER_OPTIONS} />
            <SelectField label="Cor Glitter/Tecido" value={corGlitter} onChange={setCorGlitter} options={COR_GLITTER} />
          </div>

          {/* 17-19 Linha, Borrachinha, Vivo */}
          <div className="grid sm:grid-cols-3 gap-4">
            <SelectField label="Cor da Linha" value={corLinha} onChange={setCorLinha} options={COR_LINHA} />
            <SelectField label="Cor da Borrachinha" value={corBorrachinha} onChange={setCorBorrachinha} options={COR_BORRACHINHA} />
            <SelectField label="Cor do Vivo" value={corVivo} onChange={setCorVivo} options={COR_VIVO} />
          </div>

          {/* 20-21 Estampa + Desenvolvimento */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <ToggleField label={`Estampa (+R$${ESTAMPA_PRECO})`} value={estampa} onChange={setEstampa} />
            </div>
            <SelectField label="Desenvolvimento" value={desenvolvimento} onChange={setDesenvolvimento} options={DESENVOLVIMENTO} />
          </div>

          {/* 22 Metais */}
          <Section title="Metais">
            <div className="grid sm:grid-cols-3 gap-4">
              <SelectField label="Área do Metal" value={areaMetal} onChange={setAreaMetal} options={AREA_METAL} />
              <div>
                <label className={cls.label}>Tipo do Metal</label>
                <div className="flex flex-col gap-1">
                  {TIPO_METAL.map(t => (
                    <label key={t} className={cls.checkItem}>
                      <input type="checkbox" checked={tipoMetal.includes(t)} onChange={e => {
                        if (e.target.checked) setTipoMetal(prev => [...prev, t]);
                        else setTipoMetal(prev => prev.filter(x => x !== t));
                      }} className="accent-primary w-4 h-4" />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
              <SelectField label="Cor do Metal" value={corMetal} onChange={setCorMetal} options={COR_METAL} />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <ToggleField label="Strass (R$0,50/un)" value={strass} onChange={setStrass} />
                {strass && <input type="number" min={0} value={strassQtd} onChange={e => setStrassQtd(Math.max(0, Number(e.target.value)))} className={cls.inputSmall + ' w-20'} placeholder="Qtd" />}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <ToggleField label="Cruz (R$6/un)" value={cruzMetal} onChange={setCruzMetal} />
                {cruzMetal && <input type="number" min={0} value={cruzMetalQtd} onChange={e => setCruzMetalQtd(Math.max(0, Number(e.target.value)))} className={cls.inputSmall + ' w-20'} placeholder="Qtd" />}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <ToggleField label="Bridão (R$3/un)" value={bridaoMetal} onChange={setBridaoMetal} />
                {bridaoMetal && <input type="number" min={0} value={bridaoMetalQtd} onChange={e => setBridaoMetalQtd(Math.max(0, Number(e.target.value)))} className={cls.inputSmall + ' w-20'} placeholder="Qtd" />}
              </div>
            </div>
          </Section>

          {/* 23-25 Pintura, Tricê, Tiras */}
          <ToggleField label={`Pintura (+R$${PINTURA_PRECO})`} value={pintura} onChange={setPintura} textValue={pinturaDesc} onTextChange={setPinturaDesc} textPlaceholder="Cor da tinta..." />
          <ToggleField label={`Tricê (+R$${TRICE_PRECO})`} value={trice} onChange={setTrice} textValue={triceDesc} onTextChange={setTriceDesc} textPlaceholder="Cor do tricê..." />
          <ToggleField label={`Tiras (+R$${TIRAS_PRECO})`} value={tiras} onChange={setTiras} textValue={tirasDesc} onTextChange={setTirasDesc} textPlaceholder="Cor das tiras..." />

          {/* 26-28 Solado, Sola, Vira */}
          <div className="grid sm:grid-cols-3 gap-4">
            <SelectField label="Tipo de Solado" value={solado} onChange={setSolado} options={SOLADO} />
            <SelectField label="Cor da Sola" value={corSola} onChange={setCorSola} options={COR_SOLA} />
            <SelectField label="Cor da Vira" value={corVira} onChange={setCorVira} options={COR_VIRA} />
          </div>

          {/* 29 Costura Atrás */}
          <ToggleField label={`Costura Atrás (+R$${COSTURA_ATRAS_PRECO})`} value={costuraAtras} onChange={setCosturaAtras} />

          {/* 30 Carimbo a Fogo */}
          <Section title="Carimbo a Fogo">
            <div className="flex flex-wrap items-center gap-3">
              <select value={carimbo} onChange={e => setCarimbo(e.target.value)} className={cls.inputSmall + ' w-44'}>
                <option value="">Sem carimbo</option>
                {CARIMBO.map(c => <option key={c.label} value={c.label}>{c.label} (R${c.preco})</option>)}
              </select>
              <input type="text" value={carimboDesc} onChange={e => setCarimboDesc(e.target.value)} placeholder="Quais carimbos e onde..." className={cls.inputSmall + ' flex-1 min-w-[180px]'} />
            </div>
          </Section>

          {/* 31 Observação */}
          <div>
            <label className={cls.label}>Observação</label>
            <textarea value={observacao} onChange={e => setObservacao(e.target.value)} rows={3} className={cls.input + ' min-h-[80px]'} />
          </div>

          {/* 32 Fotos */}
          <div>
            <label className={cls.label}>Fotos de Referência</label>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-muted border border-border rounded-lg text-sm font-semibold hover:border-primary transition-colors">
              <Upload size={16} /> Adicionar Fotos
            </button>
            {fotos.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {fotos.map((foto, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                    <img src={foto} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setFotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 33 Quantidade */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold">Quantidade:</label>
            <input type="number" value={1} readOnly className={cls.inputSmall + ' w-20 opacity-70'} />
          </div>

          {/* 34 Valor Total */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Valor Total</span><span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <button type="submit" className="w-full orange-gradient text-primary-foreground py-3 rounded-lg font-bold tracking-wider hover:opacity-90 transition-opacity text-lg flex items-center justify-center gap-2">
            <Eye size={20} /> CONFERIR E FINALIZAR PEDIDO
          </button>
          <button type="button" onClick={handleSaveDraft} className="w-full border-2 border-primary text-primary py-3 rounded-lg font-bold tracking-wider hover:bg-primary/10 transition-colors text-lg flex items-center justify-center gap-2">
            SALVAR RASCUNHO
          </button>
        </form>
      </motion.div>

      {/* ───── Mirror ───── */}
      {showMirror && (
        <div className="fixed inset-0 z-50 bg-foreground/60 flex items-center justify-center p-4" onClick={() => setShowMirror(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-xl p-6 md:p-8 western-shadow max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-display font-bold mb-1 text-center">ESPELHO DA FICHA DE PRODUÇÃO</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">Confira todas as informações antes de finalizar</p>

            <div className="border border-border rounded-lg p-4 mb-4">
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                {mirrorRows.map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-sm text-muted-foreground">{label}:</span>
                    <span className="text-sm font-semibold text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>
              {fotos.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-semibold">Fotos de Referência:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {fotos.map((f, i) => <img key={i} src={f} alt={`Ref ${i + 1}`} className="w-20 h-20 object-cover rounded border border-border" />)}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowMirror(false)} className="flex-1 bg-muted text-foreground py-3 rounded-lg font-bold hover:bg-muted/80 transition-colors">EDITAR</button>
              <button onClick={confirmOrder} className="flex-1 orange-gradient text-primary-foreground py-3 rounded-lg font-bold hover:opacity-90 transition-opacity">OK — FINALIZAR</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;
